import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useBodyParser('json', { limit: '10mb' });
  const config = app.get(ConfigService);

  const frontendUrl = config.get<string>('FRONTEND_URL');
  app.enableCors({ origin: frontendUrl ?? true, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const port = Number(config.get<string>('PORT') ?? 3001);
  await app.listen(port, '0.0.0.0');
  process.stderr.write(`Backend listening on port ${port}\n`);
}

bootstrap().catch((error) => {
  process.stderr.write(`Bootstrap failed: ${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
