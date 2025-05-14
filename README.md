# Campus Issue Reporting and Tracking System - Microservice Project

## 🚀 Event Flow - Core Scenario: Reporting an Issue

This section outlines the step-by-step interaction of microservices during the core user scenario of "Reporting an Issue." This flow helps in understanding the current and planned structure of the project.

1.  **User Login (Mobile Frontend & User Service):**
    *   The user logs into the **Mobile Frontend** application using either their Microsoft account (Entra ID) or email/password.
    *   Authentication processes (login/signup and token management) are handled by the **User Service** (Python/FastAPI).

2.  **Issue Reporting (Mobile Frontend -> Issue Service):**
    *   The user reports a new issue (title, description, category, photo, etc.) through the mobile application interface (e.g., "Inform Us" button).
    *   **Mobile Frontend** sends an HTTP POST request with this information to the `/issues/report` endpoint of the **Issue Service** (ASP.NET Core/C#). *(Note: This request might be routed through the Gateway in the future)*.

3.  **Issue Processing and Saving (Issue Service):**
    *   **Issue Service** receives the request, validates it, and creates a new `Issue` object.
    *   It saves this `Issue` object to its own **MongoDB** database.
    *   Upon successful completion, an `IssueCreatedEvent` domain event is triggered internally within the service (using MediatR).

4.  **Event Publishing (Issue Service -> RabbitMQ):**
    *   A handler listening to the `IssueCreatedEvent` (`IssueCreatedHandler`) formats a message containing the event details (Issue ID, User ID, Category, etc.).
    *   It publishes this message to the central messaging system, **RabbitMQ** (to the `issue_created` queue/exchange).

5.  **Department Notification (RabbitMQ -> Department Service - *Planned*):**
    *   The **Department Service** (Java/Spring Boot - *Planned for development*) is intended to listen for the `IssueCreatedEvent` from RabbitMQ.
    *   Upon receiving this event, the **Department Service** might process the relevant issue into its database, assign it to the appropriate department, or generate statistical data.

6.  **User Notification (Issue Service -> RabbitMQ -> Notification Service - *Planned*):**
    *   In the future, when the status of an issue changes within the **Issue Service** (e.g., "Resolved," "In Progress"), new events like `IssueStatusChangedEvent` will be published to RabbitMQ.
    *   The **Notification Service** (Node.js/NestJS - *Planned for development*) will listen for these status change events.
    *   Upon receiving the event, the **Notification Service** will send a status update notification to the original user who reported the issue, using methods like email, push notification, or SMS.

**Summary:** In the current implementation, users can log in via the **Mobile Frontend** (using **User Service**) and report issues to the **Issue Service**. The **Issue Service** then publishes this event via **RabbitMQ**. The processing of these events by the department and notification services is planned for subsequent development phases.

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
- Redis veya benzeri bir sistem ile caching mekanizması eklenecek.
- RabbitMQ ile **"Issue Created"** event'i yayınlama
- **Endpointler:**  
  - `POST /issues/report`
  - `GET /issues/{id}`
  - `PUT /issues/{id}/status`
  - **EVENT:** Issue Created (Kafka / RabbitMQ ile yayınlanacak)

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
  - **EVENT LISTENER:** Issue Created (Kafka / RabbitMQ ile dinlenecek)

### 4️⃣ Notification Service  - Node.js – NestJS (PostgreSQL)
- Kullanıcılara durum değişiklikleri hakkında bildirim gönderme
- E-posta, SMS veya push notification desteği
- RabbitMQ ile **"Issue Status Updated"** event'ini dinleme ve bildirim gönderme
- **Endpointler:**  
  - `POST /notifications/send`
  - **EVENT LISTENER:** Issue Status Updated (Kafka / RabbitMQ)

### 5️⃣ Gateway Service  - Spring Cloud Gateway
- Tüm servislere tek bir noktadan erişim
- Load balancing, authentication ve rate limiting
- **Request Aggregation:** Kullanıcı bir sorgu yaptığında hem Issue Service hem Department Service'ten veri çekerek tek bir JSON döndürme
- **Spring Cloud Gateway veya Kong API Gateway tercih edilebilir**

### 6️⃣ Saga Service - Spring Boot – Java (Veritabanı?)
- Dağıtık işlemleri (distributed transactions) yönetmek için Orkestrasyon tabanlı Saga Pattern uygular.
- Özellikle "Issue Creation" gibi birden fazla servisi etkileyen iş akışlarının tutarlılığını sağlar.
- Başarısız adımlarda telafi edici işlemleri (compensating transactions) tetikler.
- **Teknoloji:** İş akışı yönetimi için Camunda, Temporal veya basit Spring bileşenleri kullanılabilir.

### 7️⃣ Testing & Monitoring
- İlerde tartışılır eklenir

---

## 🚀 Deployment:
✅ **Docker**: Her mikroservis için bir Docker image oluşturacağız.  
✅ **Kubernetes**: Bu container'ları yönetmek için Kubernetes kullanacağız.  

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

### 🔔 Notification Service & Gateway Entegrasyonu (2025)

- **Notification Service** artık doğrudan dışarıya açılmak yerine, sadece Gateway üzerinden erişilebilecek şekilde yapılandırıldı.
- Gateway üzerinden notification işlemleri için aşağıdaki endpointler kullanılabilir:
    - **POST** `/notification/notifications` : Bildirim oluşturma
    - **GET** `/notification/notifications/{userId}` : Kullanıcının bildirimlerini listeleme
    - **PUT** `/notification/notifications/{notificationId}/read` : Bildirimi okundu olarak işaretleme
    - **DELETE** `/notification/notifications/{notificationId}` : Bildirimi silme
- Gateway, gelen istekleri notification servisine yönlendirir ve cevapları kullanıcıya iletir.
- Notification servisi Docker ortamında environment değişkeninden portunu alacak şekilde güncellendi ve sadece 5004 portunda dinleyecek şekilde yapılandırıldı.
- Dockerfile ve docker-compose ayarları bu yeni yapıya uygun olarak güncellendi.
- Tüm testler başarıyla geçti ve sistem gateway üzerinden sorunsuz çalışmaktadır.

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
