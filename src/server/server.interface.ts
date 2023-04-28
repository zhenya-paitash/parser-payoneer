import { FastifyReply, FastifyRequest } from "fastify"

export interface IServerModule {
  launch(): void
}

export interface IServerResponse {
  success: boolean
  errors: string[] | null
  data: TServerLogData
}

export type TServerLogData = {
  [key: string]: any
}

export interface IServerController {
  getAll(req: FastifyRequest, res: FastifyReply): Promise<IServerResponse>
}