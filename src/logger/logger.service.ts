import fs from 'node:fs'
import path from 'node:path'
import moment from 'moment'
import winston from 'winston'
import Transport from 'winston-transport'
import {
  TLogger,
  TLoggerConfig,
  TLoggerJsonData,
  TLoggerLogCallback,
  TLoggerLogInfo,
  TLoggerLogLabel,
  TLoggerLogLevel,
  TLoggerLogformFormat,
  TLoggerTelegramInfo,
  EnumLoggerLogLevelsEmoji,
} from './logger.interface'

/* The Logger class is a TypeScript implementation of a logging utility using the
Winston library. */
export class Logger {
  private _logger: TLogger

  /* The `constructor()` function is initializing a new instance of the `Logger`
  class by calling the `createLogger()` method and assigning the returned
  `TLogger` instance to the `_logger` property of the class. This allows the
  `Logger` class to use the `winston.Logger` instance for logging messages with
  various levels and labels. */
  constructor() {
    this._logger = this.createLogger()
  }

  /**
   * The `createLogger()` function creates a new instance of the `winston.Logger`
   * class with specified configuration options for logging to the console, JSON
   * file, error log file, and combined log file.
   * 
   * @return The `createLogger()` method is returning an instance of the
   * `winston.Logger` class with specified configuration options, including a
   * custom log format and four transports for logging to the console, JSON file,
   * error log file, and combined log file.
   */
  private createLogger(): TLogger {
    const winstonCustomFormat: TLoggerLogformFormat = winston.format.printf((info: TLoggerLogInfo) => {
      const { level, timestamp, label, message } = info
      const lvl = `${EnumLoggerLogLevelsEmoji[level as TLoggerLogLevel]} ${level.toUpperCase()}`
      const time = new Date(timestamp).toLocaleString('ru-RU', {
        timeZone: 'Europe/Minsk',
        dateStyle: "short",
        timeStyle: "medium",
      })
      const msg = message instanceof Object ? JSON.stringify(message) : message
      return `${lvl} [${time}] ${label ?? '***'}: ${msg}`
    })

    /* The `createLogger()` method is creating a new instance of the
    `winston.Logger` class with the specified configuration options. It sets the
    logging level to `'info'`, formats the log messages with a custom format
    that includes the log level, timestamp, label, and message, and adds four
    transports for logging to the console, a JSON file, an error log file, and a
    combined log file. The `JsonLogger` transport is a custom transport that
    writes log data to a JSON file. */
    return winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winstonCustomFormat
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(winston.format.colorize({ all: true })),
          handleExceptions: true,
        }),

        new JsonLogger({
          format: winston.format.combine(winston.format.errors({ stack: true }), winston.format.json()),
          handleExceptions: true
        }),

        new winston.transports.File({
          filename: 'error.log',
          level: 'error',
          handleExceptions: true,
        }),

        new winston.transports.File({
          filename: 'combine.log',
        })
      ],

      exitOnError: false
    })
  }

  /**
   * This function logs a message with a specified level and label, and handles any
   * errors that may occur.
   * 
   * @param level The level of the log message, which is of type TLoggerLogLevel.
   * This could be "debug", "info", "warn", "http" or "error".
   * @param message The message parameter is a string or any other data type that
   * represents the log message to be recorded. It could be an error message, a
   * warning message, or any other type of message that needs to be logged.
   * @param label The `label` parameter is an optional string that can be used to
   * provide additional context or information about the log message. It is used as
   * a property in the object passed as the second argument to the logger method.
   * If no label is provided, it will default to `undefined`.
   * @return The function `log` returns an instance of `TLogger`.
   */
  public log(level: TLoggerLogLevel, message: string | any, label?: TLoggerLogLabel): TLogger {
    try {
      return this._logger[level](message, { label })
    } catch (e: Error | any) {
      this._logger.warn(`Logger. Error: ${e?.message}`, { label: 'logger' })
      return this._logger.error(message, { label })
    }
  }
}

/* The JsonLogger class is a TypeScript implementation of a logging transport that
writes log data to a JSON file. */
class JsonLogger extends Transport {
  private _root: string = process.env?.LOCALAPPDATA ?? './'
  private dir: string
  private file: string
  private telegram?: TLoggerTelegramInfo

  /**
   * This is a constructor function that initializes properties for a logger
   * object, including creating a log directory and setting a filepath and telegram
   * option.
   * 
   * @param options TLoggerConfig is a type of configuration object that contains
   * various options for configuring a logger. It may include options such as log
   * level, log format, log file path, and other settings. The constructor takes
   * this configuration object as a parameter and initializes various properties of
   * the logger object based on the options provided
   */
  constructor(options: TLoggerConfig) {
    super(options)
    this.dir = this.createLogDir()
    this.file = this.filepath()
    this.telegram = options.telegram
  }

