import { FastifyRequest } from "fastify"
import { Utils } from "./utils/utils.module"
import { IServerResponse } from "./server/server.interface"
import { IParserController } from "./parser/parser.interface"
import { TLoggerLogLabel, TLoggerLogLevels } from "./logger/logger.interface"

/**
 * This is a TypeScript function that generates a class method decorator that
 * validates arguments passed to the method using a given function and throws an
 * error with a custom error message if the validation fails.
 * 
 * @param fn A function that takes a value of type T and a variable number of
 * arguments of type A and returns a boolean value.
 * @param errorMessage The error message to be thrown if the validation fails.
 * @return A higher-order function that takes a class method as input and returns a
 * new function that validates the input arguments using the provided validation
 * function and throws an error with the provided error message if the validation
 * fails.
 */
// function genClassMethodsValidateDecorator<T, A extends any[] = any[]>(
//   fn: (t: T, ...args: A) => boolean,
//   errorMessage: string,
// ) {
//   return function(t: T) {

//     /* This is a higher-order function that generates a class method decorator. The
//     returned function takes a class method as input and returns a new function that
//     validates the input arguments using the provided validation function and throws
//     an error with the provided error message if the validation fails. */
//     return function<
//       This,
//       Args extends A,
//       Return,
//       Fn extends (this: This, ...args: Args) => Return
//     >(
//       target: Fn,
//       context: ClassMethodDecoratorContext<This, Fn>
//     ) {
//       const methodName = String(context.name)

//       /* This is a higher-order function that generates a class method decorator. The
//       returned function takes a class method as input and returns a new function that
//       validates the input arguments using the provided validation function and throws
//       an error with the provided error message if the validation fails. */
//       return function(this: This, ...args: Args): Return {
//         if (fn(t, ...args)) {
//           return target.call(this, ...args)
//         }

//         throw new Error(`${methodName}: ${errorMessage} (arg: ${t})`)
//       }
//     }

//   }
// }

/* This code is defining a TypeScript function called
`genClassMethodsValidateDecorator` that generates a class method decorator. The
decorator validates arguments passed to the method using a given function and
throws an error with a custom error message if the validation fails. */
// export const LimitArgs = genClassMethodsValidateDecorator(
//   (count: number, arr: Array<any>, ..._rest: any[]) => arr.length <= count,
//   'too many elements in array',
// )

/* This code is defining a TypeScript function called `Max` that generates a class
method decorator. The decorator validates that a numeric argument passed to the
method is less than or equal to a maximum value, and throws an error with a
custom error message if the validation fails. The
`genClassMethodsValidateDecorator` function is used to generate this decorator
by passing in a validation function that checks if the value is less than or
equal to the maximum value, and an error message to be thrown if the validation
fails. The resulting decorator can be applied to a class method to enforce this
validation. */
// export const Max = genClassMethodsValidateDecorator(
//   (max: number, value: number, ..._rest: any[]) => value <= max,
//   'greater than max value',
// )

/* This code is defining a TypeScript function called `ExistBrowser` that generates
a class method decorator. The decorator validates that a `Browser` object is
present as an argument passed to the method, and throws an error with a custom
error message if the validation fails. The `genClassMethodsValidateDecorator`
function is used to generate this decorator by passing in a validation function
that checks if the `Browser` object is not present, and an error message to be
thrown if the validation fails. The resulting decorator can be applied to a
class method to enforce this validation. */
// export const ExistBrowser = genClassMethodsValidateDecorator(
//   (browser: Browser, ..._rest: any[]) => !browser,
//   'ParserController: Browser not found'
// )

/* This code is defining a TypeScript function called `ExistPage` that generates a
class method decorator. The decorator validates that a `Page` object is present
as an argument passed to the method, and throws an error with a custom error
message if the validation fails. The `genClassMethodsValidateDecorator` function
is used to generate this decorator by passing in a validation function that
checks if the `Page` object is not present, and an error message to be thrown if
the validation fails. The resulting decorator can be applied to a class method
to enforce this validation. */
// export const ExistPage = genClassMethodsValidateDecorator(
//   (page: Page, ..._rest: any[]) => !page,
//   'ParserController: Page not found'
// )

/**
 * This is a TypeScript decorator function that checks if a Puppeteer browser
 * instance exists before executing a method.
 * @param {Fn} target - The original method/function that is being decorated by the
 * ExistPuppeteerBrowser decorator.
 * @param context - ClassMethodDecoratorContext is a type that represents the
 * context in which a class method decorator is applied. It contains information
 * about the class, the method being decorated, and the decorator function itself.
 * In this case, the context parameter is used to extract the name of the method
 * being decorated (methodName).
 * @returns A decorator function that checks if the `_browser` property exists in
 * the `this` context and throws an error if it doesn't. If it exists, it calls the
 * original function with the provided arguments and returns the result.
 */
