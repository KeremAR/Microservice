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
from typing import Optional, Dict, Any
from supabase import create_client, Client
from prometheus_client import make_asgi_app, Counter, Histogram, Gauge
import time

load_dotenv()

app = FastAPI(title="User Service")

# Add prometheus metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Define Prometheus metrics
REQUEST_COUNT = Counter('user_service_request_count', 'Total requests to User Service', ['method', 'endpoint', 'status_code'])
REQUEST_LATENCY = Histogram('user_service_request_latency_seconds', 'Request latency in seconds', ['method', 'endpoint'])
AUTH_SUCCESS = Counter('user_service_auth_success', 'Successfully authenticated requests', ['method', 'endpoint'])
AUTH_FAILURE = Counter('user_service_auth_failure', 'Failed authentication attempts', ['method', 'endpoint'])
DB_CONNECTIONS = Gauge('user_service_db_connections', 'Number of DB connections')
USERS_REGISTERED_TOTAL = Counter('users_registered_total', 'Total number of users registered')

# Middleware to track request metrics
@app.middleware("http")
async def metrics_middleware(request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    request_path = request.url.path
    request_method = request.method
    status_code = response.status_code
    
    # Skip tracking metrics endpoints
    if not request_path.startswith("/metrics"):
        REQUEST_COUNT.labels(request_method, request_path, status_code).inc()
        REQUEST_LATENCY.labels(request_method, request_path).observe(time.time() - start_time)
    
    return response

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

# Supabase init
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase_client: Optional[Client] = None

# PostgreSQL connection
def get_db_connection():
    # Supabase PostgreSQL bağlantısı
    host = os.getenv("SUPABASE_DB_HOST", "postgres")  # Default olarak yerel postgres container
    port = os.getenv("SUPABASE_DB_PORT", "5432")
    database = os.getenv("SUPABASE_DB_NAME", "postgres")
    user = os.getenv("SUPABASE_DB_USER", "postgres")
    password = os.getenv("SUPABASE_DB_PASSWORD", "postgres")
    
    print(f"Connecting to PostgreSQL: host={host}, port={port}, database={database}, user={user}")
    
    # Docker içinde postgres container'ına bağlanma
    if host == "ahrhnlmeimlxttvujmpa.supabase.co":
        print("Attempting to connect to Supabase...")
        try:
            return psycopg2.connect(
                host=host,
                port=port,
                database=database,
                user=user,
                password=password,
                sslmode="require"  # Supabase için SSL gerekli
            )
        except Exception as e:
            print(f"Supabase connection failed: {e}")
            print("Falling back to local PostgreSQL...")
            # Yerel PostgreSQL'e fail-over
            return psycopg2.connect(
                host="postgres",
                port="5432",
                database="userdb",  # Docker-compose'daki postgres container'ının DB adı
                user="postgres",
                password="postgres"
            )
    else:
        # Yerel PostgreSQL bağlantısı
        return psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password
        )

# Supabase client'ı alır veya oluşturur
def get_supabase_client() -> Optional[Client]:
    global supabase_client
    if supabase_client is None and SUPABASE_URL and SUPABASE_KEY:
        try:
            print(f"Initializing Supabase client with URL: {SUPABASE_URL}")
            print(f"Supabase key (first 10 chars): {SUPABASE_KEY[:10]}...")
            supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
            print("Supabase client initialized successfully")
            
            # Test connection by querying a simple table
            try:
                test_response = supabase_client.table('users').select('count', count='exact').limit(1).execute()
                print(f"Supabase connection test successful. Count: {test_response.count if hasattr(test_response, 'count') else 'unknown'}")
            except Exception as test_err:
                print(f"Supabase connection test failed: {test_err}")
        except Exception as e:
            print(f"Failed to initialize Supabase client: {e}")
            import traceback
            traceback.print_exc()
    return supabase_client

