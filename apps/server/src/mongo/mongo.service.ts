import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { MongoClient, type ClientSession, type Db } from 'mongodb'
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

  /** Run work inside a Mongo multi-doc transaction (requires replica set). */
  async withTransaction<T>(fn: (session: ClientSession) => Promise<T>): Promise<T> {
    const session = this.client.startSession()
    try {
      let result!: T
      await session.withTransaction(async () => {
        result = await fn(session)
      })
      return result
    } finally {
      await session.endSession()
    }
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
