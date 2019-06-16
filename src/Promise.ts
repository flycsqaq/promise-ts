import { PENDING, FULFILLED, REJECTED, PromiseStatus, OnceStatus, ExecuteOnceStatus, OnResolve, OnReject, Callback, ExecuteOnce, ExecuteCallbacks, DelayToNextTick, ResolutionProcedure } from './model'
const PromiseState = Symbol('PromiseState')
const PromiseValue = Symbol('PromiseValue')

// 注册回调，避免前后Promise传而创建的全局状态管理
const onFilFulledMap: Map<MyPromise, Callback[]> = new Map()
const onRejectedMap: Map<MyPromise, Callback[]> = new Map()

const nextPromisesMap: Map<MyPromise, MyPromise[]> = new Map()

/**
 * 高阶函数,使得传入的Promise的resolve,reject同时只能被执行一次
 * @param {MyPromise} promise -需要只能执行一次resolve/reject的Promise对象
 * @returns {Object} -返回对象，onResolve与onReject为封装后的函数,status为状态对象，获取Promise的resolve/reject能否执行的信息
 */
const executeOnce: ExecuteOnce = (promise: MyPromise): ExecuteOnceStatus => {
  let status: OnceStatus = {isExecute: false}
  return {
    onResolve: (...p: any[]) => {
      if (!status.isExecute) {
        status.isExecute = true  
        return resolve(promise, ...p)
      }
    },
    onReject: (...p: any[]) => {
      if (!status.isExecute) {
        status.isExecute = true
        return reject(promise, ...p)
      }
    },
    status
  }
}

/**
 * 执行promise的callback
 * @param {MyPromise} promise -需要执行回调的Promise对象
 * @returns
 */
const executeCallbacks: ExecuteCallbacks = (promise: MyPromise): void => {
  const state: boolean = promise[PromiseState] === FULFILLED
  const value: any = promise[PromiseValue]
  const callbackMap: Map<MyPromise, Callback[]> = state ? onFilFulledMap: onRejectedMap
 
  const callbacks = callbackMap.get(promise) as Callback[]
  const nextPromises = nextPromisesMap.get(promise) as MyPromise[]

  //重置promise的回调，避免重复执行
  callbackMap.set(promise, [])
  nextPromisesMap.set(promise, [])

  callbacks.forEach((callback: Callback, index: number) => {
    let result: any = value
    let status: boolean = state
    if (typeof callback === 'function') {
      try {
        result = callback(value)
        status = true
      } catch(e) {
        result = e
        status = false
      }
    }
    const nextPromise: MyPromise = nextPromises[index]
    if (nextPromise instanceof MyPromise) {
      (status? resolve: reject)(nextPromise, result)
    }
  })
}

/**
 * 获取一个可以延时执行函数的函数
 * @param {Function} fn -需延时执行的函数
 * @param {...any} [args] -传入延时函数的参数
 */
const delayFn: Function = (() => {
  return (fn: Function, ...p: any[]) => setTimeout(fn, 0, ...p)
})()

const delayToNextTick: DelayToNextTick = (promise: MyPromise): void => {
  delayFn(
    executeCallbacks,
    promise
  )
}


/**
 *Promise解析流程
 * @param {MyPromise} promise -需要解析Promise对象
 * @param {any} x -传入的值 
 * [https://promisesaplus.com/] The Promise Resolution Procedure 官方提供的解析流程
 */
const resolutionProcedure: ResolutionProcedure = (promise: MyPromise, x?: any): any => {
  if (promise instanceof MyPromise && promise === x) {
    return reject(promise, new TypeError())
  }
  const { onReject, onResolve, status } = executeOnce(promise)
  if (x instanceof MyPromise) {
    if (x[PromiseState] === PENDING) {
      x.then(onResolve, onReject)
    } else {
      promise[PromiseState] = x[PromiseState]
      promise[PromiseValue] = x[PromiseValue]
      delayToNextTick(promise)
    }
    return
  }
  if (x && (typeof x === 'function' || typeof x === 'object')) {
    let then
    try {
      then = x.then
    } catch(e) {
      return reject(promise, e)
    }
    if (typeof then === 'function') {
      try {
        then.call(x, onResolve, onReject) // 不需要闭包控制只执行一次，因为x不是Promise对象
      } catch(e) {
        // 保证抛出异常之前执行了resolve/reject，异常会无效
        if (!status.isExecute) {
          onReject(e)
        }
      }
      return
    }
  }
  // 若x是简单类型的值，则改变promise的状态与值
  promise[PromiseState] = FULFILLED
  promise[PromiseValue] = x
  delayToNextTick(promise)
}


/** 
 * 将状态转移至fulfilled
 * @param {MyPromise} input -传入的Promise
 * @param {any} value -传入的promise结果值  
 * @returns
 */
const resolve: OnResolve = (input, value) => {
  if (input[PromiseState] !== PENDING) return
  resolutionProcedure(input, value)
}


/** 
 * 将状态转移至rejected
 * @param {MyPromise} input -传入的Promise
 * @param {any} err -错误原因  
 * @returns
 */
const reject: OnReject = (input, err) => {
  if (input[PromiseState] !== PENDING) return
  input[PromiseState] = REJECTED
  input[PromiseValue] = err
  delayToNextTick(input)
}


/**
 * 按照PromiseA+规范实现的Promise
 *@class MyPromise
 */
export class MyPromise {
  public [PromiseState]: PromiseStatus
  public [PromiseValue]: any
  constructor(execute?: Function) {
    this[PromiseState] = PENDING
    this[PromiseValue] = undefined

    nextPromisesMap.set(this, [])
    onFilFulledMap.set(this, [])
    onRejectedMap.set(this, [])
    
    if (typeof execute === 'function') {
      const { onResolve, onReject, status } = executeOnce(this)
      try {
        execute(onResolve, onReject)
      } catch(e) {
        //保证抛出异常前执行了resolve/reject
        if (!status.isExecute) {
          onReject(e)
        }
      }
    }
  }

  /**
   * 注册回调方法
   * @param {Function} onFilfulled
   * @param {Function} onReject
   * @returns {MyPromise} newPromise
   */
  then(onFilfulled: Callback, onReject: Callback): MyPromise {
    (onFilFulledMap.get(this) as Callback[]).push(onFilfulled) as number
    (onRejectedMap.get(this) as Callback[]).push(onReject) as number

    if (this[PromiseState] !== PENDING) delayToNextTick(this)

    const newPromise: MyPromise = new MyPromise();
    (nextPromisesMap.get(this) as MyPromise[]).push(newPromise)

    return newPromise
  }
}
