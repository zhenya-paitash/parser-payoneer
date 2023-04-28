import fs from 'node:fs'
import pup, { Page, Browser, Configuration, ElementHandle } from 'puppeteer'
import { Utils } from '../utils/utils.module'
import {
  IUser,
  IParserController,
  IParserResponse,
  IParserResponseBalances,
  IParserResponseData,
  IParserResponseUser,
  IParserPayoneerUrls,
  IParserResponseTransaction,
  TParserCaptchaAudio
} from './parser.interface'
import { IApiService } from '../api/api.interface'
import { IRequestResult } from '../request/request.interface'
import { ExistPuppeteerBrowser, ExistPuppeteerPage } from '../decorators'

/* The ParserController class is a TypeScript implementation of a parser that logs
into a Payoneer account and retrieves user data such as balances and transaction
history. */
export class ParserController implements IParserController {
  private _browser?: Browser | null
  private _config?: Configuration
  private _page?: Page
  chrome: string
  urls: IParserPayoneerUrls = {
    login: 'https://login.payoneer.com',
    account: 'https://myaccount.payoneer.com',
    accountHome: 'https://myaccount.payoneer.com/ma/'
  }

  success = false
  errors: string[] = []
  data: IParserResponseData = {}


  /**
   * This is a constructor function that initializes an object with an API service
   * and a configuration object, and finds the local path for Chrome.
   * @param {IApiService} apiService - The `apiService` parameter is a dependency
   * injection of an interface `IApiService`. It is used to make API calls to a
   * server or external service.
   * @param {Configuration} config - The `config` parameter is an optional object
   * that contains configuration options for the constructor. It has a default
   * value of an empty object `{}`.
   */
  constructor(
    private readonly apiService: IApiService,
    config: Configuration = {}
  ) {
    this._config = config
    this.chrome = this.findLocalChromePath()
  }

  /**
   * This is an async function that parses user data and returns a response object
   * with success status, errors, and data.
   * 
   * @param user The "user" parameter is an object of type "IUser" which contains
   * the username and password of the user whose account data needs to be parsed.
   * @return a Promise that resolves to an object of type IParserResponse, which
   * contains the following properties: success (a boolean indicating whether the
   * parsing was successful or not), errors (an array of error messages), and data
   * (an object containing the parsed data).
   */
  async parsing(user: IUser): Promise<IParserResponse> {
    try {
      await this.$connect()
      await this.$page()
      await this.getAccountData(user.username, user.password)
      this.success = true
    } catch (e: Error | any) {
      this.errors.push(e?.message)
      Utils.log('error', `Errors: ${this.errors.join('  ➜  ')}`, 'parser')
    } finally {
      await this.$disconnect()
    }

    const parserData: IParserResponse = {
      success: this.success,
      errors: this.errors,
      data: this.data
    }

    this.clear()

    return parserData
  }

  /**
   * This is a private async function that launches a headless Chrome browser with
   * specific configurations and settings.
   */
  private async $connect(): Promise<void> {
    this._browser = await pup.launch({
      executablePath: this.chrome,
      // headless: false,
      headless: 'new',
      args: [
        '--start-maximized',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        // '--no-sandbox',
        // '--disable-gpu',
        // '--disable-setuid-sandbox',
        // '--disable-extension',
      ],
      ignoreDefaultArgs: ['--enable-automation'],
      userDataDir: './.userdata_cache',
      devtools: true,
      ignoreHTTPSErrors: true,
      defaultViewport: { width: 1920, height: 1080 },
      ...this._config,
    })

    await Utils.sleep(1)
  }

  /**
   * This is a private asynchronous function that closes the browser and sets the
   * browser object to null.
   */
  private async $disconnect(): Promise<void> {
    this._browser?.close()
    this._browser = null
  }

  /**
   * This function sets up a new page in a browser instance with specific settings.
   */
  @ExistPuppeteerBrowser
  private async $page(): Promise<void> {
    if (!this._browser) {
      throw new Error("this._browser not found")
    }

    const [page]: Page[] = await this._browser.pages()
    await page.setDefaultNavigationTimeout(60_000)
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8' })
    const defaultUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36'
    await page.setUserAgent(defaultUserAgent)
    this._page = page
  }

