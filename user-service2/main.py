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
from fastapi import Depends, Header
import jwt

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
            name VARCHAR(100),
            surname VARCHAR(100),
            role VARCHAR(50) DEFAULT 'user',
            phone_number VARCHAR(20),
            is_active BOOLEAN DEFAULT TRUE,
            department_id VARCHAR(36),
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
    name = getattr(user_data, 'name', '') or ''
    surname = getattr(user_data, 'surname', '') or ''
    phone_number = getattr(user_data, 'phone_number', '') or ''
    
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
        
        # Save user in PostgreSQL with extended fields
        cursor.execute(
            """
            INSERT INTO users (id, email, firebase_uid, name, surname, role, phone_number, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (user_id, email, firebase_user.uid, name, surname, 'user', phone_number, True)
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
            "message": f"User created successfully with id {user_id}",
            "user_id": user_id,
            "email": email,
            "name": name,
            "surname": surname
        }, status_code=201)
    
    except auth.EmailAlreadyExistsError:
        raise HTTPException(status_code=400, detail={
            "status": "error", 
            "code": 400,
            "message": "Email already exists in Firebase"
        })
    except Exception as e:
        print(f"Signup error: {str(e)}")
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
        firebase_user = auth.get_user_by_email(email)
        
        # Create custom token
        custom_token = auth.create_custom_token(firebase_user.uid)
        
        # Veritabanından kullanıcı bilgilerini al
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("""
            SELECT id, email, name, surname, role, is_active, department_id
            FROM users
            WHERE firebase_uid = %s
        """, (firebase_user.uid,))
        user_db = cursor.fetchone()
        
        if not user_db:
            # Kullanıcı Firebase'de var ama veritabanında yoksa, ekleyelim
            user_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO users (id, email, firebase_uid, name, surname, role, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id, email, name, surname, role, is_active
            """, (user_id, email, firebase_user.uid, '', '', 'user', True))
            conn.commit()
            user_db = cursor.fetchone()
        
        # Role değerini doğru alma
        user_role = 'user'  # Varsayılan değer
        if user_db and user_db.get('role') is not None and user_db.get('role') != '':
            user_role = user_db.get('role')
            
        print(f"LOGIN - User role from DB: '{user_role}', Raw value: '{user_db.get('role')}'")
        
        # Send domain event to RabbitMQ
        event = UserLoggedInEvent.create(
            user_id=firebase_user.uid,
            email=email,
            metadata={"source": "user_service", "operation": "login"}
        )
        await send_message_to_rabbitmq(event, "user")
        
        return JSONResponse(content={
            "status": "success",
            "code": 200,
            "message": "User logged in successfully",
            "token": custom_token.decode(),
            "user_id": user_db['id'],
            "name": user_db['name'] or email.split('@')[0],
            "surname": user_db['surname'] or "",
            "email": email,
            "role": user_role,  # Düzeltilmiş role
            "department_id": user_db.get('department_id'),  # Sadece department_id dönüyoruz
            "is_active": user_db['is_active']
        })
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(status_code=401, detail={
            "status": "error",
            "code": 401,
            "message": "Invalid Credentials",
            "details": {
                "error_description": str(e)
            }
        })
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

# Yeni eklenen profil endpoint'i
@app.get("/users/profile")
async def get_profile(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail={
            "status": "error",
            "code": 401,
            "message": "Unauthorized request. Bearer token is required."
        })
    
    token = authorization.replace("Bearer ", "")
    user_id = None
    
    try:
        # Önce token'ı decode etmeyi deneyelim - custom token olabilir
        try:
            # Custom token'dan user_id bilgisini çıkarmak için
            decoded = jwt.decode(token, options={"verify_signature": False})
            print(f"Token decoded: {decoded}")
            
            # Custom token içinde uid alanı bulunur
            if 'uid' in decoded:
                user_id = decoded['uid']
                print(f"User ID from custom token: {user_id}")
            else:
                # Başka bir yöntem de deneyebiliriz
                # Bazen sub veya user_id alanlarında olabilir
                for field in ['sub', 'user_id', 'id']:
                    if field in decoded:
                        user_id = decoded[field]
                        print(f"User ID found in {field} field: {user_id}")
                        break
                
        except Exception as e:
            print(f"Token decode error: {e}")
        
        # Eğer hala user_id bulunamadıysa, Firebase'e başvuralım
        if not user_id:
            try:
                # Firebase token'ı doğrula
                decoded_token = auth.verify_id_token(token)
                user_id = decoded_token.get("uid")
                print(f"User ID from Firebase verify_id_token: {user_id}")
            except Exception as e:
                print(f"Firebase token verification error: {e}")
        
        # Hala user_id bulunamadıysa, hata döndürelim
        if not user_id:
            raise HTTPException(status_code=401, detail={
                "status": "error",
                "code": 401,
                "message": "Invalid token. Could not extract user ID."
            })
        
        # Veritabanındaki kullanıcı bilgilerini al
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Kullanıcının veritabanındaki bilgilerini al, firebase_uid ile eşleşen kullanıcıyı bul
        cursor.execute("""
            SELECT id, email, name, surname, role, phone_number, is_active, department_id 
            FROM users 
            WHERE firebase_uid = %s OR id = %s
        """, (user_id, user_id))
        user_data = cursor.fetchone()
        
        if not user_data:
            print(f"No user found with firebase_uid or id = {user_id}")
            raise HTTPException(status_code=404, detail={
                "status": "error",
                "code": 404,
                "message": "User not found"
            })
        
        # Role değerini doğru alma
        user_role = 'user'  # Varsayılan değer
        if user_data and user_data.get('role') is not None and user_data.get('role') != '':
            user_role = user_data.get('role')
            
        print(f"PROFILE - User role from DB: '{user_role}', Raw value: '{user_data.get('role')}'")
        
        # Profil bilgilerini döndür
        return JSONResponse(content={
            "status": "success",
            "code": 200,
            "user_id": user_data['id'],
            "name": user_data['name'] or user_data['email'].split('@')[0],
            "surname": user_data['surname'] or "",
            "email": user_data['email'],
            "role": user_role,  # Düzeltilmiş role
            "phone_number": user_data['phone_number'] or "",
            "is_active": user_data['is_active'],
            "department_id": user_data.get('department_id')  # Sadece department_id dönüyoruz
        })
        
    except Exception as e:
        print(f"Profile error: {str(e)}")
        raise HTTPException(status_code=401, detail={
            "status": "error",
            "code": 401,
            "message": "Failed to verify token or get user profile",
            "details": {
                "error_description": str(e)
            }
        })
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)