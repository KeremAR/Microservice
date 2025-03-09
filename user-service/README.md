# User Service

This is the User Service for the Campus Issue Management System. It handles user registration, authentication, and profile management.

## Features

- User registration and login
- JWT-based authentication
- Role-based access control (RBAC)
- User profile management

## Technologies

- Spring Boot 3.2.3
- Spring Security
- Spring Data JPA
- PostgreSQL
- JWT
- Swagger/OpenAPI

## API Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/users/{id}` - Get user by ID
- `PUT /api/users/{id}` - Update user profile
- `GET /api/users/me` - Get current user profile

## Running Locally

### Prerequisites

- Java 17
- Maven
- PostgreSQL

### Steps

1. Clone the repository
2. Configure PostgreSQL in `application.properties` if needed
3. Run the application:
   ```
   mvn spring-boot:run
   ```
4. Access the API at `http://localhost:8081`
5. Access Swagger UI at `http://localhost:8081/swagger-ui.html`

## Running with Docker

1. Navigate to the user-service directory:
   ```
   cd user-service
   ```

2. Build and run with Docker Compose:
   ```
   docker-compose up -d
   ```

3. To stop the containers:
   ```
   docker-compose down
   ```

4. To rebuild the image after making changes:
   ```
   docker-compose build
   docker-compose up -d
   ```

## Security

- JWT-based authentication
- Role-based access control with three roles:
  - ROLE_STUDENT
  - ROLE_STAFF
  - ROLE_ADMIN 