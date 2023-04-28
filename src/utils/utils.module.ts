import beautifulLogo from './logo'
import logger from '../logger/logger.service'
import { TLoggerLogLabel, TLoggerLogLevels, TLogger } from '../logger/logger.interface'

/* The Utils class contains static methods for sleeping, logging, and starting an
application with a beautiful logo. */
export class Utils {
  /**
   * The function returns a promise that resolves after a specified number of
   * seconds.
   * @param {number} sec - The `sec` parameter is a number representing the number
   * of seconds to wait before resolving the promise returned by the `sleep`
   * function.
   * @returns A Promise that resolves after a specified number of seconds (as
   * specified by the `sec` parameter) have elapsed.
   */
  static sleep(sec: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, sec * 1_000))
  }

  /**
   * This is a static function that logs a message with a specified log level and
   * label.
   * 
   * @param level The level parameter is of type TLoggerLogLevels, which is likely an enum
   * or a string literal type that defines the different levels of logging, such as
   * "debug", "info", "warn", or "error". This parameter is used to indicate the
   * severity of the log message being passed in.
   * @param message The message parameter is a string or any other data type that
   * represents the log message to be logged. It could be a simple string message or
   * a complex object that needs to be logged.
   * @param label The `label` parameter is an optional parameter of type `TLoggerLogLabel`.
   * It is used to provide a label or tag to the log message to help identify it or
   * categorize it. If no label is provided, the log message will not have a label.
   * @return A function named "log" that takes in three parameters: "level" of type
   * "TLoggerLogLevels", "message" of type "string" or "any", and an optional parameter
   * "label" of type "TLoggerLogLabel". The function returns an object of type "TLogger".
   */
  static log(level: TLoggerLogLevels, message: string | any, label?: TLoggerLogLabel): TLogger {
    return logger.log(level, message, label)
  }

  /**
   * This function logs a beautiful logo to the console.
   */
  static startApplicationBeautifulLog(): void {
    console.log(beautifulLogo)
  }
}