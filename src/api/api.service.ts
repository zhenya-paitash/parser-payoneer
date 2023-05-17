import { Utils } from "../utils/utils.module";
import { RequestService } from "../request/request.service";
import { IRequestResult } from "../request/request.interface";
import { IApiService } from "./api.interface";

/* The ApiService class implements the IApiService interface and provides methods
for making HTTP requests to various endpoints. */
export class ApiService implements IApiService {
  /**
   * This is a constructor function for an API service that logs a message when
   * connected.
   * @param {RequestService} requestService - The `requestService` parameter is a
   * dependency injection of the `RequestService` class. It is used to make HTTP
   * requests to an API endpoint. The `readonly` keyword indicates that the
   * `requestService` property cannot be reassigned once it is set in the
   * constructor. The `Utils.log()`
   */
  constructor(private readonly requestService: RequestService) {
    Utils.log('info', `ApiService connected`, 'api')
  }

  /**
   * This function asynchronously retrieves credentials through an HTTP GET
   * request.
   * @returns A Promise that resolves to an IRequestResult object.
   */
  public async getCredentials(): Promise<IRequestResult> {
    return this.requestService.get('/credentials')
  }


  /**
   * This function returns a Promise that makes a GET request to the
   * '/update/needed' endpoint using a request service.
   * @returns A Promise that resolves to an object of type IRequestResult.
   */
  public async getUpdates(): Promise<IRequestResult> {
    return this.requestService.get('/update/needed')
  }

  /**
   * This function sends a POST request to the '/update/read' endpoint and returns
   * a Promise of type IRequestResult.
   * @returns A Promise that resolves to an object of type IRequestResult.
   */
  public async sendUpdates(): Promise<IRequestResult> {
    return this.requestService.post('/update/read', undefined)
  }


  /**
   * This function sends a POST request to a specified endpoint with a string of
   * data and returns a Promise of an IRequestResult.
   * @param {string} data - The `data` parameter is a string that contains the data
   * to be sent in the request body to the `/results/write` endpoint.
   * @returns A Promise that resolves to an object of type IRequestResult.
   */
  public async sendParsingResponse(data: string): Promise<IRequestResult> {
    return this.requestService.post('/results/write', data)
  }

  /**
   * This function sends an audio captcha to a server using a POST request.
   * @param {string} audioCaptcha - The `audioCaptcha` parameter is a string that
   * represents an audio captcha. It is likely used in a request to a server to
   * verify that the user is a human and not a bot.
   * @returns A Promise that resolves to an IRequestResult object.
   */
  public async sendCaptcha(audioCaptcha: string): Promise<IRequestResult> {
    return this.requestService.post('/captcha', audioCaptcha)
  }
}