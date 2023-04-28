export interface IUser {
  username: string
  password: string
}

export interface IParserPayoneerUrls {
  [key: string]: string
}

export interface IParserService {
  parsing(): Promise<IParserResponse>
}

export interface IParserController {
  chrome: string
  urls: IParserPayoneerUrls
  parsing(user: IUser): Promise<IParserResponse>
}

export interface IParserResponseUser {
  name: string
  id: string
  lastLogin?: string
}

export interface IParserResponseBalances {
  USD?: string
  EUR?: string
  GBP?: string
}

export interface IParserResponseData {
  user?: IParserResponseUser
  balances?: IParserResponseBalances
  transactions?: IParserResponseTransaction[]
}

export interface IParserResponse {
  success: boolean
  errors: string[]
  data: IParserResponseData
}

export interface IParserResponseTransaction {
  date?: {
    monthDay: string
    year: string
  }

  description?: {
    title: string
  }

  status?: {
    text: string
  }

  amount?: {
    class: string
    content: string
  }
}

export type TParserCaptchaAudio = {
  success: boolean
  error: string | null
  audio: string
}