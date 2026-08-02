import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { getEnv } from './config/env.js'
import { MongoModule } from './mongo/mongo.module.js'
import { RoomsModule } from './rooms/rooms.module.js'

const env = getEnv()

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: env.THROTTLE_TTL_MS,
        limit: env.THROTTLE_LIMIT,
      },
      {
        name: 'transfer',
        ttl: env.THROTTLE_TTL_MS,
        limit: env.THROTTLE_TRANSFER_LIMIT,
      },
    ]),
    MongoModule,
    RoomsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
