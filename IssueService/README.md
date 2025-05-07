# 📌 Issue Service

## 💪 Description

**IssueService** is an independent microservice designed for environments like a campus where users can report infrastructure/maintenance/cleanliness problems, 
track their statuses, and get real-time updates.

This service provides:
- Issue Reporting (with location data)
- Viewing Issue Details
- Retrieving User Issues
- Updating Issue Status
- Publishing events through RabbitMQ

---

## 🗂️ Technologies

| Technology | Description |
|------------|-------------|
| ASP.NET Core 8.0 | Backend API development |
| MongoDB | NoSQL Database |
| RabbitMQ | Event Message Broker |
| MediatR | Domain Event Publishing and In-memory Dispatch |
| Docker / Docker Compose | Containerization |
| Swagger (Swashbuckle) | API Documentation |
| C# | Programming Language |

---

## 📦 Domain Layer

The project uses a Domain-Driven Design (DDD) approach.

### 1. **Aggregate Root**
- The `Issue` class is the **Aggregate Root**.
- All operations like status updates are controlled via aggregate methods.
- Contains location data (latitude, longitude) for precise issue location tracking.

> 📂 Path: `Domain/IssueAggregate/Issue.cs`

### 2. **Domain Events**
- Domain Events are triggered automatically inside the aggregate.
- Events are published using MediatR.

| Event Name | Description |
|------------|-------------|
| `IssueCreatedEvent` | Triggered when a new issue is reported. |
| `IssueStatusChangedEvent` | Triggered when an issue's status is updated. |

> 📂 Path: `Domain/IssueAggregate/Events`

### 3. **Event Handlers**
- `IssueCreatedHandler` listens to `IssueCreatedEvent` and publishes a message to RabbitMQ.

> 📂 Path: `Application/Handlers/IssueCreatedHandler.cs`

---

## 📄 API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| `POST` | `/issues/report` | Report a new issue |
| `GET` | `/issues/{id}` | Retrieve issue details |
| `GET` | `/issues/user/{userId}` | Retrieve all issues for a specific user |
| `PUT` | `/issues/{id}/status` | Update issue status |

---

## 🛢️ Database Schema (MongoDB)

```json
{
  "_id": "ObjectId",
  "title": "Pipe burst",
  "description": "Water leak in Engineering Building.",
  "category": "Infrastructure",
  "photoUrl": "https://example.com/photo.jpg",
  "userId": "12345",
  "departmentId": 3,
  "latitude": 41.0082,
  "longitude": 28.9784,
  "status": "Pending",
  "createdAt": "2025-04-20T12:00:00Z"
}
```

---

## 🐇 RabbitMQ Integration

- **Queue Name**: `issue_created`
- Events are published in JSON format.

Example event payload:

```json
{
  "Id": "608d5e47b6f1a3c6c03fef01",
  "Title": "Broken sidewalk tile",
  "UserId": "user-123",
  "DepartmentId": 3,
  "Category": "Infrastructure",
  "Latitude": 41.0082,
  "Longitude": 28.9784,
  "CreatedAt": "2025-04-20T14:22:00Z"
}
```

> 📂 Publisher Class: `Messaging/RabbitMQProducer.cs`

---

## 🧪 Unit Tests

Comprehensive unit tests have been written for the Issue Service. These tests verify the core functionality and error handling of the service.

### Test Coverage

#### Controller Tests (IssueControllerTests)
1. **Report_ValidRequest_ReturnsOkResult**
   - Verifies successful processing of a valid issue creation request
   - Validates OK (200) response

2. **GetIssue_ExistingIssue_ReturnsOkResult**
   - Verifies successful retrieval of an existing issue
   - Validates OK (200) response and correct issue data

3. **GetIssue_NonExistingIssue_ReturnsNotFound**
   - Verifies NotFound (404) response for non-existing issue

4. **GetUserIssues_ReturnsAllUserIssues**
   - Verifies successful retrieval of all issues for a specific user
   - Validates OK (200) response

5. **UpdateStatus_ValidStatus_ReturnsNoContent**
   - Verifies successful status update of an issue
   - Validates NoContent (204) response

6. **UpdateStatus_InvalidStatus_ReturnsBadRequest**
   - Verifies BadRequest (400) response for invalid status value

#### Service Tests (IssueServiceTests)
1. **ReportIssueAsync_ValidRequest_CreatesAndReturnsIssue**
   - Verifies successful issue creation
   - Validates repository save operation
   - Confirms domain event publication

