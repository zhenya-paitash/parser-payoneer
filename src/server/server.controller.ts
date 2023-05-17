import fs from 'node:fs'
import path from 'node:path'
import { FastifyReply, FastifyRequest } from 'fastify'
import { IServerResponse, IServerController, TServerLogData } from './server.interface'
import { LogServer } from '../decorators'

/* The ServerController class exports a method called getAll that reads log files
from a directory and returns the data in a response object. */
export class ServerController implements IServerController {
  /* `@LogServer` is a decorator that is applied to the `getAll` method of the
  `ServerController` class. It is used to log information about the method's
  execution, such as the request parameters and the response data. The
  implementation of the `@LogServer` decorator is not shown in the code
  provided, but it is likely that it uses a logging library to write the log
  data to a file or a database. */
  /**
   * This function reads log files from a specific directory and returns their
   * contents as JSON data in a server response.
   * @param {FastifyRequest} req - FastifyRequest - This is the request object that
   * contains information about the incoming HTTP request.
   * @param {FastifyReply} res - `res` is a parameter of type `FastifyReply` which
   * represents the response object that will be sent back to the client. It is
   * used to send the HTTP response with the appropriate status code, headers, and
   * body.
   * @returns The function `getAll` returns a Promise that resolves to an object of
   * type `IServerResponse`.
   */
  @LogServer
  async getAll(req: FastifyRequest, res: FastifyReply): Promise<IServerResponse> {
    const root = path.join(process.env?.LOCALAPPDATA ?? './', '.payoneer')
    const logs: string[] = fs.readdirSync(root).filter(log => log.endsWith('.json'))
    const data: TServerLogData = {}

    for (const log of logs) {
      const logData = fs.readFileSync(path.join(root, log), { encoding: 'utf8' })
      data[log] = JSON.parse(logData)
    }
    
    const response: IServerResponse = {
      success: true,
      errors: null,
      data
    }

    return response
  }
}