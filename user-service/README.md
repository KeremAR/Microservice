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
    *   **Aggregate Root:** `User.java`
    *   **Description:** Represents a user in the system. It includes user details (username, email, names) and their associated roles (`Set<Role>`). It also includes the unique `entraId` obtained from Microsoft Entra ID for authentication. **(Previously used password field is now inactive due to Entra ID integration).**
    *   **Consistency:** Ensures that a User object maintains valid state (e.g., required fields like `email` and `entraId`). Role assignments are managed to maintain relationships.
*   **Role Aggregate:**
    *   **Aggregate Root:** `Role.java`
    *   **Description:** Represents a user role (e.g., STUDENT, STAFF, ADMIN). It's a simpler aggregate containing the role's ID and name (`ERole`).

### Domain Events

Domain events represent significant occurrences within the domain that other parts of the system might be interested in. They help decouple components.

*   **`UserRegisteredEvent`** (Note: Currently Not Published to RabbitMQ)
    *   **Description:** Published when a new user successfully registers (This event is associated with the older JWT-based registration/login flow, which is currently inactive due to the switch to Microsoft Entra ID authentication). If the JWT flow is reactivated, this event would be triggered.
    *   **Data:** Contains `userId`, `username`, `email`, and `registeredAt` timestamp.
    *   **Current Handling:** Handled internally by `UserEventListener` for logging purposes only.
    *   **Potential Listeners:** Could trigger welcome emails, create default profiles in other services, etc.
*   **`UserProfileUpdatedEvent`** (Published to RabbitMQ)
    *   **Description:** Published when a user's profile information (specifically, first name or last name) is updated via the `PUT /api/users/{id}` endpoint.
    *   **Data:** Contains `userId`, `oldEmail`, `newEmail`, and `updatedAt` timestamp. (Note: The current implementation sends the same email for old and new as email updates are not handled via this endpoint).
    *   **Current Handling:** Handled internally by `UserEventListener` for logging, AND published to the `campus_events_exchange` Topic Exchange on RabbitMQ with the routing key `user.profile.updated` by `UserProfileEventListener`.
    *   **Potential Listeners:** Could trigger notifications, update data caches in other services, synchronize information with other systems.

**RabbitMQ Integration Status:**
*   The service successfully **publishes** the `UserProfileUpdatedEvent` to RabbitMQ.
*   The service **does not currently consume/listen** to any events from RabbitMQ.
*   The main exchange used is `campus_events_exchange` (Topic type).

## API Endpoints

Refer to the Swagger UI (`http://localhost:8081/swagger-ui.html`) for a detailed and interactive API documentation. Authentication for protected endpoints requires a valid Bearer token obtained from Microsoft Entra ID.

Key endpoints include:

*   `GET /api/users/me`: Get the current authenticated user's details (Requires Entra ID authentication).
*   `GET /api/users/{id}`: Get user details by internal database ID (Requires Entra ID authentication).
*   `PUT /api/users/{id}`: Update the authenticated user's `firstName` and `lastName` (Requires Entra ID authentication, publishes `UserProfileUpdatedEvent`).
*   `GET /api/users/entra/{entraId}`: Get user details by Entra ID (OID) (Requires Entra ID authentication and potentially specific roles like ADMIN).

*Note: The older JWT-based `/api/auth/register` and `/api/auth/login` endpoints are currently inactive due to the migration to Microsoft Entra ID.* 