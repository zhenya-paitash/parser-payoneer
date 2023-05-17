import beautifulLogo from './logo'
import logger from '../logger/logger.service'
import { TLoggerLogLabel, TLoggerLogLevel, TLogger } from '../logger/logger.interface'

type TProcessArgs = {
  [key: string]: boolean | string
}

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
   * @param level The level parameter is of type TLoggerLogLevel, which is likely an enum
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
   * "TLoggerLogLevel", "message" of type "string" or "any", and an optional parameter
   * "label" of type "TLoggerLogLabel". The function returns an object of type "TLogger".
   */
  static log(level: TLoggerLogLevel, message: string | any, label?: TLoggerLogLabel): TLogger {
    return logger.log(level, message, label)
  }

  /**
   * This function logs a beautiful logo to the console.
   */
  static startApplicationBeautifulLog(): void {
    console.log(beautifulLogo)
  }

  /**
   * The function generates a random code name consisting of a prefix, a randomly
   * selected band name, and a randomly generated code.
   * @returns A randomly generated code name in the format of
   * "VDS_CODENAME_RANDOMNUMBER".
   */
  static genCodenameProcess(): string {
    const codenames: string[] = ['inventanimate','currents','saviour','thedevilwearsprada','ourmirage','burytomorrow','imminence','badomens','dancegavindance','wagewar','spiritbox','landmvrks','theplotinyou','erra','iceninekills','architects','bringmethehorizon','forthefallendreams','theamityaffliction']
    const codeLength = 5
    const prefix = 'vds'
    const codename: string = codenames[Math.floor(Math.random() * codenames.length)]
    const randomCodeNumber = Math.floor(Math.random() * Number('9'.repeat(codeLength)))
    const code: string = '0'.repeat(codeLength - String(randomCodeNumber).length) + randomCodeNumber

    return [prefix, codename, code].join('_')
  }

  static getProcessArgv(): TProcessArgs {
    const flags: TProcessArgs = {}
    const [,, ...argv] = process.argv

    let prev = '_'
    for (const flag of argv) {
      const regexpFlag = /-{1,2}[a-zA-Z]*/g
      // value
      if (!regexpFlag.test(flag)) {
        flags[prev] = flag
        continue
      }

      // key
      const flagName: string | undefined = flag.split('-').at(-1)
      if (!flagName) continue
      flags[flagName] = true
      prev = flagName
    }

    return flags
  }
}