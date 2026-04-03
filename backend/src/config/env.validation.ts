import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  APP_NAME: Joi.string().default('Landing Softdev API'),
  PORT: Joi.number().port().default(3000),
  API_PREFIX: Joi.string().default('api'),
  FRONTEND_URL: Joi.string().default('http://localhost:5173'),
  SWAGGER_TITLE: Joi.string().default('Landing Softdev API'),
  SWAGGER_DESCRIPTION: Joi.string().default(
    'Documentacion base para la landing y futuras APIs.',
  ),
  SWAGGER_VERSION: Joi.string().default('1.0.0'),
  SWAGGER_PATH: Joi.string().default('docs'),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().port().default(5432),
  DB_USERNAME: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().allow('').default('postgres'),
  DB_NAME: Joi.string().default('landing_softdev'),
  DB_SCHEMA: Joi.string()
    .pattern(/^[a-z_][a-z0-9_]*$/)
    .default('landing_core'),
  DB_SSL_ENABLED: Joi.boolean()
    .truthy('true')
    .truthy('1')
    .falsy('false')
    .falsy('0')
    .default(true),
  DB_SSL_REJECT_UNAUTHORIZED: Joi.boolean()
    .truthy('true')
    .truthy('1')
    .falsy('false')
    .falsy('0')
    .default(false),
  DB_SSL_CA: Joi.string().allow('').optional(),
  DB_SSL_CERT: Joi.string().allow('').optional(),
  DB_SSL_KEY: Joi.string().allow('').optional(),
  DB_SSL_SERVERNAME: Joi.string().allow('').optional(),
  DB_CONNECTION_TIMEOUT_MS: Joi.number().integer().min(1000).default(3000),
  AUTH_SESSION_TTL_HOURS: Joi.number().integer().min(1).max(168).default(12),
  AUTH_MAX_FAILED_ATTEMPTS: Joi.number().integer().min(3).max(10).default(5),
  AUTH_LOCK_MINUTES: Joi.number().integer().min(1).max(1440).default(15),
});
