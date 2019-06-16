import { MyPromise } from './Promise'
import { Defer, Callback, Test, TestPromise } from './model';

const test: Test = (): Defer => {
  const defer: Defer = {} as Defer
  defer.promise = new MyPromise((resolve: Callback, reject: Callback) => {
    defer.resolve = resolve
    defer.reject = reject
  })
  return defer
}

const testPromise: TestPromise = {
  deferred: test
}

try {
  module.exports = testPromise
} catch (e) {
  console.log(e)
}