  /**
    * This function logs into an account using provided credentials and retrieves
    * account data if the login is successful.
    * @param {string} username - A string representing the username of the account to
    * be accessed.
    * @param {string} password - The password parameter is a string that represents
    * the user's password for their account.
    */
  @ExistPuppeteerBrowser
  @ExistPuppeteerPage
  private async getAccountData(username: string, password: string): Promise<void> {
    if (!this._browser || !this._page) {
      throw new Error(`this._browser not found`)
    }

    // TRY OPEN ACCOUNT HOME PAGE
    await this._page.goto(this.urls.accountHome, { waitUntil: ['networkidle0', 'domcontentloaded'] })
    await this.wait(10)

    // CHECK PAGE & TRY LOGIN
    /* The above code is using a while loop to repeatedly check if the current page
    is a login page. If it is a login page, it will attempt to login with the
    provided username and password using the `login` function and wait for 10
    seconds using the `wait` function. If it fails to login after 3 attempts, it
    will throw an error with the number of attempts made and the current page
    URL. */
    let i = 0
    while(await this.checkLoginPage()) {
      if (++i > 3) {
        throw new Error(`tryed ${i} times to login. Current page: ${await this.getCurrentUrl()}`)
      }

      await this.login(username, password)
      await this.wait(10)
    }

    // CHECK & TRY GET DATA
    if (await this.checkAccountPage()) {
      await this.parseAccountData()
    } else {
      throw new Error(`can't parse data from this page: ${await this.getCurrentUrl()}`)
    }
  }

  /**
   * This is a private async function that logs in a user with a given username and
   * password.
   * 
   * @param username The username parameter is a string that represents the
   * username of the user trying to log in.
   * @param password The password parameter is a string that represents the user's
   * password for logging into a website or application.
   */
  private async login(username: string, password: string): Promise<void> {
    if (!this._page) {
      throw new Error('this._page not found')
    }

    const formSelector = '.logInForm > form'
    await this._page.waitForSelector(formSelector)
    // ? FORM
    const form = await this._page.$(formSelector)
    if (!form) {
      throw new Error(`form not found on login page. Current page: ${await this.getCurrentUrl()}`)
    }

    // ? INPUT ELEMENTS
    /* The above code is using TypeScript to find the input fields for username and
    password, as well as the submit button for a login form. If any of these
    elements cannot be found, an error is thrown with a message indicating the
    current page URL. */
    const inputUsername = await form.$('input#username')
    const inputPassword = await form.$('input[name="password"]')
    const buttonSubmit = await form.$('button#login_button')
    if (!inputUsername || !inputPassword || !buttonSubmit) {
      throw new Error(`can't find login inputs. Current page: ${await this.getCurrentUrl()}`)
    }

    // await this._page.screenshot({ path: new Date().getTime() + '.png', fullPage: true })
    // await this.wait(0.5)

    // ? ERROR BOX
    /* The above code is using Puppeteer to search for a specific error box element
    on a web page. If the error box is found, it retrieves the text content of
    the element and adds an error message to an array. It also has a commented
    out line that would throw an error if the error box is found. */
    const errorBox = await form.$('div.logInForm__error-box-container')
    if (errorBox) {
      const errorBoxContent: string = await errorBox.evaluate(el => (el as HTMLElement)?.innerText)
      const error = `find ErrorBox with content: ${errorBoxContent}`
      this.errors.push(error)
      // throw new Error(`find Error Box with content: ${errorBoxContent}`)
    }

    // ? INPUT DATA
    /* The above code is simulating user input for a username and password on a web
    page. It first clicks on the input field for the username, types in the
    provided username, waits for 1 second, then does the same for the password
    input field. This code is likely part of an automated testing script. */
    // username
    await inputUsername.click({ clickCount: 3 })
    await inputUsername.type(username)
    await this.wait(1)
    // password
    await inputPassword.click({ clickCount: 3 })
    await inputPassword.type(password)
    await this.wait(1)

    // ? CAPTCHA
    /* The above code is checking if there is a captcha element on a login form. If
    there is, it retrieves the audio content of the captcha and sends it to a
    REST API to get a response. It then attempts to login by finding the input
    fields, inputting a number, finding the submit button, clicking it, and
    checking if the login was successful. If the login was not successful, it
    throws an error. */
    const captcha = await form.$('div.logInForm__captcha > div.google-captcha-wrap')
    if (captcha) {
      // 1. get audio
      const audio: TParserCaptchaAudio = await this.getCaptchaAudioContent(captcha)
      if (!audio.success && audio.error) {
        throw new Error(audio.error)
      }
      // 2. send audio on REST API and get response
      console.log(audio.audio)
      const result: IRequestResult = await this.apiService.sendCaptcha(audio.audio)
      console.log(result)
      // 3. try login
      await this.inputCaptchaAudioResult(result)
      // TODO: delete-next-line
      await this.wait(600)
    }

    // ? SUBMIT
    await buttonSubmit.click()
  }

