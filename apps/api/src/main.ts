import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createApp } from "./create-app";

async function bootstrap() {
  const app = await createApp();
  const configService = app.get(ConfigService);
  const logger = new Logger("Bootstrap");
  const globalPrefix = configService.get<string>("globalPrefix")!;

  const port = configService.get<number>("port")!;
  await app.listen(port);
  logger.log(`DrukSave API listening on http://localhost:${port}/${globalPrefix}`);
  logger.log(`Swagger docs at http://localhost:${port}/${globalPrefix}/docs`);
}

bootstrap();
