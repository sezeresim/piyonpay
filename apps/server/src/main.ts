import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import { IoAdapter } from '@nestjs/platform-socket.io'
import { AppModule } from './app.module.js'
import { loadEnv } from './config/env.js'

async function bootstrap() {
  const env = loadEnv()
  const app = await NestFactory.create(AppModule)
  app.enableCors({
    origin: true,
  })
  app.useWebSocketAdapter(new IoAdapter(app))

  await app.listen(env.PORT, '0.0.0.0')
}

void bootstrap()