# Supabase veritabanı erişim fonksiyonları
async def create_user_in_supabase(user_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Supabase REST API kullanarak kullanıcı oluşturur"""
    client = get_supabase_client()
    if not client:
        print("Supabase client not available, skipping Supabase user creation")
        return None
    
    try:
        print(f"Creating user in Supabase: {user_data['email']}")
        # Log user data without sensitive info
        safe_data = {k: v for k, v in user_data.items() if k != 'firebase_uid'}
        print(f"User data to insert: {safe_data}")
        
        # First check if the 'users' table exists
        try:
            table_query = client.table('users').select('count', count='exact').limit(1).execute()
            print(f"'users' table exists with count: {table_query.count if hasattr(table_query, 'count') else 'unknown'}")
        except Exception as table_err:
            # Table might not exist
            print(f"Error checking 'users' table: {table_err}")
            print("Attempting to create the table...")
            try:
                # Try to create a minimal users table
                # Note: This is a simplified approach, in production you'd use migrations
                # This might not work if the user doesn't have appropriate permissions
                # Also, this is not a standard Supabase API feature, just an example
                print("Supabase API doesn't support table creation. Please create the table manually in Supabase dashboard.")
                return None
            except Exception as create_err:
                print(f"Failed to create 'users' table: {create_err}")
                return None
        
        # Now try to insert the user
        response = client.table('users').insert(user_data).execute()
        print(f"Supabase user creation response: {response}")
        if hasattr(response, 'error') and response.error:
            print(f"Supabase error: {response.error}")
            return None
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"Error creating user in Supabase: {e}")
        import traceback
        traceback.print_exc()
        return None

async def get_user_from_supabase(filters: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Supabase REST API kullanarak kullanıcı bilgilerini getirir"""
    client = get_supabase_client()
    if not client:
        print("Supabase client not available, skipping Supabase user lookup")
        return None
    
    try:
        print(f"Getting user from Supabase with filters: {filters}")
        query = client.table('users').select('*')
        
        # Filtreleri ekle
        for key, value in filters.items():
            query = query.eq(key, value)
        
        response = query.execute()
        print(f"Supabase user lookup response data count: {len(response.data)}")
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"Error getting user from Supabase: {e}")
        return None