  /**
   * This function creates a directory named ".payoneer" in the specified root
   * directory and returns the path to the directory.
   * 
   * @return a string that represents the path to the log directory. If the
   * directory already exists, it returns the path to the existing directory. If
   * the directory does not exist and cannot be created, it returns the current
   * directory path ('./').
   */
  private createLogDir(): string {
    const dir = path.join(this._root, '.payoneer')
    if (fs.existsSync(dir)) return dir

    try {
      fs.mkdirSync(dir)
      return dir
    } catch (e: Error | any) {
      console.log(e)
      return './'
    }
  }

  /**
   * This function returns the filepath for a log file with a specific filename
   * format.
   * 
   * @return The `filepath` string is being returned. It is a string representing
   * the file path of a log file with a name that includes the current date in the
   * format "log_DDMMYYYY.json". The file path is created by joining the directory
   * path returned by the `createLogDir()` method with the filename using the
   * `path.join()` method.
   */
  private filepath(): string {
    this.dir = this.createLogDir()
    const filename = `log_${moment().utcOffset('+0300').format('DDMMYYYY')}.json`
    const filepath = path.join(this.dir, filename)
    return filepath
  }

  /**
   * This function creates an empty JSON file with the specified encoding.
   */
  private create(): void {
    try {
      fs.writeFileSync(this.file, JSON.stringify({}), { encoding: 'utf8' })
    } catch (e: Error | any) {
      console.log(e?.message)
    }
  }

  /**
   * The function reads JSON data from a file and returns it, or creates an empty
   * object if the file does not exist.
   * 
   * @return The function `read()` returns a JSON object of type `TLoggerJsonData`. If
   * the JSON file exists and can be read, it returns the parsed data from the
   * file. If the file does not exist or cannot be read, it creates a new file and
   * returns an empty JSON object.
   */
  private read(): TLoggerJsonData {
    this.file = this.filepath()
    try {
      const data = JSON.parse(fs.readFileSync(this.file, { encoding: 'utf8' }))
      return data
    } catch (e) {
      this.create()
      return {}
    }
  }

  /**
   * This is a private async function that sends a log file to multiple Telegram
   * users using their chat IDs and a Telegram bot token.
   * @param {string} data - There is no use of the parameter `data` in the given
   * code snippet. It is not used as an argument in the function or anywhere else
   * in the code.
   * @returns This function returns a Promise that resolves to void (i.e.,
   * nothing).
   */
  // private async telegramSendLog(data: string): Promise<void> {
  //   if (!this.telegram?.token || !this.telegram?.users.length) return
  //   try {
  //     for (const user of this.telegram.users) {
  //       const url = `https://api.telegram.org/bot${this.telegram.token}/sendDocument?chat_id=${user}`
  //       const success = await loggerTelegramSendLog(url, this.file)
  //       console.log(success)
  //     }
  //   } catch (e: Error | any) {
  //     console.log(e?.message)
  //   }
  // }

  /**
   * The function writes log information to a file in JSON format.
   * 
   * @param info TLoggerLogInfo, which is a type representing the information to be
   * logged. It likely includes details such as the time of the log, the message
   * being logged, and any relevant metadata.
   * @return A boolean value is being returned.
   */
  write(info: TLoggerLogInfo): boolean {
    const data = this.read()
    try {
      const time = moment(info.timezone).utcOffset('+0300').format('HH:mm')
      ;(data[time] ??= []).push(info)
      // const json = JSON.stringify(data)
      const json = JSON.stringify(data, null, 2)  // with indents, the log file will weigh more, but it will immediately be formatted
      fs.writeFileSync(this.file, json, { encoding: 'utf8' })
      return true
    } catch (e: Error | any) {
      console.log(e?.message)
      return false
    }
  }

  /**
   * The function logs information and emits an event when it's done.
   * 
   * @param info TLoggerLogInfo is a type that represents the information to be logged.
   * It could include details such as the log message, timestamp, severity level,
   * etc.
   * @param cb cb is a callback function that is called after the log has been
   * written. It is used to signal that the logging operation has completed and any
   * necessary cleanup can be done.
   */
  log(info: TLoggerLogInfo, cb: TLoggerLogCallback): void {
    setImmediate(() => this.emit('logged', info))
    this.write(info)
    cb()
  }
}

/* `export default new Logger()` is exporting a new instance of the `Logger` class
as the default export of the module. This allows other modules to import the
`Logger` class by simply importing the module, without having to create a new
instance of the `Logger` class themselves. */
export default new Logger()