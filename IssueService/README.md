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
| `GET` | `/issues` | Retrieve all issues |
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

## 🔐 MongoDB Access

### Connection Details
The project now uses MongoDB Atlas - a cloud database service. Connection details:

| Setting | Value |
|---------|-------|
| Connection Type | MongoDB Atlas Cloud |
| Connection Format | `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/` |
| Database | `IssueDb` |
| Collection | `issues` |

### Connecting with MongoDB Compass
1. Download and install [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Use your Atlas connection string:
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
```
3. Important: Add `?retryWrites=true&w=majority&authSource=admin` parameters
4. Once connected, select the `IssueDb` database to view the `issues` collection

### Access from .NET Application
Use the connection string provided by MongoDB Atlas Dashboard:
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
```

### Network Access & Security
1. Make sure your IP address is whitelisted in Atlas → Network Access
2. Create a database user with appropriate permissions in Atlas → Database Access

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
    "ConnectionString": "mongodb://root:example@localhost:27017/",
    "Database": "IssueDb"
  },
  "RabbitMQ": {
    "Host": "localhost",
    "Port": 5672,
    "UserName": "guest",
    "Password": "guest",
    "QueueName": "issue_created"
  }
}
```

3. Run the application from the IssueService directory:

```bash
cd IssueService
dotnet run
```

Access Swagger UI at:

```bash
http://localhost:5240/swagger
```

---

## 🐳 Docker Compose Setup
Run all services via Docker Compose:

```bash
docker compose up -d
```

This starts:
- MongoDB (port 27017)
- RabbitMQ (ports 5672 & 15672)
- IssueService API (port 5240)

## 🔧 Local Development
To run the API locally without Docker:
1. Ensure a MongoDB instance and RabbitMQ are running on localhost.
2. In `IssueService/appsettings.Development.json`, set:
    ```json
    "MongoDB": {
      "ConnectionString": "mongodb://root:example@localhost:27017/",
      "Database": "IssueDb"
    }
    ```
3. Start the API:
    ```bash
    cd IssueService
    dotnet run
    ```
4. Visit Swagger UI: `http://localhost:5240/swagger`

## ☁️ Using MongoDB Atlas
To switch to a shared Atlas cluster:
1. Create a free-tier cluster on MongoDB Atlas.
2. Whitelist your IP under **Network Access**.
3. Add a database user under **Database Access** (read/write).
4. Update `appsettings.Development.json`:
    ```json
    "MongoDB": {
      "ConnectionString": "mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/IssueDb?retryWrites=true&w=majority",
      "Database": "IssueDb"
    }
    ```
5. Restart the API (`dotnet run`).

## 📱 Sample API Usage
**List all issues**
```http
GET /issues
```
**Report a new issue**
```http
POST /issues/report
Content-Type: application/json

{
  "title": "Example",
  "description": "Details",
  "category": "Infrastructure",
  "photoUrl": "https://...",
  "userId": "user1",
  "departmentId": 2,
  "latitude": 41.0,
  "longitude": 29.0
}
```

## 🔥 Key Concepts Used
- Aggregate Root (Issue)
- Domain Events with MediatR
- MongoDB for persistence
- RabbitMQ for messaging
- Swagger for API documentation

# 🌟 Summary
IssueService is a .NET 8 microservice using DDD principles to report and track issues with event-driven notifications.