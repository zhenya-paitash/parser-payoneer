import { resolve } from 'node:path'
import { DotenvParseOutput, config } from 'dotenv'
import { Utils } from '../utils/utils.module'
import { IConfigService, IConfigProcessEnv, TConfigEnv } from './config.interface'


/* The ConfigService class retrieves values from a configuration object based on a
given key and throws an error if the value is not found. */
export class ConfigService implements IConfigService {
  private config: DotenvParseOutput

  /**
   * The constructor function initializes the configuration object by parsing a
   * .env file and throwing errors if the file is not found or empty.
   */
  constructor() {
    // explicitly specify the path .env for packaging the application in pkg
    const { error, parsed } = config({ path: resolve(__dirname, '..', '..', '.env') })
    if (error) {
      throw new Error('.env: file not found')
    }
    if (!parsed) {
      throw new Error('.env: file is empty')
    }

    this.config = parsed
  }

  /**
   * This function retrieves a value from a configuration object based on a given
   * key and throws an error if the value is not found.
   * @param {TConfigEnv} key - TConfigEnv, which is a type parameter representing the key of
   * the configuration value to retrieve from the config object. It could be a
   * string or a number or any other type that is used as a key in the config
   * object.
   * @returns a string value that corresponds to the key passed as an argument.
   */
  get(key: TConfigEnv): string {
    const value = this.config[key]
    if (!value) {
      const error = '.env: value not found'
      Utils.log('error', error, 'config')
      throw new Error(error)
    }

    return value
  }

  /**
   * This function retrieves multiple values from a configuration object based on
   * an array of keys and returns them as an object.
   * @param {TConfigEnv[]} keys - An array of keys of type TConfigEnv that represent the
   * environment variables to be retrieved from the configuration.
   * @returns The function `getMany` returns an object of type `IConfigProcessEnv`, which
   * contains key-value pairs of environment variables. The keys are of type
   * `TConfigEnv`, which is an array of strings representing the names of the environment
   * variables to retrieve. The values are of type `string`, representing the
   * values of the corresponding environment variables.
   */
  getMany(keys: TConfigEnv[]): IConfigProcessEnv {
    const values: IConfigProcessEnv = {}
    for (const key of keys) {
      const value = this.config[key]
      if (!value) {
        const error = `.env: ${key} key value not found`
        Utils.log('error', error, 'config')
        throw new Error(error)
      }

      values[key] = value
    }

    return values
  }
}