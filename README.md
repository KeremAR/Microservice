

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
  - `GET /departments/{id} `
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
