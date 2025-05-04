# Campus Caution User Service

This service handles user authentication and management for the Campus Caution application. It integrates with Auth0 for authentication and authorization.

## Features

- User management (CRUD operations)
- Role-based access control (student, staff, department_admin, superadmin)
- Auth0 integration
- Containerized with Docker
- PostgreSQL database

## Prerequisites

- Java 24
- Maven
- Docker and Docker Compose
- Auth0 account

## Auth0 Setup

1. Create a new Auth0 account or use an existing one
2. Create a new API with these settings:
   - Name: CampusCaution API V2
   - Identifier (Audience): https://api.campus-caution-v2.com
   - Signing Algorithm: RS256
   - RBAC: Enabled
   - Add Permissions in the Access Token: Enabled

3. Create the following permissions:
   - read:profile
   - report:issue
   - read:own_issues
   - read:department_issues
   - update:issue_status
   - claim:issue
   - assign:issue
   - read:department_staff
   - read:department_reports
   - read:all_issues
   - delete:issue
   - manage:roles
   - manage:departments

4. Create the following roles and assign appropriate permissions:
   - student
   - staff
   - department_admin
   - superadmin

## Configuration

Update the application.properties file with your Auth0 domain:

```
auth0.domain=YOUR_AUTH0_DOMAIN.auth0.com
```

## Running with Docker

1. Set the AUTH0_DOMAIN environment variable:

```sh
export AUTH0_DOMAIN=your-auth0-domain.auth0.com
```

2. Run the application using Docker Compose:

```sh
docker-compose up -d
```

## Running Locally

1. Start a PostgreSQL instance:

```sh
docker run -d -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=userservice postgres:16
```

2. Run the application:

```sh
./mvnw spring-boot:run
```

## API Endpoints

- `GET /api/public/health`: Health check endpoint
- `GET /api/users/me`: Get current user profile
- `POST /api/users`: Create a new user
- `PUT /api/users/{id}`: Update a user
- `GET /api/admin/users/{id}`: Get user by ID (admin only)
- `DELETE /api/admin/users/{id}`: Delete a user (admin only)

## Mobile App Integration

Mobile app users (students) will authenticate via Auth0 SDK. The app should:
1. Implement Auth0 SDK for authentication
2. Use the JWT token for API requests
3. Store the token securely on the device

## Web Portal Integration

Staff and admins will use the web portal which should:
1. Implement Auth0 Universal Login
2. Use the JWT token for API requests
3. Enforce role-based access control on the frontend 