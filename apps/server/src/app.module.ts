import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { getEnv } from './config/env.js'
import { MongoModule } from './mongo/mongo.module.js'
import { RoomsModule } from './rooms/rooms.module.js'

const env = getEnv()
const throttleEnabled = env.THROTTLE_LIMIT > 0

@Module({
  imports: [
    ThrottlerModule.forRoot(
      throttleEnabled
        ? [
            {
              name: 'default',
              ttl: env.THROTTLE_TTL_MS,
              limit: env.THROTTLE_LIMIT,
            },
            {
              name: 'transfer',
              ttl: env.THROTTLE_TTL_MS,
              limit: Math.max(env.THROTTLE_TRANSFER_LIMIT, 1),
            },
          ]
        : [
            {
              name: 'default',
              ttl: env.THROTTLE_TTL_MS,
              limit: 10_000,
            },
          ],
    ),
    MongoModule,
    RoomsModule,
  ],
  providers: throttleEnabled
    ? [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ]
    : [],
})
export class AppModule {}