  /**
   * This function retrieves the audio content of a captcha element.
   * @param captcha - The `captcha` parameter is an `ElementHandle` representing a
   * div element that contains a reCAPTCHA challenge.
   * @returns a Promise that resolves to an object of type TParserCaptchaAudio, which
   * has three properties: success (a boolean indicating whether the operation was
   * successful), error (a string containing an error message if the operation
   * failed), and audio (a string containing the URL of the audio file to be played
   * for the captcha challenge).
   */
  private async getCaptchaAudioContent(captcha: ElementHandle<HTMLDivElement>): Promise<TParserCaptchaAudio> {
    try {
        if (!this._page) throw new Error('this._page not found')
        const checkboxIframe = await captcha.$('iframe')
        await checkboxIframe?.click()
        await this.wait(2)
        const captchaIframe = await this._page.$('iframe[title="recaptcha challenge expires in two minutes"]')
        const captchaIframeContent = await captchaIframe?.contentFrame()
        if (!captchaIframeContent) throw new Error(`capthca resolve: iframe not loaded. Maybe checkbox is checked`)
        const captchaAudioButton = await captchaIframeContent.$('button#recaptcha-audio-button')
        await captchaAudioButton?.click()
        await this.wait(2)
        const captchaBodyText = await captchaIframeContent?.$('.rc-doscaptcha-body-text')
        if (captchaBodyText) {
          const captchaBodyTextContent = await captchaBodyText?.evaluate(el => (<HTMLElement>el)?.innerText)
          throw new Error(`iframe text body "${captchaBodyTextContent}"`)
        }
        const captchaAudioDownloadButton = await captchaIframeContent.$('.rc-audiochallenge-tdownload-link')
        const audio = await captchaAudioDownloadButton?.evaluate(el => (<HTMLElement>el)?.getAttribute('href'))
        if (!audio) throw new Error('audio not found')

        return { success: true, error: null, audio }
      } catch (e: Error | any) {
        // this.errors.push(`captcha resolve: error ${e?.message}`)
        const error = `captcha resolve: error ${e?.message}`
        return { success: false, error, audio: '' }
      }
  }

  /**
   * This function inputs the resolved captcha audio result into the corresponding
   * input field on a webpage.
   * @param {IRequestResult} apiCaptchaResult - The parameter `apiCaptchaResult` is
   * of type `IRequestResult`, which is likely an object containing the result of a
   * request made to an API for captcha resolution. This function uses the resolved
   * captcha value from this object to input it into the captcha audio challenge on
   * a web page.
   */
  private async inputCaptchaAudioResult(apiCaptchaResult: IRequestResult): Promise<void> {
    try {
      if (!this._page) throw new Error('this._page not found')
      const iframe = await this._page.$('iframe[title="recaptcha challenge expires in two minutes"]')
      const iframeContent = await iframe?.contentFrame()
      if (!iframeContent) throw new Error(`iframe not found`)
      const input: ElementHandle<HTMLInputElement> | null = await iframeContent.$('input#audio-response')
      if (!input) throw new Error('input not found')
      await input.click()
      // TODO: input resolve from apiCaptchaResult
      // await input.type(apiCaptchaResult.data?.captchaResolve)
      await input.type('TEST CAPTCHA RESOLVE')
      await input.press('Enter')
      await this.wait(2)
      // TODO: error element always find?
      const modalError = await iframeContent.$('.rc-audiochallenge-error-message')
      const modalErrorMessage = await modalError?.evaluate(el => (<HTMLElement>el)?.innerText)
      if (modalErrorMessage) throw new Error(modalErrorMessage)
    } catch (e: Error | any) {
      const error = `captcha resolve input: error ${e?.message}`
      throw new Error(error)
    }
  }

