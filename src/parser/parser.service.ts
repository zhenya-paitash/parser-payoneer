import { ParserController } from "./parser.controller";
import { IApiService } from "../api/api.interface";
import { IParserController, IParserResponse, IParserService, IUser } from "./parser.interface";
import { LogResult } from "../decorators";

/* The ParserService class implements the IParserService interface and uses a
ParserController instance to parse user data. */
export class ParserService implements IParserService {
  private parserController: IParserController

  /**
   * This is a constructor function that initializes an instance of
   * ParserController with an instance of ApiService and a user object.
   * @param {IApiService} apiService - IApiService is an interface that defines the
   * methods and properties that a service class should implement in order to
   * interact with an API.
   * @param {IUser} user - The `user` parameter is an instance of the `IUser`
   * interface, which is likely used to store and manage user-related data such as
   * authentication credentials or user preferences. It is passed to the
   * constructor as a dependency injection, which allows the class to access and
   * use the `user` object throughout
   */
  constructor(
    private readonly apiService: IApiService,
    private readonly user: IUser,
  ) {
    this.parserController = new ParserController(this.apiService)
  }

  /* `@LogResult(lavel, label)` is a decorator that logs the result of the
  `parsing()` method with a debug level and a parser tag. It is likely part of a
  logging system that helps developers track the flow of data and identify issues
  in the code. The decorator is applied to the `parsing()` method using the `@`
  symbol, which is a TypeScript feature that allows developers to attach metadata
  to classes, methods, and properties. */
  /**
   * This function asynchronously calls a parsing method on a parser controller
   * object and returns a promise of the parser response.
   * 
   * @return A Promise that resolves to an object of type IParserResponse.
   */
  @LogResult('debug', 'parser')
  async parsing(): Promise<IParserResponse> {
    return this.parserController.parsing(this.user)
  }
}