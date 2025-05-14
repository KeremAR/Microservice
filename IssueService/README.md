# 📌 Issue Service

## 💪 Description

**IssueService** is an independent microservice designed for environments like a campus where users can report infrastructure/maintenance/cleanliness problems, 
track their statuses, and get real-time updates.

This service provides:
- Issue Reporting (with location data)
- Viewing Issue Details
- Retrieving User Issues
- Updating Issue Status
- Publishing events through RabbitMQ for issue creation and status changes

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
| Prometheus | Metrics and Monitoring |
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
- `IssueCreatedHandler` listens to `IssueCreatedEvent` and publishes a message to RabbitMQ (`issue_created` queue).
- `IssueStatusChangedHandler` listens to `IssueStatusChangedEvent` and publishes a message to RabbitMQ (`issue_status_changed` queue).

> 📂 Paths: `Application/Handlers/IssueCreatedHandler.cs`, `Application/Handlers/IssueStatusChangedHandler.cs`

---

## 📄 API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| `POST` | `/issues/report` | Report a new issue |
| `GET` | `/issues/{id}` | Retrieve issue details |
| `GET` | `/issues/user/{userId}` | Retrieve all issues for a specific user |
| `GET` | `/issues` | Retrieve all issues |
| `PUT` | `/issues/{id}/status` | Update issue status (also publishes an event to RabbitMQ) |

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
Connection settings are provided through environment variables in `docker-compose.yml`:
```yaml
environment:
  - MongoDB__ConnectionString=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
  - MongoDB__Database=IssueDb
```

### Network Access & Security
1. Make sure your IP address is whitelisted in Atlas → Network Access
2. Create a database user with appropriate permissions in Atlas → Database Access

---

## 🐇 RabbitMQ Integration

### Overview
The service is configured to create and use RabbitMQ queues for publishing domain events. This allows other services to be notified of issue creation and status changes, enabling decoupled communication and processing.

### Queue Configuration

| Queue Name | Purpose | Durable | Auto-delete | Exclusive |
|------------|---------|---------|-------------|-----------|
| `issue_created` | For new issue events | `true` | `false` | `false` |
| `issue_status_changed` | For issue status update events | `true` | `false` | `false` |

Queue names are configurable via `appsettings.json` (`RabbitMQ:QueueName` and `RabbitMQ:IssueStatusChangedQueueName`).

### Connection Setup
- The connection to RabbitMQ is established at service startup.
- The service proactively connects to RabbitMQ and ensures all declared queues are created.
- Connection parameters are configurable via environment variables.
- Automatic retry logic (5 attempts with a 2-second delay) handles connection issues.
- Detailed logging for connection status and errors is provided.

### Events Published
Events are published in JSON format.

#### Issue Created Event (to `issue_created` queue)
**Example payload:**
```json
{
  "Id": "608d5e47b6f1a3c6c03fef01",
  "Title": "Broken sidewalk tile",
  "Description": "Tripping hazard near Engineering building",
  "Category": "Infrastructure",
  "PhotoUrl": "https://storage-url.com/photo.jpg",
  "UserId": "user-123",
  "DepartmentId": 3,
  "Latitude": 41.0082,
  "Longitude": 28.9784,
  "Status": "Pending",
  "CreatedAt": "2025-04-20T14:22:00Z"
}
```

#### Issue Status Changed Event (to `issue_status_changed` queue)
**Example payload:**
```json
{
  "IssueId": "608d5e47b6f1a3c6c03fef01",
  "NewStatus": "In Progress",
  // "UserId": "admin-user-456", // If available and configured
  "Timestamp": "2025-04-21T10:30:00Z"
}
```

### Implementation Details
- **Publisher Class**: `Messaging/Implementations/RabbitMQProducer.cs`
  - `PublishIssueCreated(object message)`
  - `PublishIssueStatusChanged(object message)`
