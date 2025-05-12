# Notification Service

Bu mikroservis, sistem genelinde bildirim gönderme işlemlerini yönetmektedir.

## Özellikler

- E-posta bildirimleri gönderme
- RabbitMQ üzerinden mesaj tüketme
- PostgreSQL veritabanı entegrasyonu
- REST API endpoints
- Kapsamlı birim ve E2E testler
- Docker desteği

## Teknolojiler

- NestJS
- TypeScript
- PostgreSQL
- RabbitMQ
- TypeORM
- Nodemailer
- Jest (Testing)
- Docker & Docker Compose

## Kurulum

### Yerel Geliştirme Ortamı

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. `.env` dosyasını oluşturun ve gerekli değişkenleri ayarlayın:
```env
# Veritabanı Ayarları
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=notification_db

# RabbitMQ Ayarları
RABBITMQ_URL=amqp://localhost:5672

# E-posta Ayarları
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

3. Uygulamayı başlatın:
```bash
# Geliştirme modunda
npm run start:dev

# Production modunda
npm run build
npm run start:prod
```

### Docker ile Çalıştırma

1. Docker imajını oluşturun ve servisleri başlatın:
```bash
docker-compose up -d
```

2. Servislerin durumunu kontrol edin:
```bash
docker-compose ps
```

3. Logları görüntüleyin:
```bash
docker-compose logs -f notification-service
```

4. Servisleri durdurun:
```bash
docker-compose down
```

## Test

### Test Ortamı Gereksinimleri

- PostgreSQL test veritabanı (port: 5433)
- Node.js ve npm

### Test Komutları

```bash
# Birim testlerini çalıştır
npm run test

# E2E testlerini çalıştır
npm run test:e2e

# Test kapsamını görüntüle
npm run test:cov
```

### Docker ile Test

1. Test ortamını Docker ile başlatın:
```bash
# Test veritabanını başlat
docker-compose -f docker-compose.test.yml up -d

# Testleri çalıştır
docker-compose -f docker-compose.test.yml run --rm notification-service npm run test
docker-compose -f docker-compose.test.yml run --rm notification-service npm run test:e2e
```

2. Test ortamını temizleyin:
```bash
docker-compose -f docker-compose.test.yml down
```

## API Endpoints

### POST /notification
Yeni bir bildirim oluşturur.

Request Body:
```json
{
  "userId": "user123",
  "title": "Bildirim Başlığı",
  "message": "Bildirim mesajı"
}
```

### GET /notification/:userId
Kullanıcının bildirimlerini getirir.

### PUT /notification/:id/read
Bildirimi okundu olarak işaretler.

Request Body:
```json
{
  "userId": "user123"
}
```

### DELETE /notification/:id
Bildirimi siler.

Request Body:
```json
{
  "userId": "user123"
}
```

### Gateway Entegrasyonu (2025)

- Bu servis, dış dünyaya doğrudan açılmak yerine sadece API Gateway üzerinden erişilebilecek şekilde yapılandırılmıştır.
- Tüm notification işlemleri için isteklerinizi gateway üzerinden göndermelisiniz.
- Gateway üzerinden kullanılabilir endpointler:
    - **POST** `/notification/notifications` : Bildirim oluşturma
    - **GET** `/notification/notifications/{userId}` : Kullanıcının bildirimlerini listeleme
    - **PUT** `/notification/notifications/{notificationId}/read` : Bildirimi okundu olarak işaretleme
    - **DELETE** `/notification/notifications/{notificationId}` : Bildirimi silme
- Docker ortamında servis environment değişkeninden portunu alır ve sadece 5004 portunda dinler.

## Test Kapsamı

- NotificationService: %87.17
- NotificationController: %100
- NotificationConsumer: %100
- NotificationEntity: %100
- NotificationEventPublisher: %60

## Lisans

MIT 