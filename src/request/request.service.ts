import fetch, { FetchError, Response, RequestInfo, RequestInit, HeadersInit, BodyInit } from 'node-fetch'
import { IRequestResult, IRequestService, EnumRequestMethods } from "./request.interface";
import { LogRequest } from '../decorators';

/* The RequestService class is a TypeScript implementation of a service that
handles HTTP requests with authorization headers and error handling. */
export class RequestService implements IRequestService {
  private readonly baseURL: RequestInfo | URL 
  private readonly baseHeader: HeadersInit | undefined

  /**
   * This is a constructor function that sets the baseURL and baseHeader properties
   * with the provided API and token values.
   * @param {string} api - The `api` parameter is a string that represents the base
   * URL of the API that the code will be interacting with.
   * @param {string} token - The `token` parameter is a string that represents an
   * authentication token. It is used to authenticate the user making requests to
   * the API. The token is included in the `Authorization` header of the HTTP
   * request, using the `Bearer` authentication scheme.
   */
  constructor(api: string, token: string) {
    this.baseURL = api
    this.baseHeader = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  }

  /**
   * This is an asynchronous function that sends a GET request to a specified URL
   * with optional configuration settings.
   * @param {string} url - The URL of the resource that the request is being made
   * to.
   * @param {RequestInit} config - The `config` parameter is an optional object
   * that can be used to configure the request. It can include properties such as
   * headers, body, mode, cache, credentials, redirect, referrer, referrerPolicy,
   * integrity, keepalive, signal, and window. These properties are used to
   * customize the
   * @returns A Promise that resolves to an object of type IRequestResult.
   */
  public async get(url: string, config: RequestInit = {}): Promise<IRequestResult> {
    return this.request(EnumRequestMethods.GET, url, undefined, config)
  }

  /**
   * This is an asynchronous function that sends a POST request to a specified URL
   * with optional data and configuration parameters.
   * 
   * @param url A string representing the URL to which the HTTP POST request will
   * be sent.
   * @param data The `data` parameter is of type `BodyInit` or `undefined`. It
   * represents the data that will be sent in the request body. `BodyInit` is a
   * type that includes several possible values, such as `string`, `Blob`,
   * `FormData`, `URLSearchParams`, etc. If
   * @param config The `config` parameter is an optional object that can be used to
   * configure the request. It can include properties such as headers, credentials,
   * mode, cache, redirect, referrer, and others. If no configuration is provided,
   * an empty object is used as the default value.
   * @return A Promise that resolves to an object of type IRequestResult.
   */
  public async post(url: string, data: BodyInit | undefined, config: RequestInit = {}): Promise<IRequestResult> {
    return this.request(EnumRequestMethods.POST, url, data, config)
  }

  /**
   * This is a TypeScript function that sends an HTTP request with error handling and
   * logging.
   * 
   * @param method The HTTP method to be used for the request (e.g. GET, POST, PUT,
   * DELETE, etc.).
   * @param url The URL to which the HTTP request will be sent.
   * @param data The data parameter is of type BodyInit and represents the body of
   * the HTTP request. It can be a string, a Blob, a BufferSource, a FormData, or a
   * URLSearchParams object. If the request method is GET or HEAD, the data parameter
   * should be undefined.
   * @param config An optional object containing additional configurations for the
   * request, such as headers and other options that can be passed to the fetch API.
   * @return a Promise that resolves to an object of type IRequestResult.
   */
  @LogRequest
  private async request(method: string, url: string, data: BodyInit | undefined, config: RequestInit): Promise<IRequestResult> {
    try {
      const fetchURL: RequestInfo | URL = this.baseURL + url
      const init: RequestInit = {
        ...config,
        method,
        headers: {
          ...this.baseHeader,
          ...config?.headers
        },
        body: data,
      }

      const response: Response = await fetch(fetchURL, init)
      const json = await response.json()

      if (!response.ok) {
        throw {
          message: response?.statusText,
          status: response?.status,
          apiresponse: JSON.stringify(json)
        }
      }

      const result: IRequestResult = {
        success: true,
        error: null,
        status: response.status,
        data: json ?? {}
      }

      return result
    } catch (e: FetchError | Error | any) {
      const result: IRequestResult = {
        success: false,
        error: e?.message || 'Bad request',
        status: e?.res?.statusCode || e?.status || 500,
        data: {},
      }
      if (e?.apiresponse) result.apiresponse = e.apiresponse

      return result
    }
  }
}