import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

export const REDIS_CLIENT = "REDIS_CLIENT";

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>("redis.url")!;
        return new Redis(url, { maxRetriesPerRequest: 3 });
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