# Create user table if not exists
def init_db():
    # PostgreSQL tablosunu oluşturmak yerine sadece Supabase client'ı başlat
    try:
        # Supabase API'yi başlat
        supabase_client = get_supabase_client()
        if supabase_client:
            print("Supabase client initialized successfully")
        else:
            print("WARNING: Supabase client initialization failed or credentials missing")
    except Exception as e:
        print(f"Error initializing Supabase client: {e}")

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
    role = getattr(user_data, 'role', 'user') or 'user'
    department_id = getattr(user_data, 'department_id', None)
    
    try:
        # Sadece Supabase üzerinden kullanıcı kontrolü
        supabase_user = await get_user_from_supabase({"email": email})
        
        if supabase_user:
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
        
        # Kullanıcı verilerini hazırla
        user_data_dict = {
            "id": user_id,
            "email": email,
            "firebase_uid": firebase_user.uid,
            "name": name,
            "surname": surname,
            "role": role,
            "phone_number": phone_number,
            "is_active": True,
            "department_id": department_id
        }
        
        # Kullanıcıyı Supabase'e kaydet
        supabase_result = await create_user_in_supabase(user_data_dict)
        supabase_saved = False
        
        if supabase_result:
            print(f"User successfully saved to Supabase: {email}")
            supabase_saved = True
            USERS_REGISTERED_TOTAL.inc()
        else:
            print(f"WARNING: Failed to save user to Supabase, continuing with Firebase only: {email}")
            # Firebase'de kullanıcı oluşturuldu, ancak Supabase'e kaydedilemedi
            # Bu noktada kullanıcıyı yine de oluşturmaya devam ediyoruz
        
        # Send domain event to RabbitMQ
        event = UserCreatedEvent.create(
            user_id=user_id,
            email=email,
            metadata={"source": "user_service", "operation": "signup", "supabase_saved": supabase_saved}
        )
        await send_message_to_rabbitmq(event, "user")
        
        return JSONResponse(content={
            "status": "success",
            "code": 201,
            "message": f"User created successfully with id {user_id}",
            "user_id": user_id,
            "email": email,
            "name": name,
            "surname": surname,
            "supabase_saved": supabase_saved,
            "warning": None if supabase_saved else "User created in Firebase but not saved to Supabase database"
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

@app.post("/auth/login")
async def login(user_data: LoginSchema):
    email = user_data.email
    password = user_data.password
    
    try:
        # Get user by email from Firebase
        firebase_user = auth.get_user_by_email(email)
        
        # Create custom token
        custom_token = auth.create_custom_token(firebase_user.uid)
        
        # Supabase'den kullanıcı bilgilerini al
        user_db = await get_user_from_supabase({"firebase_uid": firebase_user.uid})
        supabase_available = True
        
        if not user_db:
            # Kullanıcı Firebase'de var ama Supabase'de yoksa
            print(f"User exists in Firebase but not in Supabase: {email}")
            supabase_available = False
            
            # Kullanıcı bilgilerini Firebase'den al
            user_id = firebase_user.uid
            user_db = {
                "id": user_id,
                "email": email,
                "firebase_uid": firebase_user.uid,
                "name": email.split("@")[0],  # Basit bir varsayılan ad
                "surname": "",
                "role": "user",
                "is_active": True,
                "department_id": None
            }
            
            # Gelecekte Supabase'e kaydetmeyi dene
            user_data_dict = user_db.copy()
            supabase_result = await create_user_in_supabase(user_data_dict)
            if supabase_result:
                print(f"User successfully synced to Supabase during login: {email}")
                user_db = supabase_result
                supabase_available = True
            else:
                print(f"WARNING: Failed to sync user to Supabase during login: {email}")
        
        # Role değerini doğru alma
        user_role = 'user'  # Varsayılan değer
        if user_db and user_db.get('role') is not None and user_db.get('role') != '':
            user_role = user_db.get('role')
            
        print(f"LOGIN - User role: '{user_role}', Raw value: '{user_db.get('role')}'")
        
        # Send domain event to RabbitMQ
        event = UserLoggedInEvent.create(
            user_id=firebase_user.uid,
            email=email,
            metadata={"source": "user_service", "operation": "login", "supabase_available": supabase_available}
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
            "role": user_role,
            "department_id": user_db.get('department_id'),
            "is_active": user_db['is_active'],
            "supabase_available": supabase_available,
            "warning": None if supabase_available else "User exists in Firebase but not in Supabase, using fallback data"
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
    firebase_data = None
    
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
        
        # Firebase'den kullanıcı bilgilerini alalım (fallback için)
        try:
            firebase_data = auth.get_user(user_id)
            print(f"Got Firebase user data for {user_id}: {firebase_data.email}")
        except Exception as fb_err:
            print(f"Error getting Firebase data: {fb_err}")
        
        # Supabase'den kullanıcı bilgilerini al
        user_data = await get_user_from_supabase({"firebase_uid": user_id})
        
        # Kullanıcı bulunamazsa id ile tekrar deneyelim
        if not user_data:
            user_data = await get_user_from_supabase({"id": user_id})
        
        supabase_available = True
        
        # Kullanıcı Supabase'de bulunamazsa, Firebase bilgilerini kullan
        if not user_data and firebase_data:
            print(f"User not found in Supabase, using Firebase data: {firebase_data.email}")
            supabase_available = False
            
            # Firebase verilerinden bir kullanıcı profili oluştur
            user_data = {
                "id": user_id,
                "email": firebase_data.email,
                "firebase_uid": user_id,
                "name": firebase_data.display_name or firebase_data.email.split('@')[0],
                "surname": "",
                "role": "user",
                "phone_number": firebase_data.phone_number or "",
                "is_active": not firebase_data.disabled,
                "department_id": None
            }
            
            # Gelecekte Supabase'e kaydetmeyi dene
            supabase_result = await create_user_in_supabase(user_data)
            if supabase_result:
                print(f"User successfully synced to Supabase during profile request: {firebase_data.email}")
                user_data = supabase_result
                supabase_available = True
            else:
                print(f"WARNING: Failed to sync user to Supabase during profile request: {firebase_data.email}")
        
        # Hiçbir şekilde kullanıcı bulunamazsa 404 hatası ver
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
            
        print(f"PROFILE - User role: '{user_role}', Raw value: '{user_data.get('role')}'")
        
        # Profil bilgilerini döndür
        return JSONResponse(content={
            "status": "success",
            "code": 200,
            "user_id": user_data['id'],
            "name": user_data['name'] or user_data['email'].split('@')[0],
            "surname": user_data['surname'] or "",
            "email": user_data['email'],
            "role": user_role,
            "phone_number": user_data.get('phone_number') or "",
            "is_active": user_data['is_active'],
            "department_id": user_data.get('department_id'),
            "supabase_available": supabase_available,
            "warning": None if supabase_available else "User profile from Firebase, not found in Supabase"
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)