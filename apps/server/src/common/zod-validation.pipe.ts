import { BadRequestException, type PipeTransform } from '@nestjs/common'
import { WsException } from '@nestjs/websockets'
import type { ZodType } from 'zod'

type ZodPipeMode = 'http' | 'ws'

/** Validate request / socket payloads with a Zod schema. */
export class ZodValidationPipe implements PipeTransform {
  constructor(
    private readonly schema: ZodType,
    private readonly mode: ZodPipeMode = 'http',
  ) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value ?? {})
    if (result.success) return result.data

    const message = result.error.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : ''
        return `${path}${issue.message}`
      })
      .join('; ')

    if (this.mode === 'ws') {
      throw new WsException(message || 'Invalid payload.')
    }
    throw new BadRequestException(message || 'Invalid payload.')
  }
}
