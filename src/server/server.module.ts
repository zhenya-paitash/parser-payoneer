import fastify, { FastifyInstance } from 'fastify'
import { Utils } from '../utils/utils.module';
import { ServerController } from './server.controller';
import { IServerModule } from "./server.interface";

/* This is a TypeScript class that creates a server module with a router and
launches it on a specified port. */
export class ServerModule implements IServerModule {
  private readonly router = new ServerController()
  private server: FastifyInstance
  private port: number

  /**
   * This is a constructor function that creates a Fastify server instance with a
   * specified port and launches it.
   * @param {number} port - The `port` parameter is a number that represents the
   * port number on which the server will listen for incoming requests. It is used
   * to specify the network port that the server will bind to.
   */
  constructor(port: number) {
    this.server = fastify({ logger: false })
    this.port = port
    this.launch()
  }

  /**
   * This function sets up a route for handling GET requests.
   */
  private useRoutes() {
    // GET
    this.server.get('/favicon.ico', (req, res) => res.status(204))
    this.server.get('*', this.router.getAll)
    // POST
    // PUT
    // DELETE
  }

  /**
   * This function listens for incoming connections on a specified port and logs
   * the server's status.
   * 
   * @return The `listen()` method is being returned, which starts the server
   * listening on the specified port and logs a message indicating that the server
   * is up and running.
   */
  private listen() {
    return this.server.listen({ port: this.port }, (error: Error | null, host: string) => {
      if (error) {
        Utils.log('error', error, 'server')
        throw new Error(`Server listen error ${error?.message}`)
      }

        Utils.log('info', `Server Module is up and running at ${host}`, 'server')
    })
  }

  /**
   * The function launches the application by setting up routes and listening for
   * incoming requests.
   */
  launch() {
    this.useRoutes()
    this.listen()
  }
}