  /**
   * This function uses Puppeteer to scrape a webpage and extract user details,
   * balance information, and transaction data, which are then assigned to
   * properties of an object called "data".
   */
  private async parseAccountData(): Promise<void> {
    if (!this._page) {
      throw new Error(`this._page not found`)
    }

    if (!await this.checkAccountHomePage()) {
      await this._page.goto(this.urls.accountHome, { waitUntil: ['networkidle0', 'domcontentloaded'] })
    }

    /* The above code is using Puppeteer to navigate to a webpage and wait for
    three specific selectors to be present on the page. It will try to wait for
    these selectors three times, and if they are not found, it will reload the
    page and try again. Once the selectors are found, it will store references
    to the corresponding elements on the page. */
    const balancesSelector = 'div.balances-cards-list'
    const detailsSelector = 'div.myaccount-layout__right-pane > div.user-details'
    const transactionsSelector = 'div.transactions-content'
    // wait all selectors 3 times
    let waitCount = 1
    while (waitCount < 4) {
      try {
        await this._page.waitForSelector(balancesSelector)
        await this._page.waitForSelector(transactionsSelector)
        await this._page.waitForSelector(detailsSelector)

        break
      } catch (e) {
        await this._page.reload({ waitUntil: ['networkidle0', 'domcontentloaded'] })
        waitCount++
      }
    }

    // ? ELEMENTS
    const userDetailsEl = await this._page.$(detailsSelector)
    const balanceEl = await this._page.$(balancesSelector)
    const transactionsEl = await this._page.$(transactionsSelector)

    // ? [TEST] screenshots
    // await this._page.screenshot({ path: './fullpage.png', fullPage: true })
    // await this.wait(0.5)
    // await userDetailsEl?.screenshot({ path: './userdetails.png' })
    // await this.wait(0.5)
    // await balanceEl?.screenshot({ path: './balance.png' })
    // await this.wait(0.5)
    // await transactionsEl?.screenshot({ path: './transactions.png' })
    // await this.wait(0.5)

    // ? GET DATA
    /* The above code is using Puppeteer to scrape a webpage and extract user
    details from a specific HTML element. It is using the `evaluate` method to
    run a function in the context of the webpage and extract the user's name,
    ID, and last login time from the HTML elements with specific classes. The
    extracted data is then assigned to an object and stored in the `data`
    property of the current object. The `await` keyword is used to wait for the
    `evaluate` method to complete before continuing with the execution of the
    code. */
    const userDetails = await userDetailsEl?.evaluate(el => ({
      name: (el.querySelector('div.user-name') as HTMLElement)?.innerText || '',
      id: (el.querySelector('div.customer-id') as HTMLElement)?.innerText?.match(/\d+/g)?.at(0) || '',
      lastLogin: (el.querySelector('div.last-login') as HTMLElement)?.innerText || '',
    }))
    this.data.user = userDetails as IParserResponseUser

    /* The above code is using Puppeteer to scrape a webpage and extract balance
    information from a list of balance cards. It is selecting all div elements
    with class "balance-card" using the $ method and then mapping over each
    card to extract the balance amount and currency. It then reduces the
    extracted data into an object with currency as the key and balance amount as
    the value. Finally, it assigns the resulting balances object to a property
    of the data object. */
    const balances = await balanceEl?.$$eval('div.balance-card', cards => cards.map(card => {
      const content = (card.querySelector('div.balance-card__content > main.balance-card__main div.balance') as HTMLElement)?.innerText
      if (!content) return

      const [amount, currency]: string[] = content.split(' ')
      if (!amount || !currency) return

      return { amount, currency }
    })?.reduce((res, cur) => {
      if (!cur) return res
      return {...res , [cur.currency]: cur.amount}
    }, {}))
    this.data.balances = balances as IParserResponseBalances

    /* The above code is using Puppeteer to scrape transaction data from a webpage.
    It is selecting all the div elements with class "transaction-row" and then
    extracting information from their child elements such as date, description,
    status, and amount. It then creates an object with this information and
    returns an array of these objects as the output. Finally, it assigns this
    output to the "transactions" property of an object called "data". */
    const transactions = await transactionsEl?.$$eval('div.transaction-row', rows => rows.map(row => {
      // GET ELEMENTS
      const dateEl: HTMLElement | null = row.querySelector('.transaction-date')
      const descriptionEl: HTMLElement | null = row.querySelector('.transaction-description')
      const statusEl: HTMLElement | null = row.querySelector('.transaction-status')
      const amountEl: HTMLElement | null = row.querySelector('.transaction-amount')

      // GET OUTPUT ELEMENTS DATA
      const output: IParserResponseTransaction = {
        date: dateEl ? {
          monthDay: (dateEl.querySelector('.month-day') as HTMLElement)?.innerText ?? '',
          year: (dateEl.querySelector('year') as HTMLElement)?.innerText ?? '',
        } : undefined,

        description: descriptionEl ? {
          title: descriptionEl.getAttribute('title') ?? ''
        } : undefined,

        status: statusEl ? {
          text: statusEl.innerText ?? ''
        } : undefined,

        amount: amountEl ? {
          class: amountEl.getAttribute('class') ?? '',
          content: amountEl.innerText ?? ''
        } : undefined,
      }

      return output
    }))
    this.data.transactions = transactions as IParserResponseTransaction[]
  }

