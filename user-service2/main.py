from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
import firebase_admin
from firebase_admin import credentials, auth
import os
import uuid
import psycopg2
from psycopg2.extras import RealDictCursor
from models.user_model import SignUpSchema, LoginSchema
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

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

@app.on_event("startup")
async def startup():
    init_db()

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