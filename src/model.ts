import { MyPromise } from "./Promise";

export const PENDING = 'pending'
export type PENDING = typeof PENDING

export const FULFILLED = 'fuldilled'
export type FULFILLED = typeof FULFILLED

export const REJECTED = 'rejected'
export type REJECTED = typeof REJECTED

export type PromiseStatus = PENDING | FULFILLED | REJECTED

export interface OnceStatus {
  isExecute: boolean
}

export interface ExecuteOnceStatus {
  onResolve: (...P: any[]) => OnResolve | void
  onReject: (...p: any[]) => OnReject | void
  status: OnceStatus
}

export interface ExecuteOnce {
  (promise: MyPromise): ExecuteOnceStatus
}

export interface Callback {
  (value?: any): void
}

export interface OnResolve {
  (input: MyPromise, value?: any): void
}


export interface OnReject {
  (input: MyPromise, err?: any): void
}

export interface ResolutionProcedure {
  (input: MyPromise, value?: any): any
}

export interface ExecuteCallbacks {
  (promise: MyPromise): void
}

export interface DelayToNextTick {
  (promise: MyPromise): void
}

export interface Defer {
  promise: MyPromise
  resolve: Callback
  reject: Callback
}

export interface Test {
  (): Defer
}

export interface TestPromise {
  deferred: Test
}