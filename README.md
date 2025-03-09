# Campus Issue Management System - Microservices Architecture

This project implements a microservices-based system for managing campus issues and maintenance requests.

## Microservices

### 1️⃣ User Service  - Spring Boot – Java (PostgreSQL)
- Kullanıcı kaydı, giriş (auth), roller (admin, öğrenci vb.)
- Kullanıcı profili yönetimi
- JWT veya OAuth2 tabanlı kimlik doğrulama + Role-Based Access Control (RBAC)
- **Endpointler:**
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /users/{id}`
  - `PUT /users/{id}`

### 2️⃣ Issue Service - ASP.NET Core - C# (MongoDB - NoSQL)
- Kullanıcılar kampüsteki problemleri raporlayacak
- Fotoğraf yükleme, kategori seçme (altyapı, temizlik vb.)
- Sorunları listeleme, durum güncelleme
- Redis veya benzeri bir sistem ile caching mekanizması eklenecek.
- Kafka veya RabbitMQ ile **"Issue Created"** event'i yayınlama
- **Endpointler:**  
  - `POST /issues/report`
  - `GET /issues/{id}`
  - `PUT /issues/{id}/status`
  - **EVENT:** Issue Created (Kafka / RabbitMQ ile yayınlanacak)

### 3️⃣ Department Service - Spring Boot – Java (PostgreSQL)
- Kampüsteki farklı departmanlar sorunları çözmekle yükümlü
- Sorunları ilgili birime yönlendirme
- Departman bazlı istatistikler
- Kafka veya RabbitMQ ile **"Issue Created"** event'ini dinleme ve database'e işleme
- **Endpointler:**  
  - `GET /departments`
  - `POST /departments`
  - `GET /departments/{id}/issues`
  - **EVENT LISTENER:** Issue Created (Kafka / RabbitMQ ile dinlenecek)

### 4️⃣ Notification Service  - Node.js – NestJS (PostgreSQL)
- Kullanıcılara durum değişiklikleri hakkında bildirim gönderme
- E-posta, SMS veya push notification desteği
- Kafka veya RabbitMQ ile **"Issue Status Updated"** event'ini dinleme ve bildirim gönderme
- **Endpointler:**  
  - `POST /notifications/send`
  - **EVENT LISTENER:** Issue Status Updated (Kafka / RabbitMQ)

### 5️⃣ Gateway Service  - Spring Cloud Gateway
- Tüm servislere tek bir noktadan erişim
- Load balancing, authentication ve rate limiting
- **Request Aggregation:** Kullanıcı bir sorgu yaptığında hem Issue Service hem Department Service'ten veri çekerek tek bir JSON döndürme
- **Spring Cloud Gateway veya Kong API Gateway tercih edilebilir**

## Running the Services

### Running Individual Services

Each microservice has its own Docker setup and can be run independently:

1. Navigate to the service directory:
   ```
   cd <service-directory>
   ```

2. Build and run with Docker Compose:
   ```
   docker-compose up -d
   ```

### Running All Services

To run all services together:

```
docker-compose up -d
```

This will start all the services defined in the root docker-compose.yml file.

## Deployment

✅ **Docker**: Her mikroservis için bir Docker image oluşturacağız.  
✅ **Kubernetes**: Bu container'ları yönetmek için Kubernetes kullanacağız.  

## Documentation

📌 **Swagger**: API dökümantasyonu için kullanılacak.

## Service URLs

- User Service: http://localhost:8081
- Issue Service: http://localhost:8082 (coming soon)
- Department Service: http://localhost:8083 (coming soon)
- Notification Service: http://localhost:8084 (coming soon)
- Gateway Service: http://localhost:8080 (coming soon)
