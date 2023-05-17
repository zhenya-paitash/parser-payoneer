import 'colors'
import { ServerModule } from "./server/server.module";
import { ParserModule } from "./parser/parser.module";
import { ConfigService } from "./config/config.service";
import { ApiService } from "./api/api.service";
import { RequestService } from "./request/request.service";
import { LoggerTelegram } from './logger/addons/telegram'
import { IConfigService } from "./config/config.interface";
import { IApiService } from "./api/api.interface";
import { Utils } from "./utils/utils.module";

/* The Application class initializes various modules and services using
configuration values and creates a logger for Telegram. */
class Application {
  private readonly api: IApiService

  /* The `constructor` method is the constructor of the `Application` class. It
  takes in a parameter `configService` of type `IConfigService`, which is used
  to obtain various configuration values needed by the application. Inside the
  constructor, the necessary modules and services are initialized using the
  configuration values obtained from the `configService`. */
  constructor(private readonly configService: IConfigService) {
    const {
      SERVER_PORT,
      API_TOKEN,
      API_URL,
      TELEGRAM_BOT_TOKEN,
      TELEGRAM_USERS,
    } = this.configService.getMany(["SERVER_PORT", "API_TOKEN", "API_URL", "TELEGRAM_BOT_TOKEN", "TELEGRAM_USERS"])

    /* `this.api = new ApiService(new RequestService(API_URL, API_TOKEN))` is
    creating a new instance of the `ApiService` class and passing in a new
    instance of the `RequestService` class as a parameter. The `RequestService`
    class is initialized with the `API_URL` and `API_TOKEN` configuration values
    obtained from the `ConfigService`. The resulting `ApiService` instance is
    then assigned to the `api` property of the `Application` class. This sets up
    the `ApiService` to be used by other modules and services in the
    application. */
    this.api = new ApiService(new RequestService(API_URL, API_TOKEN))

    /* `new ServerModule(Number(SERVER_PORT))` is creating a new instance of the
    `ServerModule` class and passing in the `SERVER_PORT` configuration value as
    a parameter. This initializes the server module with the necessary
    configuration settings to start the server on the specified port. */
    new ServerModule(Number(SERVER_PORT))

    /* `new ParserModule(this.api)` is creating a new instance of the
    `ParserModule` class and passing in the `api` property of the `Application`
    class as a parameter. This initializes the parser module with the necessary
    configuration settings to use the `ApiService` for parsing data. */
    new ParserModule(this.api)

    /* `new LoggerTelegram(TELEGRAM_BOT_TOKEN, TELEGRAM_USERS)` is creating a new
    instance of the `LoggerTelegram` class and passing in the `TELEGRAM_BOT_TOKEN`
    and `TELEGRAM_USERS` configuration values as parameters. This initializes the
    logger module with the necessary configuration settings to send log messages to
    a Telegram chat. */
    new LoggerTelegram(TELEGRAM_BOT_TOKEN, TELEGRAM_USERS)
  }
}

/* `Utils.startApplicationBeautifulLog()` is a method call that starts the
application with a beautiful log message. It is likely a custom method defined
in the `Utils` module that adds some visual flair to the application startup
process. */
Utils.startApplicationBeautifulLog()
/* `new Application(new ConfigService())` is creating a new instance of the
`Application` class and passing in a new instance of the `ConfigService` class
as a parameter. This initializes the application with the necessary
configuration settings to start the server, parse data, and send log messages to
a Telegram chat. */
new Application(new ConfigService())