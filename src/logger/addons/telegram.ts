import fs from 'node:fs'
import path from 'node:path'
import moment from 'moment'
import axios from 'axios'
import cron from 'node-cron'
import FormData from 'form-data'
import { Utils } from '../../utils/utils.module'
import { TLoggerLogFiles } from '../logger.interface'
import { IRequestResult } from '../../request/request.interface'

/* The LoggerTelegram class sends log files to specified Telegram users and deletes
them if they are older than the current day. */
export class LoggerTelegram {
  private readonly botToken: string
  private readonly users: number[]

  /* The `constructor` method is initializing the `LoggerTelegram` class with a
  `botToken` and a `users` string. The `botToken` is a string representing the
  Telegram bot token, while the `users` string is a comma-separated list of
  Telegram user IDs. */
  constructor(token: string, users: string) {
    this.botToken = token
    this.users = users.split(',').map(Number)
    this.watcher()
  }

  /**
   * This function finds all log files in a specific directory and returns an array
   * of objects containing the file name and file path.
   * @returns The `findAll()` function returns an array of objects of type
   * `TLoggerLogFiles`, which contain information about log files found in the
   * `.payoneer` directory located in the `LOCALAPPDATA` directory of the current
   * user's system. Each object in the array has two properties: `file` which is
   * the name of the log file, and `filepath` which is the full path to the
   */
  private findAll(): TLoggerLogFiles[] {
    const root = path.join(process.env?.LOCALAPPDATA ?? './', '.payoneer')
    const logs: string[] = fs.readdirSync(root)
    const files: TLoggerLogFiles[] = logs.map(log => ({
      file: log,
      filepath: path.join(root, log)
    }))
    return files
  } 


  /**
   * This is a TypeScript function that sends a document to a user via the Telegram
   * API.
   * @param {string} file - The file parameter is a string that represents the path
   * to the file that needs to be sent.
   * @param {number} user - The user parameter is the ID of the Telegram user to
   * whom the document will be sent.
   * @returns a Promise that resolves to an object of type IRequestResult.
   */
  private async send(file: string, user: number): Promise<IRequestResult> {
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendDocument`
      // TODO: send fake nickname account from API | IP
      const caption = `#${Math.floor(Math.random() * 999999999)}`
      const form = new FormData()
      form.append('document', fs.readFileSync(file), file)
      const response = await axios.post(url, form, {
        params: {
          chat_id: user,
          parser_mode: 'html',
          caption,
        },
        headers: {
          ...form.getHeaders(),
          'Content-Type': 'application/json',
        }
      })
      const result: IRequestResult = {
        success: true,
        error: null,
        status: response.status,
        data: response.data,
      }

      return result
    } catch (e: Error | any) {
      const result: IRequestResult = {
        success: false,
        error: e?.message || 'Telegram send log error',
        status: e?.res?.statusCode || e?.status || 500,
        data: {}
      }

      return result
    }
  }

  /**
   * This is a TypeScript function that deletes a file asynchronously and logs an
   * error message if the deletion fails.
   * 
   * @param filepath The filepath parameter is a string that represents the path of
   * the file that needs to be deleted.
   */
  private async delete(filepath: string): Promise<void> {
    await fs.unlink(filepath, (e) => {
      if (e) {
        Utils.log('error', 'LoggerTelegram failed to delete file.', 'app')
      }
    })
  }

  /**
   * This is a TypeScript function that renames a file asynchronously using the fs
   * module and logs an error if the renaming fails.
   * 
   * @param filepath The filepath parameter is a string that represents the current
   * location and name of the file that needs to be renamed.
   * @param newFilepath The newFilepath parameter is a string that represents the
   * new path and filename for the file being renamed.
   */
  private async rename(filepath: string, newFilepath: string): Promise<void> {
    await fs.rename(filepath, newFilepath, e => {
      if (e) {
        Utils.log('error', 'LoggerTelegram failed to rename file.', 'app')
      }
    })
  }

  /**
   * This is an async function that iterates through logs, checks if the log date
   * is before the current date, and sends the log file to each user if it is.
   */
  private async handler() {
    const logs = this.findAll()

    for (const { file, filepath } of logs) {
      const find = file.match(/\d{8}/i)?.at(0)
      if (!find) continue

      const logDate = moment(find, 'DDMMYYYY').utcOffset('+0300')
      const currentDate = moment().utcOffset('+0300').startOf('day')

      if (logDate < currentDate) {
        for (const user of this.users) {
          const res = await this.send(filepath, user)
          // console.log(res)
        }

        // await this.delete(filepath)
        // await this.rename(filepath, path.join(__dirname, file))
      }
    }
  }

  /**
   * This function sets up a cron job to run a handler function every 5 seconds at
   * midnight in the Minsk timezone.
   */
  private watcher() {
    cron.schedule('5 0 0 * * *', async () => {
      await this.handler()
    }, { timezone: 'Europe/Minsk' })
  }
}