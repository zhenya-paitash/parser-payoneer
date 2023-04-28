export {}

/* This code is declaring and extending the global `ProcessEnv` interface in
TypeScript. It adds several properties to the `ProcessEnv` interface, including
`SERVER_PORT`, `API_URL`, `API_TOKEN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_USERS`,
and `LOCALAPPDATA`. These properties are expected to be defined as environment
variables when the code is run. This code also declares a nested `NodeJS`
namespace to ensure that the `ProcessEnv` interface is recognized as part of the
Node.js environment. */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SERVER_PORT: string
      API_URL: string
      API_TOKEN: string
      TELEGRAM_BOT_TOKEN: string
      TELEGRAM_USERS: string
      LOCALAPPDATA?: string
    }
  }

  interface ProcessEnv {
    SERVER_PORT: string
    API_URL: string
    API_TOKEN: string
    TELEGRAM_BOT_TOKEN: string
    TELEGRAM_USERS: string
    LOCALAPPDATA?: string
  }
}
