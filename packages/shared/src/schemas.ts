import { z } from 'zod'

const optionalText = z.string().trim().max(64).optional()
const optionalPin = z.union([z.string(), z.number()]).optional()

export const createRoomSchema = z.object({
  nickname: z.string().trim().max(24).optional(),
  avatar: optionalText,
  roomName: z.string().trim().max(40).optional(),
  pin: optionalPin,
  initialBalance: z.number().finite().optional(),
  bankBalance: z.number().finite().optional(),
  maxPlayers: z.number().finite().optional(),
})

export const joinRoomSchema = z.object({
  nickname: z.string().trim().max(24).optional(),
  avatar: optionalText,
  pin: optionalPin,
})

export const authSchema = z.object({
  token: z.string().trim().min(1).optional(),
})

export const readySchema = authSchema.extend({
  ready: z.boolean().optional(),
})

export const createTransferSchema = authSchema.extend({
  toPlayerId: z.string().trim().min(1).optional(),
  amount: z.number().finite().optional(),
})

export const bankerActionSchema = authSchema.extend({
  targetPlayerId: z.string().trim().min(1).optional(),
  amount: z.number().finite().optional(),
  mode: z.enum(['give', 'remove']).optional(),
})

export const joinRoomMessageSchema = z.object({
  code: z.string().trim().min(1).max(12).optional(),
  token: z.string().trim().min(1).optional(),
})

export type CreateRoomInput = z.infer<typeof createRoomSchema>
export type JoinRoomInput = z.infer<typeof joinRoomSchema>
export type AuthInput = z.infer<typeof authSchema>
export type ReadyInput = z.infer<typeof readySchema>
export type CreateTransferInput = z.infer<typeof createTransferSchema>
export type BankerActionInput = z.infer<typeof bankerActionSchema>
export type JoinRoomMessageInput = z.infer<typeof joinRoomMessageSchema>
