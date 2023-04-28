import { BodyInit, RequestInit } from 'node-fetch'
import { IUser } from "../parser/parser.interface"

export interface IRequestResponseData {
  [key: string]: any
}

export interface IRequestGetUpdates {
  needed: boolean
}

export interface IRequestResult {
  success: boolean
  error: string | null
  status: number
  apiresponse?: string
  data: IUser | IRequestGetUpdates | IRequestResponseData | object
}

export interface IRequestService {
  get(
    url: string,
    config: RequestInit
  ): Promise<IRequestResult>
  post(
    url: string,
    data: BodyInit,
    config: RequestInit
  ): Promise<IRequestResult>
}

export const enum EnumRequestMethods {
  GET = 'GET',
  POST = 'POST',
  UPDATE = 'PUT',
  DELETE = 'DELETE',
}