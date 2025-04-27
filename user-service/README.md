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
4.  Update the `application.properties` file (`src/main/resources/application.properties`) with your database and RabbitMQ connection details if they differ from the defaults.
5.  Navigate to the `user-service` directory in your terminal.
6.  Run the command: `mvn spring-boot:run`

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
    *   **Description:** Associated with the older, **currently inactive**, JWT-based registration flow. If that flow were reactivated, this event would signify a new user registration.
    *   **Data:** Contains `userId`, `username`, `email`, and `registeredAt` timestamp.
    *   **Current Handling:** Handled internally by `UserEventListener` (`.../domain/listeners/UserEventListener.java`) for logging purposes only. **It is NOT published to RabbitMQ.**
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

Refer to the Swagger UI (`http://localhost:8081/swagger-ui.html`) for a detailed and interactive API documentation. Authentication for protected endpoints requires a valid Bearer token obtained from Microsoft Entra ID.

Key endpoints include:

*   `GET /api/users/me`: Get the current authenticated user's details (Requires Entra ID authentication).
*   `GET /api/users/{id}`: Get user details by internal database ID (Requires Entra ID authentication).
*   `PUT /api/users/{id}`: Update the authenticated user's `firstName` and `lastName` (Requires Entra ID authentication, publishes `UserProfileUpdatedEvent`).
*   `GET /api/users/entra/{entraId}`: Get user details by Entra ID (OID) (Requires Entra ID authentication).

*Note: The older JWT-based `/api/auth/register` and `/api/auth/login` endpoints are currently inactive due to the migration to Microsoft Entra ID.* 