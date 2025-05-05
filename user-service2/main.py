from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
import firebase_admin
from firebase_admin import credentials, auth
import os
import uuid
import psycopg2
from psycopg2.extras import RealDictCursor
from models.user_model import SignUpSchema, LoginSchema
from models.events import UserCreatedEvent, UserLoggedInEvent
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
from aio_pika import connect, Message, ExchangeType, DeliveryMode

load_dotenv()

app = FastAPI(title="User Service")

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tüm kaynaklar (güvenlik için sınırlandırabilirsiniz)
    allow_credentials=True,
    allow_methods=["*"],  # Tüm HTTP metodları
    allow_headers=["*"],  # Tüm header'lar
)

# Firebase init
if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

# PostgreSQL connection
def get_db_connection():
    return psycopg2.connect(os.getenv("DATABASE_URL"))

# Create user table if not exists
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(36) PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            firebase_uid VARCHAR(100) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    cursor.close()
    conn.close()

# RabbitMQ connection settings
RABBITMQ_URL = "amqp://user:password@rabbitmq:5672"
EXCHANGE_NAME = "campuscaution_exchange"

# Global variables to store RabbitMQ connections
rabbitmq_connection = None
rabbitmq_channel = None
rabbitmq_exchange = None

async def setup_rabbitmq():
    global rabbitmq_connection, rabbitmq_channel, rabbitmq_exchange
    
    max_retries = 10
    retry_delay = 5  # seconds
    
    for attempt in range(1, max_retries + 1):
        try:
            print(f"Attempting to connect to RabbitMQ (attempt {attempt}/{max_retries})...")
            rabbitmq_connection = await connect(RABBITMQ_URL)
            rabbitmq_channel = await rabbitmq_connection.channel()
            
            # Declare exchange
            rabbitmq_exchange = await rabbitmq_channel.declare_exchange(
                EXCHANGE_NAME,
                ExchangeType.DIRECT,
                durable=True
            )
            
            # Declare queues
            user_queue = await rabbitmq_channel.declare_queue("user_queue", durable=True)
            load_queue = await rabbitmq_channel.declare_queue("load_queue", durable=True)
            
            # Bind queues to exchange
            await user_queue.bind(rabbitmq_exchange, routing_key="user")
            await load_queue.bind(rabbitmq_exchange, routing_key="load")
            
            print("Successfully connected to RabbitMQ")
            return
            
        except Exception as e:
            print(f"Failed to connect to RabbitMQ: {e}")
            if attempt < max_retries:
                print(f"Retrying in {retry_delay} seconds...")
                await asyncio.sleep(retry_delay)
            else:
                print("Maximum retry attempts reached. Could not connect to RabbitMQ.")
                raise

async def send_message(routing_key, message):
    if not rabbitmq_exchange:
        raise Exception("RabbitMQ not initialized")
    
    if isinstance(message, dict):
        message_body = json.dumps(message).encode()
    else:
        message_body = json.dumps(message.dict()).encode()
    
    await rabbitmq_exchange.publish(
        Message(
            message_body,
            content_type="application/json",
            delivery_mode=DeliveryMode.PERSISTENT
        ),
        routing_key=routing_key
    )

async def consume_messages(queue_name, callback):
    if not rabbitmq_channel:
        raise Exception("RabbitMQ not initialized")
    
    # Get the existing queue without declaring it again
    queue = await rabbitmq_channel.get_queue(queue_name)
    
    async with queue.iterator() as queue_iter:
        async for message in queue_iter:
            async with message.process():
                data = json.loads(message.body.decode())
                await callback(data)

async def handle_load_message(data):
    """Process incoming messages from other services"""
    try:
        event_type = data.get("event_type", "unknown")
        print(f"Received event: {event_type}")
        
        if event_type == "user.created":
            print(f"New user created: {data.get('user_id')} - {data.get('email')}")
            # Process user creation event
            # e.g., initialize user preferences, send welcome email, etc.
            
        elif event_type == "user.logged_in":
            print(f"User logged in: {data.get('user_id')} - {data.get('email')}")
            # Process user login event
            # e.g., update last login timestamp, track login activity, etc.
            
        else:
            print(f"Unknown event type: {event_type}")
            print(f"Message data: {data}")
            
    except Exception as e:
        print(f"Error processing message: {e}")
        print(f"Message data: {data}")

