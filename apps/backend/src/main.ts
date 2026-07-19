import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { getUploadsDir } from './config/uploads-dir';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.useBodyParser('json', { limit: '10mb' });
  const config = app.get(ConfigService);
  app.useStaticAssets(getUploadsDir(config), { prefix: '/uploads' });

  const frontendUrl = config.get<string>('FRONTEND_URL');
  app.enableCors({ origin: frontendUrl ?? true, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  const port = config.getOrThrow<number>('PORT');
  await app.listen(port, '0.0.0.0');
  process.stderr.write(`Backend listening on port ${port}\n`);
}

bootstrap().catch((error) => {
  process.stderr.write(`Bootstrap failed: ${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