2. **GetIssueByIdAsync_ExistingIssue_ReturnsIssue**
   - Verifies successful issue retrieval from repository
   - Validates all fields are correctly populated

3. **GetIssueByIdAsync_NonExistingIssue_ThrowsException**
   - Verifies appropriate exception handling for non-existing issue

4. **GetIssuesByUserIdAsync_ReturnsUserIssues**
   - Verifies successful retrieval of all issues for a user
   - Validates the list of issue responses

5. **UpdateIssueStatusAsync_ValidStatus_UpdatesAndPublishesEvent**
   - Verifies successful status update
   - Validates repository update
   - Confirms domain event publication

6. **UpdateIssueStatusAsync_NonExistingIssue_ThrowsException**
   - Verifies appropriate exception handling when updating non-existing issue

### Test Results

```
Success! - Failed: 0, Passed: 12, Skipped: 0, Total: 12, Duration: 65 ms
```

All tests have passed successfully, indicating that the service is working as expected.

### Areas Covered by Tests

- ✅ Basic CRUD operations
- ✅ Error handling
- ✅ Domain rules
- ✅ Event publishing
- ✅ Input validation
- ✅ User-specific operations

---

## 🐳 Docker Compose Setup

Running services via Docker Compose:

| Service | Description | Port |
|---------|-------------|------|
| MongoDB | NoSQL Database | `27017` |
| RabbitMQ | Message broker + UI | `5672`, `15672` |
| IssueService | Issue API Service | `5240` |

Run using:

```bash
docker compose up -d
```

---

## 🔧 Local Development

To run locally without Docker:

1. Ensure MongoDB and RabbitMQ are running.
2. Configure your `appsettings.Development.json` properly:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "MongoDB": {
    "ConnectionString": "mongodb://localhost:27017",
    "Database": "issuedb"
  },
  "RabbitMQ": {
    "Host": "localhost",
    "Username": "guest",
    "Password": "guest"
  }
}
```

3. Run the application:

```bash
dotnet run
```

Access Swagger UI at:

```
http://localhost:5240/swagger
```

---

## 📱 Sample API Usage

### 1. Report an Issue (POST /issues/report)

```json
{
  "title": "Broken light",
  "description": "Street light is broken near the North Campus entrance",
  "category": "Infrastructure",
  "photoUrl": "https://example.com/photos/broken-light.jpg",
  "userId": "user123456",
  "departmentId": 2,
  "latitude": 41.0082,
  "longitude": 28.9784
}
```

### 2. Get User Issues (GET /issues/user/{userId})
Request:
```
GET /issues/user/user123456
```

Response:
```json
[
  {
    "id": "608d5e47b6f1a3c6c03fef01",
    "title": "Broken light",
    "description": "Street light is broken near the North Campus entrance",
    "category": "Infrastructure",
    "photoUrl": "https://example.com/photos/broken-light.jpg",
    "userId": "user123456",
    "departmentId": 2,
    "latitude": 41.0082,
    "longitude": 28.9784,
    "status": "Pending",
    "createdAt": "2025-04-20T14:22:00Z"
  },
  {
    "id": "608d5e47b6f1a3c6c03fef02",
    "title": "Water leak",
    "description": "Water leak in Engineering Building",
    "category": "Plumbing",
    "photoUrl": "https://example.com/photos/water-leak.jpg",
    "userId": "user123456",
    "departmentId": 1,
    "latitude": 41.0090,
    "longitude": 28.9750,
    "status": "Resolved",
    "createdAt": "2025-04-18T09:15:00Z"
  }
]
```

---

## 🔥 Key Concepts Used

| Concept | Description |
|---------|-------------|
| **Aggregate** | `Issue` is the Aggregate Root. |
| **Domain Events** | `IssueCreatedEvent`, `IssueStatusChangedEvent` managed internally. |
| **Event Publisher** | RabbitMQ used to dispatch events externally. |
| **MediatR** | In-memory domain event dispatcher. |
| **MongoDB** | Flexible NoSQL database. |
| **RabbitMQ** | Asynchronous microservice communication. |
| **Geolocation** | Captures precise issue locations with coordinates. |
| **Swagger** | API Documentation & testing tool. |

---

# 🌟 Summary

- Domain Driven Design principles applied.
- RabbitMQ integration for event-driven architecture.
- MongoDB used for flexible data storage.
- Docker Compose configured for multi-container orchestration.
- API easily testable through Swagger UI.
- Geolocation tracking for precise issue locations.
- Department integration for cross-service communication.
- Comprehensive test coverage with all tests passing.
- User-specific issue listing capabilities.