async def send_message_to_rabbitmq(message, routing_key: str):
    max_retries = 3
    retry_delay = 2  # seconds
    
    for attempt in range(1, max_retries + 1):
        try:
            # Use global connection if available
            if rabbitmq_exchange and rabbitmq_connection and rabbitmq_connection.is_closed is False:
                await send_message(routing_key, message)
                print(f" [x] Event sent: {message.event_type if hasattr(message, 'event_type') else ''}")
                return
                
            # Otherwise create a new connection
            connection = await connect(RABBITMQ_URL)
            async with connection: 
                channel = await connection.channel()
                exchange = await channel.declare_exchange(
                    EXCHANGE_NAME,
                    ExchangeType.DIRECT,
                    durable=True
                )
                
                if isinstance(message, dict):
                    message_body = json.dumps(message).encode()
                else:
                    message_body = json.dumps(message.dict()).encode()
                    
                await exchange.publish(
                    Message(
                        body=message_body, 
                        content_type="application/json",
                        delivery_mode=DeliveryMode.PERSISTENT
                    ),
                    routing_key=routing_key
                )
                print(f" [x] Event sent: {message.event_type if hasattr(message, 'event_type') else ''}")
                return
        except Exception as e:
            print(f"Failed to send message to RabbitMQ: {e}")
            if attempt < max_retries:
                print(f"Retrying in {retry_delay} seconds...")
                await asyncio.sleep(retry_delay)
            else:
                print(f"Could not send message after {max_retries} attempts")
                # Don't raise exception to prevent API failures when RabbitMQ is down

@app.on_event("startup")
async def startup():
    init_db()
    await setup_rabbitmq()
    # Start consuming messages in the background
    # asyncio.create_task(consume_messages("user_queue", handle_load_message))

@app.on_event("shutdown")
async def shutdown_event():
    if rabbitmq_connection:
        await rabbitmq_connection.close()

@app.post("/auth/signup")
async def signup(user_data: SignUpSchema):
    email = user_data.email
    password = user_data.password
    
    try:
        # Check if user already exists in PostgreSQL
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail={
                    "status": "error",
                    "code": 400,
                    "message": "Email already exists in database"
                }
            )
        
        # Create user in Firebase
        user_id = str(uuid.uuid4())
        firebase_user = auth.create_user(uid=user_id, email=email, password=password)
        
        # Save user in PostgreSQL
        cursor.execute(
            "INSERT INTO users (id, email, firebase_uid) VALUES (%s, %s, %s)",
            (user_id, email, firebase_user.uid)
        )
        conn.commit()
        
        # Send domain event to RabbitMQ
        event = UserCreatedEvent.create(
            user_id=user_id,
            email=email,
            metadata={"source": "user_service", "operation": "signup"}
        )
        await send_message_to_rabbitmq(event, "user")
        
        return JSONResponse(content={
            "status": "success",
            "code": 201,
            "message": f"User created successfully with id {user_id}"
        }, status_code=201)
    
    except auth.EmailAlreadyExistsError:
        raise HTTPException(status_code=400, detail={
            "status": "error", 
            "code": 400,
            "message": "Email already exists in Firebase"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail={
            "status": "error",
            "code": 500,
            "message": f"Internal Server Error: {str(e)}"
        })
    finally:
        cursor.close()
        conn.close()

@app.post("/auth/login")
async def login(user_data: LoginSchema):
    email = user_data.email
    password = user_data.password
    
    try:
        # Get user by email from Firebase
        user = auth.get_user_by_email(email)
        
        # Create custom token
        custom_token = auth.create_custom_token(user.uid)
        
        # Send domain event to RabbitMQ
        event = UserLoggedInEvent.create(
            user_id=user.uid,
            email=email,
            metadata={"source": "user_service", "operation": "login"}
        )
        await send_message_to_rabbitmq(event, "user")
        
        return JSONResponse(content={
            "status": "success",
            "code": 200,
            "message": "User logged in successfully",
            "token": custom_token.decode()
        })
    except Exception as e:
        raise HTTPException(status_code=401, detail={
            "status": "error",
            "code": 401,
            "message": "Invalid Credentials",
            "details": {
                "error_description": str(e)
            }
        })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)