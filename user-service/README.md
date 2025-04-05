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
    *   **Description:** Represents a user in the system. It includes user details (username, email, names, password) and their associated roles (`Set<Role>`). Operations like updating profile information or managing roles (though indirectly via repositories) are handled within the context of this aggregate.
    *   **Consistency:** Ensures that a User object maintains valid state (e.g., required fields). Role assignments are managed to maintain relationships.
*   **Role Aggregate:**
    *   **Aggregate Root:** `Role.java`
    *   **Description:** Represents a user role (e.g., STUDENT, STAFF, ADMIN). It's a simpler aggregate containing the role's ID and name (`ERole`).

### Domain Events

Domain events represent significant occurrences within the domain that other parts of the system might be interested in. They help decouple components.

*   **`UserRegisteredEvent`**
    *   **Description:** Published when a new user successfully registers.
    *   **Data:** Contains `userId`, `username`, `email`, and `registeredAt` timestamp.
    *   **Potential Listeners:** Could trigger welcome emails, create default profiles in other services, etc.
*   **`UserProfileUpdatedEvent`**
    *   **Description:** Published when a user's profile information (e.g., email) is updated.
    *   **Data:** Contains `userId`, `oldEmail`, `newEmail`, and `updatedAt` timestamp.
    *   **Potential Listeners:** Could trigger notifications, update data caches, synchronize information with other systems.

Currently, these events are published using Spring's `ApplicationEventPublisher` and handled by `UserEventListener` for logging purposes within the same service.

## API Endpoints

Refer to the Swagger UI (`http://localhost:8080/swagger-ui.html`) for a detailed and interactive API documentation.

Key endpoints include:

*   `POST /api/auth/register`: Register a new user.
*   `POST /api/auth/login`: Authenticate a user and get a JWT token.
*   `GET /api/users/{id}`: Get user details by ID (Requires authentication).
*   `PUT /api/users/{id}`: Update user details (Requires authentication).
*   `GET /api/me`: Get the current authenticated user's details (Requires authentication). 