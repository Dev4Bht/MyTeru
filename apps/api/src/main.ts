import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { Logger, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);
  const logger = new Logger("Bootstrap");

  app.use(helmet());

  app.enableCors({
    origin: configService.get<string[]>("corsOrigins"),
    credentials: true,
  });

  app.setGlobalPrefix(configService.get<string>("globalPrefix")!);

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
  SwaggerModule.setup(`${configService.get<string>("globalPrefix")}/docs`, app, document);

  const port = configService.get<number>("port")!;
  await app.listen(port);
  logger.log(`DrukSave API listening on http://localhost:${port}/${configService.get<string>("globalPrefix")}`);
  logger.log(`Swagger docs at http://localhost:${port}/${configService.get<string>("globalPrefix")}/docs`);
}

bootstrap();
