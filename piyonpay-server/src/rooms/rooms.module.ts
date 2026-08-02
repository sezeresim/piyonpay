import { Module } from '@nestjs/common'
import { RoomsController } from './rooms.controller.js'
import { RoomsGateway } from './rooms.gateway.js'
import { RoomsRepository } from './rooms.repository.js'
import { RoomsService } from './rooms.service.js'

@Module({
  controllers: [RoomsController],
  providers: [RoomsService, RoomsGateway, RoomsRepository],
})
export class RoomsModule {}