  /**
   * This function returns the current URL of a web page using async/await syntax
   * in TypeScript.
   * @returns The `getCurrentUrl` function returns a Promise that resolves to a
   * string representing the current URL of the `_page` object. If the `_page`
   * object is undefined or the URL cannot be retrieved, an error is thrown.
   */
  private async getCurrentUrl(): Promise<string> {
    const url: string | undefined = await this._page?.url()
    if (!url) {
      throw new Error(`current url can't be get`)
    }

    return url
  }

  /**
   * This function checks if the current URL includes the login page URL and
   * returns a boolean value.
   * 
   * @return A Promise that resolves to a boolean value.
   */
  private async checkLoginPage(): Promise<boolean> {
    const url = await this.getCurrentUrl()
    return url?.includes(this.urls.login)
  }

  /**
   * This function checks if the current URL includes the account page URL and
   * returns a boolean value.
   * 
   * @return A boolean value indicating whether the current URL includes the
   * account page URL.
   */
  private async checkAccountPage(): Promise<boolean> {
    const url = await this.getCurrentUrl()
    return url?.includes(this.urls.account)
  }

  /**
   * This function checks if the current URL includes the account home page URL and
   * returns a boolean value.
   * 
   * @return A Promise that resolves to a boolean value. The boolean value
   * indicates whether the current URL includes the account home URL.
   */
  private async checkAccountHomePage(): Promise<boolean> {
    const url = await this.getCurrentUrl()
    return url?.includes(this.urls.accountHome)
  }

  /**
   * This is a private asynchronous function that waits for a specified number of
   * seconds using a utility function called "sleep".
   * @param {number} sec - The "sec" parameter is a number that represents the
   * number of seconds to wait before continuing with the execution of the code. It
   * is used in conjunction with the "Utils.sleep" function to pause the execution
   * of the code for the specified number of seconds.
   */
  private async wait(sec: number): Promise<void> {
    await Utils.sleep(sec)
  }

  /**
   * This function finds the local path of the Chrome browser executable file.
   * 
   * @return a string which is the path to the local installation of Google Chrome
   * on a Windows machine. If the function is unable to find the path, it throws an
   * error.
   */
  private findLocalChromePath(): string {
    const localChromePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ]

    for (const path of localChromePaths) if (fs.existsSync(path)) return path

    const error = 'chrome path not found'
    Utils.log('error', error, 'parser')
    throw new Error(error)
  }

  /**
   * This function creates a JSON file with provided data and logs any errors that
   * occur.
   * 
   * @param data The data parameter is an object that contains the data that will
   * be written to the JSON file.
   */
  // private createTestDataJsonFile(data: object): void {
  //   try {
  //     fs.writeFileSync('data.json', JSON.stringify(data, null, 2), { encoding: 'utf8' })
  //   } catch (e: Error | any) {
  //     Utils.log('error', e?.message || e, 'parser')
  //   }
  // }

  /**
   * The function clears the success flag, errors array, and data object.
   */
  private clear() {
    this.success = false
    this.errors = []
    this.data = {}
  }
}