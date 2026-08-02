import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { SkipThrottle, Throttle } from '@nestjs/throttler'
import {
  authSchema,
  bankerActionSchema,
  createRoomSchema,
  createTransferSchema,
  joinRoomSchema,
  readySchema,
} from '@piyonpay/shared'
import { ZodValidationPipe } from '../common/zod-validation.pipe.js'
import type {
  AuthDto,
  BankerActionDto,
  CreateRoomDto,
  CreateTransferDto,
  JoinRoomDto,
  ReadyDto,
} from './dto.js'
import { RoomsGateway } from './rooms.gateway.js'
import { RoomsService } from './rooms.service.js'

@Controller()
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly roomsGateway: RoomsGateway,
  ) {}

  @SkipThrottle()
  @Get('api/health')
  health() {
    return this.roomsService.health()
  }

  @Post('api/rooms')
  createRoom(@Body(new ZodValidationPipe(createRoomSchema)) body: CreateRoomDto) {
    return this.roomsService.createRoom(body)
  }

  @Get('api/rooms/:code')
  getRoom(@Param('code') code: string, @Query('token') token?: string) {
    return this.roomsService.getRoomState(code, token)
  }

  @Post('api/rooms/:code/join')
  async joinRoom(
    @Param('code') code: string,
    @Body(new ZodValidationPipe(joinRoomSchema)) body: JoinRoomDto,
  ) {
    const state = await this.roomsService.joinRoom(code, body)
    this.roomsGateway.broadcastRoom(code, state, 'player:joined')
    return state
  }

  @Post('api/rooms/:code/ready')
  async setReady(
    @Param('code') code: string,
    @Body(new ZodValidationPipe(readySchema)) body: ReadyDto,
  ) {
    const state = await this.roomsService.setReady(code, body)
    this.roomsGateway.broadcastRoom(code, state, 'player:ready')
    return state
  }

  @Post('api/rooms/:code/start')
  async startGame(
    @Param('code') code: string,
    @Body(new ZodValidationPipe(authSchema)) body: AuthDto,
  ) {
    const state = await this.roomsService.startGame(code, body)
    this.roomsGateway.broadcastRoom(code, state, 'game:started')
    return state
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 }, transfer: { limit: 20, ttl: 60_000 } })
  @Post('api/rooms/:code/transfers')
  async createTransfer(
    @Param('code') code: string,
    @Body(new ZodValidationPipe(createTransferSchema)) body: CreateTransferDto,
  ) {
    const state = await this.roomsService.createTransfer(code, body)
    this.roomsGateway.broadcastRoom(code, state, 'transfer:created')
    return state
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 }, transfer: { limit: 20, ttl: 60_000 } })
  @Post('api/rooms/:code/banker-actions')
  async runBankerAction(
    @Param('code') code: string,
    @Body(new ZodValidationPipe(bankerActionSchema)) body: BankerActionDto,
  ) {
    const state = await this.roomsService.runBankerAction(code, body)
    this.roomsGateway.broadcastRoom(code, state, 'bank:updated')
    return state
  }

  @Post('api/rooms/:code/leave')
  async leaveRoom(
    @Param('code') code: string,
    @Body(new ZodValidationPipe(authSchema)) body: AuthDto,
  ) {
    const state = await this.roomsService.leaveRoom(code, body)
    const kind = state.deleted ? 'room:deleted' : 'player:left'
    this.roomsGateway.broadcastRoom(code, state, kind)
    return state
  }

  @Post('api/rooms/:code/close')
  async closeRoom(
    @Param('code') code: string,
    @Body(new ZodValidationPipe(authSchema)) body: AuthDto,
  ) {
    const state = await this.roomsService.closeRoom(code, body)
    this.roomsGateway.broadcastRoom(code, state, 'room:closed')
    return state
  }

  @Post('api/rooms/:code/finalize')
  async finalizeRoom(
    @Param('code') code: string,
    @Body(new ZodValidationPipe(authSchema)) body: AuthDto,
  ) {
    const state = await this.roomsService.finalizeRoom(code, body)
    this.roomsGateway.broadcastRoom(code, state, 'room:deleted')
    return state
  }
}
