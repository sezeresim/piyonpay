import { Module } from '@nestjs/common'
import { MongoModule } from './mongo/mongo.module.js'
import { RoomsModule } from './rooms/rooms.module.js'

@Module({
  imports: [MongoModule, RoomsModule],
})
export class AppModule {}
