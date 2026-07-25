import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { getUploadsDir } from './config/uploads-dir';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.use(
    helmet({
      // This is a JSON API with no HTML views, so a CSP header has nothing to protect.
      contentSecurityPolicy: false,
      // /uploads assets (receipts, logos, ID images) are loaded cross-origin from the frontend.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.useBodyParser('json', { limit: '10mb' });
  const config = app.get(ConfigService);
  app.useStaticAssets(getUploadsDir(config), { prefix: '/uploads' });

  const frontendUrls = config
    .get<string>('FRONTEND_URL')
    ?.split(',')
    .map((url) => url.trim())
    .filter(Boolean);
  app.enableCors({ origin: frontendUrls?.length ? frontendUrls : true, credentials: true });
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
