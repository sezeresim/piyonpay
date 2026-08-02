import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { MongoClient, type Db } from 'mongodb'

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MongoService.name)
  private client!: MongoClient
  private db!: Db

  async onModuleInit() {
    const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27018/piyonpay'
    this.client = new MongoClient(uri)
    await this.client.connect()
    this.db = this.client.db()
    await this.db.command({ ping: 1 })
    this.logger.log('Connected to MongoDB')
  }

  async onModuleDestroy() {
    await this.client?.close()
  }

  getDb(): Db {
    return this.db
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
