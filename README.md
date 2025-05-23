# Campus Issue Reporting and Tracking System - Microservice Project

## 🚀 Event Flow - Core Scenario: Reporting an Issue

This section outlines the step-by-step interaction of microservices during the core user scenario of "Reporting an Issue." This flow helps in understanding the structure of the project.

1.  **User Login (Mobile Frontend & User Service):**
    *   The user logs into the **Mobile Frontend** application using either their Microsoft account (Entra ID) or email/password.
    *   Authentication processes (login/signup and token management) are handled by the **User Service** (Python/FastAPI).

2.  **Issue Reporting (Mobile Frontend -> Issue Service):**
    *   The user reports a new issue (title, description, category, photo, etc.) through the mobile application interface (e.g., "Inform Us" button).
    *   **Mobile Frontend** sends an HTTP POST request with this information to the `/issues/report` endpoint of the **Issue Service** (ASP.NET Core/C#). This request is routed through the API Gateway.

3.  **Issue Processing and Saving (Issue Service):**
    *   **Issue Service** receives the request, validates it, and creates a new `Issue` object.
    *   It saves this `Issue` object to its own **MongoDB** database.
    *   Upon successful completion, an `IssueCreatedEvent` domain event is triggered internally within the service (using MediatR).

4.  **Event Publishing (Issue Service -> RabbitMQ):**
    *   A handler listening to the `IssueCreatedEvent` (`IssueCreatedHandler`) formats a message containing the event details (Issue ID, User ID, Category, etc.).
    *   It publishes this message to the central messaging system, **RabbitMQ** (to the `issue_created` queue/exchange).

5.  **Department Notification (RabbitMQ -> Department Service):**
    *   The **Department Service** (Java/Spring Boot) listens for the `IssueCreatedEvent` from RabbitMQ.
    *   Upon receiving this event, the **Department Service** processes the relevant issue into its database, assigns it to the appropriate department, and generates statistical data.

6.  **User Notification (Issue Service -> RabbitMQ -> Notification Service):**
    *   When the status of an issue changes within the **Issue Service** (e.g., "Resolved," "In Progress"), events like `IssueStatusChangedEvent` are published to RabbitMQ.
    *   The **Notification Service** (Node.js/NestJS) listens for these status change events.
    *   Upon receiving the event, the **Notification Service** sends a status update notification to the original user who reported the issue, using methods like email or push notification.

**Summary:** In this implementation, users can log in via the **Mobile Frontend** (using **User Service**) and report issues to the **Issue Service**. The **Issue Service** then publishes events via **RabbitMQ**, which are consumed by both the **Department Service** for assignment and the **Notification Service** for user updates.

---

*The following section contains the general project description and service details.*

## 🎯 Project Goal and Scope

### 1️⃣ User Service - Python – FastAPI (PostgreSQL)
- Kullanıcı kaydı, giriş (auth), roller (admin, öğrenci vb.)
- Kullanıcı profili yönetimi
- Firebase Authentication ile kimlik doğrulama + Role-Based Access Control (RBAC)
- Redis ile önbellekleme (caching)
- Prometheus ile metrik toplama
- RabbitMQ ile event publishing
- **Endpointler:**
  - `POST /auth/signup`
  - `POST /auth/login`
  - `GET /users/profile`
  - `PUT /users/profile`

### 2️⃣ Issue Service - ASP.NET Core - C# (MongoDB - NoSQL)
- Kullanıcılar kampüsteki problemleri raporlayacak
- Fotoğraf yükleme, kategori seçme (altyapı, temizlik vb.)
- Sorunları listeleme, durum güncelleme
- Redis ile caching mekanizması
- RabbitMQ ile **"Issue Created"** event'i yayınlama
- **Endpointler:**  
  - `POST /issues/report`
  - `GET /issues/{id}`
  - `PUT /issues/{id}/status`
  - **EVENT:** Issue Created (RabbitMQ ile yayınlanacak)

### 3️⃣ Department Service - Spring Boot – Java (PostgreSQL)
- Kampüsteki farklı departmanlar sorunları çözmekle yükümlü
- Sorunları ilgili birime yönlendirme
- Departman bazlı istatistikler
- RabbitMQ ile **"Issue Created"** event'ini dinleme ve database'e işleme
- **Endpointler:**  
  - `GET /departments`
  - `GET /departments/{id} `
  - `POST /departments`
  - `GET /departments/{id}/issues`
  - **EVENT LISTENER:** Issue Created (RabbitMQ ile dinlenecek)

### 4️⃣ Notification Service  - Node.js – NestJS (PostgreSQL)
- Kullanıcılara durum değişiklikleri hakkında bildirim gönderme
- E-posta ve push notification desteği
- RabbitMQ ile **"Issue Status Updated"** event'ini dinleme ve bildirim gönderme
- **Endpointler:**  
  - `POST /notification`
  - `GET /notification/:userId`
  - `PUT /notification/:id/read`
  - `DELETE /notification/:id`
  - **EVENT LISTENER:** Issue Status Updated (RabbitMQ)

### 5️⃣ Gateway Service  - Node.js – Express.js
- Tüm servislere tek bir noktadan erişim
- Load balancing, authentication ve rate limiting
- Reverse proxy özelliğiyle yönlendirme ve filtreleme
- **Request Routing**: Her servis için özel yönlendirmeler

### 6️⃣ Redis Cache Service
- User Service ve Issue Service için hızlı önbellek sunar
- Authentication token caching (User Service)
- Response caching (Issue Service)
- Performans optimizasyonu ve yük yönetimi

### 7️⃣ Testing & Monitoring
- Prometheus ile metrik toplama
- Grafana ile görselleştirme
- Her servisin sağlık durumu ve performansı izlenir

---

## 🚀 Deployment:
✅ **Docker**: Her mikroservis için bir Docker image oluşturacağız.  
✅ **Docker Compose**: Tüm servislerin kolay bir şekilde yönetilmesi için Docker Compose kullanıyoruz.

## 📄 Documentation:
📌 **Swagger**: API dökümantasyonu için kullanılacak.

---

## 📝 Proje Hakkında

**Proje Adı:** Kampüs Sorun Bildirim ve Takip Sistemi

**Projenin Amacı:**
Bu proje, üniversite kampüsündeki öğrencilerin ve personelin altyapı, temizlik, güvenlik gibi sorunları kolayca bildirebilmesini sağlar. Yetkili birimler, kendilerine iletilen sorunları sistem üzerinden takip eder ve çözüme ulaştırır. Kullanıcılar, bildirdikleri sorunların durumunu anlık olarak görebilir ve bildirim alabilir.

**Teknik Özellikler:**
✅ Mobil Uygulama: Kullanıcıların sorun bildirebileceği ve takip edebileceği bir arayüz olacak.
✅ Web portal: Departmanlardaki yetkili kişiler web portal üzerinden gelen sorunları görecek durumunu güncelleyecek.
✅ Google Maps Entegrasyonu: Kampüs içinde bildirilen sorunları harita üzerinden göstereceğiz.
✅ Mikroservis Mimarisi: Backend, ölçeklenebilir olması için mikroservis yapısında geliştirilecek.
✅ Farklı Diller ve Frameworkler: En az 3 farklı framework veya programlama dili kullanılacak.
✅ Bildirim Sistemi: Kullanıcılar, sorunlarının çözüm sürecini anlık olarak takip edebilecek.

**Kullanıcı Senaryosu:**
Öğrenci veya personel, kampüsteki bir sorunu fotoğraf ekleyerek bildirir.

Yetkili birim, kendisine iletilen sorunları görüp çözüm sürecini yönetir.

Kullanıcı, bildirdiği sorunun güncellenme durumunu bildirimlerle takip eder.

Sorunlar harita üzerinde gösterilir, böylece yoğun şikayet alanları belirlenebilir.

---

### 🔔 Notification Service & Gateway Entegrasyonu

- **Notification Service** sadece Gateway üzerinden erişilebilecek şekilde yapılandırılmıştır.
- Gateway üzerinden notification işlemleri için aşağıdaki endpointler kullanılabilir:
    - **POST** `/notification/notifications` : Bildirim oluşturma
    - **GET** `/notification/notifications/{userId}` : Kullanıcının bildirimlerini listeleme
    - **PUT** `/notification/notifications/{notificationId}/read` : Bildirimi okundu olarak işaretleme
    - **DELETE** `/notification/notifications/{notificationId}` : Bildirimi silme
- Gateway, gelen istekleri notification servisine yönlendirir ve cevapları kullanıcıya iletir.
- Notification servisi Docker ortamında environment değişkeninden portunu alacak şekilde yapılandırıldı ve sadece 5004 portunda dinleyecek şekilde ayarlandı.
- Notification servisi, RabbitMQ üzerinden ilgili olaylara abone olarak kullanıcılara bildirimler gönderir.
- E-posta bildirimleri, sistem tarafından otomatik olarak gönderilir.

## Monitoring Setup (Prometheus & Grafana)

This project uses Prometheus for metrics collection and Grafana for visualization.

### Current Status

*   **Prometheus:** Configured to scrape metrics from various services.
*   **Grafana:** Configured with a Prometheus data source and a main dashboard (`Campus Caution Dashboard`).

### Service Metrics Status

*   **API Gateway (`gateway-service`):** **UP**. Reporting `http_requests_total` (Counter) and `http_request_duration_seconds` (Histogram) to Prometheus. Visualized on the Grafana dashboard.
*   **User Service (`user-service2`):** **UP**. Reporting standard FastAPI metrics via `prometheus-client`, plus a custom `users_registered_total` (Counter). Visualized on the Grafana dashboard.
*   **Issue Service (`IssueService`):** **UP**. Reporting standard .NET metrics via `prometheus-net.AspNetCore`, plus a custom `issues_created_total` (Counter). Visualized on the Grafana dashboard.
*   **Department Service (`department-service`):** **DOWN**. Prometheus reports HTTP 404 when scraping `/actuator/prometheus`. Likely needs Spring Security adjustment to allow unauthenticated access to Actuator endpoints.
*   **Notification Service (`notification-service`):** **DOWN**. Service fails to start due to database connection issues (`getaddrinfo ENOTFOUND postgres`). Metrics setup is in place (`@willsoto/nestjs-prometheus`) but not currently reporting.

### Grafana Dashboards

*   **`monitoring/grafana/dashboards/campus-caution-dashboard.json`:** The main dashboard showing service health (`up` metric), gateway request rates/durations, user registration counts/rates, and issue creation counts/rates.

## Environment Configuration

To run the entire microservice project using Docker, you need to create a `.env` file in the root directory of the project (next to the docker-compose.yml file) with the following environment variables:

```bash
# Microservices Environment Configuration

# User Service - Supabase Credentials
SUPABASE_DB_HOST=ahrhnlmeimlxttvujmpa.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=Qfnr9GtwhCrlVOK3
SUPABASE_URL=https://ahrhnlmeimlxttvujmpa.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocmhubG1laW1seHR0dnVqbXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MDcxMjIsImV4cCI6MjA2MjI4MzEyMn0.6jJ1IxliIFw4zjBL5BO0Mycdrxnu1LyTLNuf_MKckio

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# RabbitMQ Configuration
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=user
RABBITMQ_PASSWORD=password
RABBITMQ_URL=amqp://user:password@rabbitmq:5672

# Department Service
SPRING_DATASOURCE_URL=jdbc:postgresql://aws-0-eu-central-1.pooler.supabase.com:6543/postgres?user=postgres.ahrhnlmeimlxttvujmpa&password=Qfnr9GtwhCrlVOK3&sslmode=require

# Issue Service
MONGODB_CONNECTION_STRING=mongodb+srv://cefakarberkay:berkay01@campuscation.jtmagbt.mongodb.net/?retryWrites=true&w=majority&appName=CampusCation
MONGODB_DATABASE=IssueDb

# Notification Service
DATABASE_HOST=aws-0-eu-central-1.pooler.supabase.com
DATABASE_PORT=6543
DATABASE_USERNAME=postgres.ahrhnlmeimlxttvujmpa
DATABASE_PASSWORD=Qfnr9GtwhCrlVOK3
DATABASE_NAME=postgres
DATABASE_SSL=true
NOTIFICATION_SERVICE_PORT=5004

# API Gateway Service
NODE_ENV=docker
USER_SERVICE_URL=http://user-service:8000
DEPARTMENT_SERVICE_URL=http://department-service:8083
ISSUE_SERVICE_URL=http://issue-service:8080
NOTIFICATION_SERVICE_URL=http://notification-service:5004

# Grafana
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=admin
GF_USERS_ALLOW_SIGN_UP=false

```

The Docker Compose file is configured to use these environment variables for all services. Additionally:

1. The User Service requires Firebase Authentication. Place the `serviceAccountKey.json` file in the root of the user-service directory.

2. To run the entire project with Docker Compose:
   ```bash
   docker-compose up --build
   ```

3. To access the services:
   - API Gateway: http://localhost:3000
   - User Service: http://localhost:5001
   - Department Service: http://localhost:8083
   - Issue Service: http://localhost:5003
   - Notification Service: http://localhost:5004
   - RabbitMQ: http://localhost:15672
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3001
