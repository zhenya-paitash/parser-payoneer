import { IRequestResult } from "../request/request.interface"

export interface IApiService {
  // GET
  getCredentials(): Promise<IRequestResult>
  getUpdates(): Promise<IRequestResult>
  // POST
  sendUpdates(): Promise<IRequestResult>
  sendParsingResponse(data: string): Promise<IRequestResult>
  sendCaptcha(audioCaptcha: string): Promise<IRequestResult>
}