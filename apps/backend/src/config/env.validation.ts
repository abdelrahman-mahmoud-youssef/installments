import * as Joi from 'joi';

const b2VarSchema = Joi.string().when('STORAGE_PROVIDER', {
  is: 'local',
  then: Joi.optional().allow(''),
  otherwise: Joi.required(),
});

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3001),
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace')
    .default('info'),
  LOG_PRETTY: Joi.boolean().default(false),
  DATABASE_URL: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().required(),
  TWO_FACTOR_ENCRYPTION_KEY: Joi.string().min(32).required(),
  FRONTEND_URL: Joi.string().optional(),
  REDIS_URL: Joi.string().uri().optional(),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  TELEGRAM_BOT_TOKEN: Joi.string().allow('').optional(),
  WHATSAPP_PHONE_NUMBER_ID: Joi.string().allow('').optional(),
  WHATSAPP_ACCESS_TOKEN: Joi.string().allow('').optional(),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: Joi.string().allow('').optional(),
  REMINDER_HOUR: Joi.number().integer().min(0).max(23).default(8),
  EVENING_SUMMARY_HOUR: Joi.number().integer().min(0).max(23).default(20),
  UPLOADS_DIR: Joi.string().default('./uploads'),
  STORAGE_PROVIDER: Joi.string().valid('backblaze', 'local').default('backblaze'),
  B2_KEY_ID: b2VarSchema,
  B2_APPLICATION_KEY: b2VarSchema,
  B2_BUCKET: b2VarSchema,
  B2_ENDPOINT: b2VarSchema,
  B2_REGION: Joi.string().default('us-west-004'),
});