export function ExistPuppeteerBrowser<
  This extends IParserController,
  Args extends any[],
  Return extends void,
  Fn extends (this: This, ...args: Args) => Return
>(
  target: Fn,
  context: ClassMethodDecoratorContext<This, Fn>
) {
  const methodName = String(context.name)

  return async function(this: This, ...args: Args): Promise<Return> {
    if ('_browser' in this) {
      if (!this._browser) throw new Error(`@ExistPuppeteerBrowser (${methodName}): this._browser not found`)
      const result = await target.call(this, ...args)
      return result
    }

    throw new Error(`@ExistPuppeteerBrowser (${methodName}): this._browser not found`)
  }
}

/**
 * This is a TypeScript decorator function that checks if a Puppeteer page exists
 * before executing a method.
 * @param {Fn} target - The original method/function that is being decorated.
 * @param context - The context parameter is of type ClassMethodDecoratorContext
 * and contains information about the decorated method, such as the name of the
 * method and the class it belongs to. It is used to retrieve the name of the
 * method in order to provide more informative error messages.
 * @returns A higher-order function that wraps the original function passed as the
 * `target` parameter. This wrapped function checks if the `_page` property exists
 * in the `this` object (which is expected to be an instance of
 * `IParserController`), and if it does, it calls the original function with the
 * provided arguments and returns its result. If `_page` does not exist, it throws
 * an error
 */
export function ExistPuppeteerPage<
  This extends IParserController,
  Args extends any[],
  Return extends void,
  Fn extends (this: This, ...args: Args) => Return,
>(
  target: Fn,
  context: ClassMethodDecoratorContext<This, Fn>,
) {
  const methodName = String(context.name)

  return async function(this: This, ...args: Args): Promise<Return> {
    if ('_page' in this) {
      if (!this._page) throw new Error(`@ExistPuppeteerPage (${methodName}): this._page not found`)
      const result = await target.call(this, ...args)
      return result
    }

    throw new Error(`@ExistPuppeteerPage (${methodName}): this._page not found`)
  }
}

/**
 * This is a TypeScript decorator function that logs server requests and responses.
 * @param {Fn} target - The function being decorated with the LogServer decorator.
 * @param context - The context parameter is of type ClassMethodDecoratorContext,
 * which is a generic type that represents the context in which the decorator is
 * applied. It contains information about the class, method, and method descriptor.
 * In this case, it is used to access the method being decorated.
 * @returns A function that wraps the original function passed as `target` and logs
 * some information before calling it. The wrapped function returns the result of
 * calling the original function.
 */
export function LogServer<
  T,
  A extends any[],
  R extends Promise<IServerResponse>,
  Fn extends (this: T, ...args: A) => R
>(
  target: Fn,
  context: ClassMethodDecoratorContext<T, Fn>
) {
  return function(this: T, ...args: A): R {
    const req: FastifyRequest = args[0]
    Utils.log('warn', `${req.method} ${req.ip} ${req.url}`, 'server')
    const result = target.call(this, ...args)
    return result
  }
}

/**
 * The function adds a decorator to a class method that checks if a certain value
 * exists and throws an error if it doesn't.
 * @param {E} check - The value that needs to be checked for existence.
 * @returns A higher-order function that takes in a target function and a context
 * object, and returns a new function that checks if the `this` object has a
 * `_browser` property and throws an error if it does not exist. If the property
 * exists, it calls the original target function with the provided arguments and
 * returns its result.
 */
export function IsExist<E>(check: E) {
  return function<
    T extends object,
    A extends any[],
    R extends Promise<void>,
    Fn extends (this: T, ...args: A) => R,
  >(
    target: Fn,
    context: ClassMethodDecoratorContext<T, Fn>
  ) {
    return function(this: T, ...args: A): R {
      if ('_browser' in this && !this._browser) throw new Error(`check not exist`)

      const result = target.call(this, ...args)
      return result
    }
  }
}

// export function LogResult(level: TLoggerLogLevels, label?: TLoggerLogLabel) {
//   return function<
//     This,
//     Args extends any[],
//     Return extends Promise<any>,
//     Fn extends (this: This, ...args: Args) => Return,
//   >(
//     target: Fn,
//     context: ClassMethodDecoratorContext<This, Fn>
//   ) {
//     return function(this: This, ...args: Args): Return {
//       const res = target.call(this, ...args)
//       console.log(res)
//       // Utils.log(level, res, label)
//       return res
//     }
//   }
// }
export function LogResult(level: TLoggerLogLevels, label?: TLoggerLogLabel) {
  return function<
    This,
    Args extends any[],
    Return,
    Fn extends (this: This, ...args: Args) => Return,
  >(
    target: Fn,
    context: ClassMethodDecoratorContext<This, Fn>
  ) {
    return async function(this: This, ...args: Args): Promise<any> {
      const res = await target.call(this, ...args)
      Utils.log(level, res, label)
      return res
    }
  }
}