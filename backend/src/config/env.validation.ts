import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  APP_NAME: Joi.string().default('Landing Softdev API'),
  PORT: Joi.number().port().default(3000),
  API_PREFIX: Joi.string().default('api'),
  FRONTEND_URL: Joi.string().default('http://localhost:5173'),
  SWAGGER_TITLE: Joi.string().default('Landing Softdev API'),
  SWAGGER_DESCRIPTION: Joi.string().default('Documentacion base para la landing y futuras APIs.'),
  SWAGGER_VERSION: Joi.string().default('1.0.0'),
  SWAGGER_PATH: Joi.string().default('docs'),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().port().default(5432),
  DB_USERNAME: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().allow('').default('postgres'),
  DB_NAME: Joi.string().default('landing_softdev'),
});
