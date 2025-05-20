import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Add CORS support if needed
  app.enableCors();

  const port = process.env.PORT || 5004;
  await app.listen(port);
  console.log(`Notification Service running on port ${port}`);
}
bootstrap();