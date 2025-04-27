# User Service

This service is responsible for managing users, roles, and authentication in the Campus Issue Management System.

## Technologies Used

*   Java 17
*   Spring Boot 3.x
*   Spring Security (with JWT)
*   Spring Data JPA
*   PostgreSQL
*   SpringDoc OpenAPI (Swagger UI)
*   Lombok
*   Maven
*   Docker
*   RabbitMQ (for potential event-driven communication)

## Running the Service

### Using Docker (Recommended)

1.  Make sure you have Docker and Docker Compose installed.
2.  Navigate to the `user-service` directory in your terminal.
3.  Run the command: `docker-compose up --build`
    *   This will build the service image (if not already built or if changes were made) and start the service along with PostgreSQL and RabbitMQ containers.
4.  The service will be available at `http://localhost:8080`.
5.  Swagger UI will be available at `http://localhost:8080/swagger-ui.html`.

To stop the services:

```bash
docker-compose down
```

### Running Locally (Requires PostgreSQL and RabbitMQ running separately)

1.  Make sure you have Java 17 and Maven installed.
2.  Ensure PostgreSQL is running (e.g., via Docker or local installation) and accessible.
3.  Ensure RabbitMQ is running and accessible.
4.  Set the `JWT_SECRET` environment variable to a strong secret key. This is required for the JWT authentication flow.
5.  Update the `application.properties` file (`src/main/resources/application.properties`) with your database and RabbitMQ connection details if they differ from the defaults.
6.  Navigate to the `user-service` directory in your terminal.
7.  Run the command: `docker compose up --d --build`

## Domain-Driven Design Concepts

This service utilizes some concepts from Domain-Driven Design (DDD).

### Aggregates

Aggregates are clusters of domain objects that can be treated as a single unit. They ensure data consistency within their boundaries.

*   **User Aggregate:**
    *   **Aggregate Root:** `User.java` (`src/main/java/com/campus/userservice/model/User.java`)
    *   **Description:** Represents a user in the system. It includes user details (email, names) and their associated roles (`Set<ERole>`). It includes the unique `entraId` obtained from Microsoft Entra ID which is the primary identifier for authentication. **Note:** The `username` and `password` fields still exist in the entity but are considered inactive for the primary authentication flow which relies on Entra ID.
    *   **Consistency:** Ensures that a User object maintains valid state (e.g., required fields like `email`). Role assignments are managed via the `roles` collection.
*   **Role Aggregate:**
    *   **Aggregate Root:** `ERole.java` (Enum used within `User`) (`src/main/java/com/campus/userservice/model/ERole.java`)
    *   **Description:** Represents a user role (e.g., STUDENT, STAFF, ADMIN) as an Enum (`ERole`). It's embedded within the `User` aggregate.

### Domain Events

Domain events represent significant occurrences within the domain.

*   **`UserRegisteredEvent`** (`src/main/java/com/campus/userservice/domain/events/UserRegisteredEvent.java`)
    *   **Description:** Published when a new user successfully registers via the `POST /api/auth/signup` endpoint.
    *   **Data:** Contains `userId`, `username`, `email`, and `registeredAt` timestamp.
    *   **Current Handling:** Handled internally by `UserEventListener` (`.../domain/listeners/UserEventListener.java`) for logging purposes only. **It is NOT published to RabbitMQ.**
    *   **Potential Listeners:** Could trigger welcome emails, etc.
*   **`UserProfileUpdatedEvent`** (`src/main/java/com/campus/userservice/domain/events/UserProfileUpdatedEvent.java`)
    *   **Description:** Published when a user's profile information (`firstName` or `lastName`) is updated via the `PUT /api/users/{id}` endpoint.
    *   **Data:** Contains `userId`, `oldEmail`, `newEmail` (currently sends the user's current email for both fields as email updates are not handled via this specific event/endpoint), and `updatedAt` timestamp.
    *   **Current Handling:**
        *   Logged internally by `UserEventListener`.
        *   Published to the `campus_events_exchange` Topic Exchange on RabbitMQ with the routing key `user.profile.updated` by `UserProfileEventListener` (`.../domain/listeners/UserProfileEventListener.java`).
    *   **Potential Listeners:** Other services interested in user profile changes (e.g., notification service, issue service).

**RabbitMQ Integration Status:**
*   The service successfully **publishes** the `UserProfileUpdatedEvent` to RabbitMQ.
*   The service **does not currently consume/listen** to any events *from* RabbitMQ.
*   The main exchange used is `campus_events_exchange` (Topic type).
*   RabbitMQ configuration is managed in `RabbitMQConfig.java` (`src/main/java/com/campus/userservice/config/RabbitMQConfig.java`).

## API Endpoints

Refer to the Swagger UI (`http://localhost:8080/swagger-ui.html`) for detailed API documentation.

This service now supports two primary authentication methods:
1.  **Microsoft Entra ID (OAuth2 Bearer Token):** Used for most API interactions after initial login, especially for securing resource access (e.g., fetching user data).
2.  **JWT (Email/Password):** Used for the traditional sign-up and sign-in process via `/api/auth` endpoints.

Authentication for protected endpoints generally requires a valid Bearer token (either from Entra ID or the JWT generated by `/api/auth/signin`).

Key endpoints include:

*   `/api/auth/signup`: Register a new user with email and password.
*   `/api/auth/signin`: Authenticate using email and password, returns a JWT.
*   `GET /api/users/me`: Get the current authenticated user's details (Requires Entra ID or JWT authentication).
*   `GET /api/users/{id}`: Get user details by internal database ID (Requires Entra ID or JWT authentication).
*   `PUT /api/users/{id}`: Update the authenticated user's `firstName` and `lastName` (Requires Entra ID or JWT authentication, publishes `UserProfileUpdatedEvent`).
*   `GET /api/users/entra/{entraId}`: Get user details by Entra ID (OID) (Requires Entra ID or JWT authentication).

