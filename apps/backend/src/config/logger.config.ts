import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { IncomingMessage, ServerResponse } from 'http';
import { Params } from 'nestjs-pino';

interface RequestWithUser extends IncomingMessage {
  user?: { userId: string; tenantId: string };
}

export function getLoggerOptions(config: ConfigService): Params {
  const isPretty = config.get<boolean>('LOG_PRETTY') === true;

  return {
    pinoHttp: {
      level: config.get<string>('LOG_LEVEL') ?? 'info',
      genReqId: (req: IncomingMessage) => (req.headers['x-request-id'] as string) || randomUUID(),
      transport: isPretty
        ? { target: 'pino-pretty', options: { colorize: true, singleLine: true, translateTime: 'HH:MM:ss' } }
        : undefined,
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
        censor: '[Redacted]',
      },
      serializers: {
        req: (req: IncomingMessage & { id?: string }) => ({ id: req.id, method: req.method, url: req.url }),
        res: (res: ServerResponse) => ({ statusCode: res.statusCode }),
      },
      customProps: (req: RequestWithUser) => ({
        tenantId: req.user?.tenantId,
        userId: req.user?.userId,
      }),
      customLogLevel: (_req: IncomingMessage, res: ServerResponse, error?: Error) => {
        if (error || res.statusCode >= 500) {
          return 'error';
        }
        if (res.statusCode >= 400) {
          return 'warn';
        }
        return 'info';
      },
      customSuccessMessage: (req: IncomingMessage, res: ServerResponse, responseTimeMs: number) =>
        `${req.method} ${req.url} ${res.statusCode} - ${responseTimeMs}ms`,
      customErrorMessage: (req: IncomingMessage, res: ServerResponse, error: Error) =>
        `${req.method} ${req.url} ${res.statusCode} - ${error.message}`,
      autoLogging: {
        ignore: (req: IncomingMessage) => req.url === '/health',
      },
    },
  };
}
