

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
- Kafka veya RabbitMQ ile **"Issue Created"** event’i yayınlama
- **Endpointler:**  
  - `POST /issues/report`
  - `GET /issues/{id}`
  - `PUT /issues/{id}/status`
  - **EVENT:** Issue Created (Kafka / RabbitMQ ile yayınlanacak)

### 3️⃣ Department Service - Spring Boot – Java (PostgreSQL)
- Kampüsteki farklı departmanlar sorunları çözmekle yükümlü
- Sorunları ilgili birime yönlendirme
- Departman bazlı istatistikler
- Kafka veya RabbitMQ ile **"Issue Created"** event’ini dinleme ve database’e işleme
- **Endpointler:**  
  - `GET /departments`
  - `POST /departments`
  - `GET /departments/{id}/issues`
  - **EVENT LISTENER:** Issue Created (Kafka / RabbitMQ ile dinlenecek)

### 4️⃣ Notification Service  - Node.js – NestJS (PostgreSQL)
- Kullanıcılara durum değişiklikleri hakkında bildirim gönderme
- E-posta, SMS veya push notification desteği
- Kafka veya RabbitMQ ile **"Issue Status Updated"** event’ini dinleme ve bildirim gönderme
- **Endpointler:**  
  - `POST /notifications/send`
  - **EVENT LISTENER:** Issue Status Updated (Kafka / RabbitMQ)

### 5️⃣ Gateway Service  - Spring Cloud Gateway
- Tüm servislere tek bir noktadan erişim
- Load balancing, authentication ve rate limiting
- **Request Aggregation:** Kullanıcı bir sorgu yaptığında hem Issue Service hem Department Service’ten veri çekerek tek bir JSON döndürme
- **Spring Cloud Gateway veya Kong API Gateway tercih edilebilir**

### 6️⃣ Testing & Monitoring
- İlerde tartışılır eklenir

---

## 🚀 Deployment:
✅ **Docker**: Her mikroservis için bir Docker image oluşturacağız.  
✅ **Kubernetes**: Bu container'ları yönetmek için Kubernetes kullanacağız.  

## 📄 Documentation:
📌 **Swagger**: API dökümantasyonu için kullanılacak.
