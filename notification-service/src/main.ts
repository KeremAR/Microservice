import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrometheusModule, makeCounterProvider } from '@willsoto/nestjs-prometheus';
import * as promClient from 'prom-client';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Add CORS support if needed
  app.enableCors();

  // Prometheus setup (manual setup is removed, rely on PrometheusModule.register)
  // const register = promClient.register;
  // promClient.collectDefaultMetrics({ register });

  // Remove manual /metrics endpoint definition
  /*
  app.get('/metrics', (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(register.metrics());
  });
  */

  const port = process.env.PORT || 5004;
  await app.listen(port);
  console.log(`Notification Service running on port ${port}`);
}
bootstrap();