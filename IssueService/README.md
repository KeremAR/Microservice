# 📌 Issue Service

## 💪 Description

**IssueService** is an independent microservice designed for environments like a campus where users can report infrastructure/maintenance/cleanliness problems, 
track their statuses, and get real-time updates.

This service provides:
- Issue Reporting
- Viewing Issue Details
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
  "CreatedAt": "2025-04-20T14:22:00Z"
}
```

> 📂 Publisher Class: `Messaging/RabbitMQProducer.cs`

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
2. Configure your `appsettings.Development.json` properly.
3. Run the application:

```bash
dotnet run
```

Access Swagger UI at:

```
http://localhost:5240/swagger
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
| **Swagger** | API Documentation & testing tool. |

---

# 🌟 Summary

- Domain Driven Design principles applied.
- RabbitMQ integration for event-driven architecture.
- MongoDB used for flexible data storage.
- Docker Compose configured for multi-container orchestration.
- API easily testable through Swagger UI.

---