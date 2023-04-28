export type TConfigEnv = 'SERVER_PORT' | 'API_URL' | 'API_TOKEN' | 'TELEGRAM_BOT_TOKEN' | 'TELEGRAM_USERS'

export interface IConfigService {
  get(key: TConfigEnv): string
  getMany(keys: TConfigEnv[]): IConfigProcessEnv
}

export interface IConfigProcessEnv {
  [key: TConfigEnv | string]: string
}