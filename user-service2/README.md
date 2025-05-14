# User Service

## Overview

The User Service is responsible for managing user authentication, authorization, and account management. It provides secure user registration, login, and token functionality using Firebase Authentication.

## Features

- User registration and authentication
- Custom token generation
- Account management
- Event-driven integration with other services via RabbitMQ
- PostgreSQL integration for user data storage

## API Endpoints

| Method | Endpoint                     | Description                          | Authentication |
|--------|------------------------------|--------------------------------------|----------------|
| POST   | `/auth/signup`               | Register a new user                  | None           |
| POST   | `/auth/login`                | User login                           | None           |

## Example Requests

### User Registration

```bash
curl -X POST \
  http://localhost:8000/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
}'
```

Response:
```json
{
  "status": "success",
  "code": 201,
  "message": "User created successfully with id {user_id}"
}
```

### User Login

```bash
curl -X POST \
  http://localhost:8000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
}'
```

Response:
```json
{
  "status": "success",
  "code": 200,
  "message": "User logged in successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Tech Stack

- FastAPI
- Firebase Authentication
- PostgreSQL
- RabbitMQ for event messaging
- Docker for containerization
- Python 3.x

## Environment Variables

The service requires the following environment variables:

```bash
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/userdb
```

## Testing

The service includes comprehensive test coverage:

### Unit Tests
Unit tests validate individual components and models in isolation.

```bash
# Run only unit tests
pytest tests/unit/
```

### Integration Tests
Integration tests validate API endpoints and inter-component functionality.

```bash
# Run only integration tests
pytest tests/integration/
```

### Contract Tests
Contract tests ensure API responses conform to specified schemas.

```bash
# Run contract tests
pytest tests/integration/test_contract.py
```

### Running All Tests
```bash
# Run all tests with coverage report
pytest --cov=./ --cov-report=html
```

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment:

### Pipeline Stages

1. **Test**: Runs all unit and integration tests
2. **Lint**: Ensures code quality with flake8 and black
3. **Build**: Creates and pushes a Docker image to GitHub Container Registry
4. **Deploy**: Deploys the application to the target environment

The pipeline automatically runs on:
- Every push to main/master branch
- Every pull request to main/master branch

### Setting Up GitHub Actions

1. Make sure your repository has the GitHub Actions feature enabled
2. The workflow configuration is already defined in `.github/workflows/ci-cd.yml`
3. For deployment to work, you might need to add the following secrets:
   - `DOCKER_USERNAME` and `DOCKER_PASSWORD` (if using Docker Hub)
   - Environment-specific credentials (for deployment)

## Domain Events

The service publishes the following domain events to the RabbitMQ message broker:

### UserCreatedEvent
Triggered when a new user is registered. Contains the following data:

```json
{
  "event_id": "uuid-string",
  "event_type": "user.created", 
  "timestamp": "2023-05-24T12:34:56.789Z",
  "version": "1.0",
  "user_id": "user-uuid",
  "email": "user@example.com",
  "metadata": {
    "source": "user_service",
    "operation": "signup"
  }
}
```

### UserLoggedInEvent
Triggered when a user successfully logs in. Contains the following data:

```json
{
  "event_id": "uuid-string",
  "event_type": "user.logged_in",
  "timestamp": "2023-05-24T12:34:56.789Z",
  "version": "1.0",
  "user_id": "user-uuid",
  "email": "user@example.com",
  "login_timestamp": "2023-05-24T12:34:56.789Z",
  "metadata": {
    "source": "user_service",
    "operation": "login"
  }
}
```

These events use routing key "user" and are published to the "liftease_exchange" exchange.

## Running Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Run the service
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Docker

The service can be run using Docker Compose:

```bash
# Build and start all services
docker-compose up --build
```

This will start:
- User service (accessible at http://localhost:8000)
- PostgreSQL database
- RabbitMQ (management interface accessible at http://localhost:15672)

## Security

- Passwords are securely handled using Firebase Authentication
- User data is stored in PostgreSQL database
- RabbitMQ credentials are configured via environment variables 

## Supabase Entegrasyonu

Bu servis, veritabanı olarak Supabase PostgreSQL kullanacak şekilde yapılandırılabilir.

### Supabase Konfigürasyonu

1. Supabase'de bir proje oluşturun
2. Supabase proje ayarlarından PostgreSQL bağlantı bilgilerini alın
3. Aşağıdaki çevre değişkenlerini ayarlayın:

```
SUPABASE_DB_HOST=your-supabase-db-host.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-password
```

### Tablolar ve Şema

User servisi `user_schema` adlı bir şema kullanır ve tablolar bu şema içinde oluşturulur:

- `user_schema.users`: Kullanıcı bilgilerini tutar 