- **Interface**: `Messaging/Interfaces/IRabbitMQProducer.cs`
- **Handlers**:
  - `Application/Handlers/IssueCreatedHandler.cs` (for `issue_created`)
  - `Application/Handlers/IssueStatusChangedHandler.cs` (for `issue_status_changed`)

### Docker Configuration
The service is configured to wait for RabbitMQ to be healthy before starting:
```yaml
depends_on:
  rabbitmq:
    condition: service_healthy
```
This ensures that RabbitMQ is fully operational before Issue Service attempts to connect.

---

## 📊 Metrics and Monitoring

The service has been instrumented with Prometheus metrics to monitor its health and performance:

### Available Metrics
- **`issues_created_total`**: Counter of total issues created
- Default .NET Core metrics (.NET runtime, HTTP requests, etc.)

### Metrics Endpoints
- **Prometheus endpoint**: `/metrics` (scraped by Prometheus server)

### Monitoring
Metrics are visualized in Grafana dashboards:
- **Main Dashboard**: Available in `monitoring/grafana/dashboards/campus-caution-dashboard.json`
- **Metrics Display**: Issue creation rate, count, and service health are displayed

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
   - Confirms domain event publication for both `IssueCreatedEvent` (if applicable) and `IssueStatusChangedEvent`.

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

### Running Locally Without Docker

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
    "HostName": "localhost",
    "Port": 5672,
    "UserName": "guest",
    "Password": "guest",
    "QueueName": "issue_created",
    "IssueStatusChangedQueueName": "issue_status_changed"
  }
}
```

3. Run the application:
```bash
dotnet run
```

### Running with Docker

1. Build and start the service using Docker Compose:
```bash
docker-compose build --no-cache issue-service
docker-compose up -d issue-service
```

2. View logs:
```bash
docker-compose logs -f issue-service
```

---

## 🔄 Integration with Other Services

### Department Service
- **Listens to**: `issue_created` queue
- **Action**: When an issue is created, Department Service receives the message and processes it (e.g., stores in its database, associates with a department).

### Notification Service
- **Listens to (Planned)**: `issue_status_changed` queue
- **Action (Planned)**: When an issue's status changes, Notification Service will receive the message and send a notification to the relevant user.

### API Gateway
- All requests to Issue Service are routed through the API Gateway.
- API Gateway forwards requests to Issue Service at: `http://issue-service:8080`
- External access via API Gateway: `http://localhost:3000/issue/*`

### Future Integrations
- **Mobile App**: Will consume issue data via API Gateway.

---

## 🔍 Troubleshooting

### Common Issues

#### RabbitMQ Connection Problems
- Check if RabbitMQ container is running: `docker-compose ps rabbitmq`
- Verify RabbitMQ credentials match in both `docker-compose.yml` and service config (`appsettings.json`).
- Check logs for connection errors: `docker-compose logs -f issue-service | grep "RabbitMQ"`
- Ensure queue names in `appsettings.json` are correct.

#### MongoDB Connection Issues
- Verify MongoDB Atlas connection string (including username/password).
- Check if IP address is whitelisted in MongoDB Atlas.
- Test connection using MongoDB Compass.

#### Service Won't Start
- Check service dependencies (especially RabbitMQ health check in `docker-compose.yml`).
- Verify environment variables in `docker-compose.yml`.
- Check for port conflicts on the host machine.

---

## 🔜 Planned Enhancements

1. **Caching Layer**: Redis integration to improve read performance.
2. **Issue Status History**: Track all status changes with timestamps and user who made the change.
3. **Image Optimization**: Resize and compress uploaded images.
4. **Full-text Search**: Implement search functionality across issue descriptions.
5. **Event Versioning**: Add schema versioning to RabbitMQ messages for better evolution.
6. **User Identification in Events**: Consistently include `UserId` or `ActorId` in status change events.

# 🌟 Summary
IssueService is a .NET 8 microservice using DDD principles to report and track issues with event-driven notifications for creation and status updates via RabbitMQ.