import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { MongoClient, type ClientSession, type Db, MongoServerError } from 'mongodb'
import { getEnv } from '../config/env.js'

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MongoService.name)
  private client!: MongoClient
  private db!: Db

  async onModuleInit() {
    const uri = getEnv().MONGODB_URI
    this.client = new MongoClient(uri)
    await this.client.connect()
    this.db = this.client.db()
    await this.db.command({ ping: 1 })
    this.logger.log('Connected to MongoDB')
  }

  async onModuleDestroy() {
    await this.client?.close()
  }

  getClient(): MongoClient {
    return this.client
  }

  getDb(): Db {
    return this.db
  }

  /**
   * Run work inside a Mongo transaction when replica set is available.
   * Falls back to a plain write if transactions are unsupported (standalone).
   */
  async withTransaction<T>(fn: (session: ClientSession | undefined) => Promise<T>): Promise<T> {
    const session = this.client.startSession()
    try {
      let result!: T
      await session.withTransaction(async () => {
        result = await fn(session)
      })
      return result
    } catch (error) {
      if (this.isTransactionUnsupported(error)) {
        this.logger.warn(
          'Mongo transactions unavailable (replica set not ready); using non-transactional write',
        )
        return fn(undefined)
      }
      throw error
    } finally {
      await session.endSession()
    }
  }

  private isTransactionUnsupported(error: unknown): boolean {
    if (!(error instanceof MongoServerError) && !(error instanceof Error)) return false
    const message = error.message ?? ''
    return (
      message.includes('Transaction numbers are only allowed on a replica set') ||
      message.includes('as replica set was not yet initialized') ||
      ('codeName' in error &&
        (error.codeName === 'IllegalOperation' || error.codeName === 'NoSuchTransaction'))
    )
  }

  async ping(): Promise<boolean> {
    try {
      await this.db.command({ ping: 1 })
      return true
    } catch {
      return false
    }
  }
}
