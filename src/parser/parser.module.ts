import { Utils } from "../utils/utils.module";
import { ParserService } from "./parser.service";
import { IApiService } from "../api/api.interface";
import { IParserResponse, IParserService, IUser } from "./parser.interface";
import { IRequestResult, IRequestGetUpdates } from '../request/request.interface'

/* The ParserModule class is responsible for initializing and running an endless
cycle of parsing data and sending it to an API service. */
export class ParserModule {
  private user?: IUser
  private parserService?: IParserService

  /* The `constructor` is initializing a new instance of the `ParserModule` class
  with a single parameter `apiService` of type `IApiService`. It then calls the
  `initialize()` method to set up the necessary credentials and start the
  endless cycle of parsing data and sending it to the API service. The
  `apiService` parameter is marked as `private readonly`, which means it can
  only be accessed within the `ParserModule` class and cannot be modified after
  it has been set in the constructor. */
  constructor(private readonly apiService: IApiService) {
    this.initialize()
  }

  /**
   * This function initializes the Parser Module by getting user credentials and
   * creating a ParserService instance.
   * 
   * @return a Promise that resolves to void.
   */
  private async initialize(): Promise<void> {
    const request: IRequestResult = await this.apiService.getCredentials()
    if (!request.success && request.error) {
      const error = request.error
      Utils.log('error', error, 'parser')
      throw new Error(error)
    }

    const user = request.data as IUser
    if (!user?.username || !user?.password) {
      const error = 'failed to get user credentials'
      Utils.log('error', error, 'parser')
      throw new Error(error)
    }

    this.user = { username: user.username, password: user.password }
    this.parserService = new ParserService(this.apiService, this.user)
    Utils.log('info', 'ParserModule started', 'parser')

    return this.start()
  }

  /**
   * This is an asynchronous function that checks if an update is needed by making
   * a request to an API and returning a boolean value.
   * 
   * @return A boolean value indicating whether an update is needed or not.
   */
  private async needUpdate(): Promise<boolean> {
    const request: IRequestResult = await this.apiService.getUpdates()
    if (!request.success && request.error) {
      Utils.log('error', request.error, 'parser')
      return false
    }

    const update = request.data as IRequestGetUpdates

    return update.needed
  }

  /**
   * This is an async function that runs an endless cycle, checking for updates
   * every 30 sec and sending parsing responses to REST API.
   */
  private async start(): Promise<void> {
    if (!this.parserService) {
      const error = "parserService was not created"
      Utils.log('error', error, 'parser')
      throw new Error(error)
    }

    // eslint-disable-next-line no-constant-condition
    while(true) {
      if (await this.needUpdate()) {
        const parserData: IParserResponse = await this.parserService.parsing()
        await this.apiService.sendParsingResponse(JSON.stringify(parserData))
      }

      await Utils.sleep(30)
    }
  }
}