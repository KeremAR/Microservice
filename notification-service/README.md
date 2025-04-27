# Notification Service

Bu mikroservis, sistem genelinde bildirim gönderme işlemlerini yönetmektedir.

## Özellikler

- E-posta bildirimleri gönderme
- RabbitMQ üzerinden mesaj tüketme
- PostgreSQL veritabanı entegrasyonu
- REST API endpoints

## Teknolojiler

- NestJS
- TypeScript
- PostgreSQL
- RabbitMQ
- TypeORM
- Nodemailer

## Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. `.env` dosyasını oluşturun ve gerekli değişkenleri ayarlayın:
```env
# Veritabanı Ayarları
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=notification_db

# RabbitMQ Ayarları
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_QUEUE=notification_queue

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

## API Endpoints

### POST /notification/email
E-posta bildirimi gönderir.

Request Body:
```json
{
  "to": "recipient@example.com",
  "subject": "Bildirim Konusu",
  "text": "Bildirim içeriği"
}
```

## Lisans

MIT 