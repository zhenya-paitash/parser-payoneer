import winston from 'winston'
import Transport from 'winston-transport'

export type TLogger = winston.Logger

export type TLoggerConfig = CustomWinstonTransportStreamOptions

export type TLoggerLogInfo = winston.Logform.TransformableInfo

export type TLoggerLogCallback = winston.LogCallback

export type TLoggerLogformFormat = winston.Logform.Format

export type TLoggerLogLevel = 'info' | 'warn' | 'error' | 'debug' | 'http'

export type TLoggerLogLabel = 'app' | 'config' | 'api' | 'server' | 'parser' | 'logger'

export type TLoggerJsonData = {
  [key: string]: any
}

export type TLoggerTelegramInfo = {
  token: string
  users: number[]
}

export type TLoggerLogFile = {
  filename: string
  filepath: string
  paths: string[]
}

interface CustomWinstonTransportStreamOptions extends Transport.TransportStreamOptions {
  telegram?: TLoggerTelegramInfo | undefined
}

export enum EnumLoggerLogLevelsEmoji {
  info = '🟩',
  warn = '🟧',
  error = '🟥',
  debug = '🟦',
  http = '🟫'
}
