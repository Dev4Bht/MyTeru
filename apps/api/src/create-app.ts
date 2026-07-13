import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { AppModule } from "./app.module";

/**
 * Builds and configures the Nest application (Helmet, CORS, global prefix,
 * validation, Swagger) without starting an HTTP listener. Shared by main.ts
 * (which calls `app.listen()` for local/traditional hosting) and the
 * Netlify function entrypoint (which wraps the underlying Express instance
 * with serverless-http instead of listening on a port).
 */
export async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const configService = app.get(ConfigService);

  app.use(helmet());

  app.enableCors({
    origin: configService.get<string[]>("corsOrigins"),
    credentials: true,
  });

  const globalPrefix = configService.get<string>("globalPrefix")!;
  app.setGlobalPrefix(globalPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("DrukSave API")
    .setDescription("Bhutan's AI-powered Personal Financial Companion — REST API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${globalPrefix}/docs`, app, document);

  return app;
}
