import fs from 'node:fs'
import path from 'node:path'
import moment from 'moment'
import axios from 'axios'
import cron from 'node-cron'
import FormData from 'form-data'
import { Utils } from '../../utils/utils.module'
import { TLoggerLogFile } from '../logger.interface'

/* The LoggerTelegram class sends log files to specified Telegram users and deletes
them if they are older than the current day. */
export class LoggerTelegram {
  private ip?: string 
  private readonly processCodename: string
  private readonly botToken: string
  private readonly users: number[]

  /* The `constructor` method is initializing the `LoggerTelegram` class with a
  `botToken` and a `users` string. The `botToken` is a string representing the
  Telegram bot token, while the `users` string is a comma-separated list of
  Telegram user IDs. */
  constructor(token: string, users: string) {
    this.getCurrentIpAddress()
    this.processCodename = Utils.genCodenameProcess()
    Utils.log('info', `Applicaion codename: ${this.processCodename}`, 'logger')
    this.botToken = token
    this.users = users.split(',').map(Number)
    this.watcher()
  }

  /**
   * This is an asynchronous function that retrieves the current IP address using
   * an external API and logs any errors that occur.
   */
  private async getCurrentIpAddress(): Promise<void> {
    try {
      const res = await axios.get('https://api.ipify.org?format=json')
      this.ip = res.data.ip
      Utils.log('info', `Current ip address: ${this.ip}`, 'logger')
    } catch (e: Error | any) {
      const error = `Logger. Telegram addon. IP error: ${e?.message}`
      Utils.log('error', error, 'logger')
      // throw new Error(error)
    }
  }

  /**
   * This function finds all JSON log files in a specific directory and returns an
   * array of objects containing information about each file.
   * @returns The `findAll()` function returns an array of objects of type
   * `TLoggerLogFile`, which contain information about log files.
   */
  private findAll(): TLoggerLogFile[] {
    const root = path.join(process.env?.LOCALAPPDATA ?? './', '.payoneer')
    const logs: string[] = fs.readdirSync(root).filter(log => log.endsWith('.json'))
    const files: TLoggerLogFile[] = logs.map(log => ({
      filename: log,
      filepath: path.join(root, log),
      paths: root.split('\\'),
    }))

    return files
  } 


  /**
   * This is a TypeScript function that sends a document to a user via the Telegram
   * API with a specified caption.
   * @param {string} file - The file parameter is a string that represents the path
   * to the file that will be sent as a document to the specified user.
   * @param {number} user - The user parameter is the ID of the Telegram user to
   * whom the file will be sent.
   */
  private async send(file: string, user: number): Promise<void> {
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendDocument`
      const caption = `#${this.processCodename}\n#${this.ip}`
      const form = new FormData()
      form.append('document', fs.readFileSync(file), file)
      await axios.post(url, form, {
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
    } catch (e: Error | any) {
      const error = `Logger. Telegram addon. Send error: ${e?.message}`
      Utils.log('error', error, 'logger')
    }
  }

  /**
   * This is a TypeScript function that deletes a file at a specified filepath and
   * logs any errors encountered.
   * @param {string} filepath - The filepath parameter is a string that represents
   * the path of the file that needs to be deleted.
   */
  private delete(filepath: string): void {
    fs.unlink(filepath, (e) => {
      if (e) {
        const error = `Logger. Telegram addon. Delete error: ${e.message}`
        Utils.log('error', error, 'logger')
      }
    })
  }

  /**
   * This function renames a file at a given filepath to a new filepath.
   * @param {string} filepath - A string representing the current file path of the
   * file that needs to be renamed.
   * @param {string} newFilepath - The new file path is the destination path where
   * the file will be renamed to. It is the new name and location of the file after
   * it has been renamed.
   */
  private rename(filepath: string, newFilepath: string): void {
    fs.rename(filepath, newFilepath, e => {
      if (e) {
        const error = `Logger. Telegram addon. Rename error: ${e.message}`
        Utils.log('error', error, 'logger')
      }
    })
  }

  /**
   * This is a TypeScript function that copies a file from one location to another
   * and logs any errors that occur.
   * @param {string} from - The source file path that needs to be copied.
   * @param {string} to - The "to" parameter is a string that represents the
   * destination path where the file will be copied to.
   */
  private copy(from: string, to: string): void {
    try {
      fs.copyFileSync(from, to)
    } catch (e: Error | any) {
      const error = `Logger. Telegram addon. Copy error: ${e.message}`
      Utils.log('error', error, 'logger')
    }
  }

  /**
   * This is an async function that iterates through logs, checks if the log date
   * is before the current date, and sends the log file to each user if it is.
   */
  private async handler() {
    const logs = this.findAll()

    for (const log of logs) {
      const find = log.filename.match(/\d{8}/i)?.at(0)
      if (!find) continue

      const logDate = moment(find, 'DDMMYYYY').utcOffset('+0300')
      const currentDate = moment().utcOffset('+0300').startOf('day')

      if (logDate < currentDate) {
        for (const user of this.users) await this.send(log.filepath, user)

        // BACKUP LOG FILE
        this.backupLog(log)

        // DELETE LOG FILE
        this.delete(log.filepath)
      }
    }
  }

  private backupLog(log: TLoggerLogFile): void {
    try {
      const backupPath = path.join(...log.paths, 'backup')
      // MAKE FOLDER 'backup'
      fs.mkdirSync(backupPath, { recursive: true })
      // COPY LOG FILE
      this.copy(log.filepath, path.join(backupPath, log.filename))
    } catch (e: Error | any) {
      Utils.log('error', `Logger. Telegram addon. Backup error: ${e?.message}`)
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