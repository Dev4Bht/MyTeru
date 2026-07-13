import { plainToInstance } from "class-transformer";
import {
  IsBooleanString,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  MinLength,
  validateSync,
} from "class-validator";

class EnvironmentVariables {
  @IsIn(["development", "test", "production"])
  NODE_ENV!: string;

  // Render (and most PaaS hosts) inject PORT; API_PORT is only used as an
  // override for local dev / hosts that don't set PORT themselves.
  @IsNumberString()
  @IsOptional()
  PORT?: string;

  @IsNumberString()
  @IsOptional()
  API_PORT?: string;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET!: string;

  @IsString()
  CORS_ORIGINS!: string;

  @IsIn(["twilio"])
  SMS_PROVIDER!: string;

  @IsBooleanString()
  @IsOptional()
  SMS_DEV_MODE?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    const message = errors
      .map((e) => Object.values(e.constraints ?? {}).join(", "))
      .join("; ");
    throw new Error(`Invalid environment configuration: ${message}`);
  }

  return validatedConfig;
}
