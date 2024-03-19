import { v4 as uuidV4 } from 'uuid'
import { Worker, parentPort, isMainThread } from 'worker_threads'

const SUCCESS = 'success'
const ERROR = 'error'
const WORKER_RESULT = 'result-from-worker'
const WORKER_CALL_PARENT = 'worker-call-parent'
const PARENT_RESULT = 'result-from-parent'
const PARENT_CALL_WORKER = 'parent-call-worker'

export class ParentMessenger {
    #worker: Worker
    #promise: any = {}
    messageHandler = {} as any
    constructor(worker: Worker) {
        this.#worker = worker;
        this.#initClass()
    }
    async callWorker (name: string, args: any, timeout = 3000) {
        const uuid = uuidV4()
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const promise = this.#promise[uuid]
                if (promise) {
                    promise.reject("Timeout handle! " + name)
                    return delete this.#promise[uuid]
                }
            }, timeout)
            this.#promise[uuid] = { resolve, reject }
            this.#worker?.postMessage({
                action: PARENT_CALL_WORKER,
                uuid: uuid,
                name,
                data: args
            })
        })
    }
    #initClass() {
        if (!isMainThread) {
            throw new Error("ParentMessenger is not running on the main thread! Do you want to use WorkerMessenger?")
        }
        this.#worker?.on('message', async ({ action, uuid, result, type, name, data }: any) => {
            if (action === WORKER_RESULT) {
                const promise = this.#promise[uuid]
                if (type === SUCCESS && promise?.resolve) {
                    promise.resolve(result)
                    return delete this.#promise[uuid]
                } else if (type === ERROR && promise?.reject) {
                    promise.reject(result)
                    return delete this.#promise[uuid]
                }
            } else if (action === WORKER_CALL_PARENT) {
                const fncHandle = this.messageHandler[name]
                if (fncHandle) {
                    try {
                        const result = await fncHandle(data)
                        this.#worker?.postMessage({ action: PARENT_RESULT, uuid, result, name, type: SUCCESS })
                    } catch (error) {
                        this.#worker?.postMessage({ action: PARENT_RESULT, uuid, result: error, name, type: ERROR })
                    }
                } else {
                    this.#worker?.postMessage({ action: PARENT_RESULT, uuid, result: 'No handler', name, type: ERROR })
                }
            }
        })
    }
}

export class WorkerMessenger {
    #parent: typeof parentPort = parentPort
    #promise: any = {}
    messageHandler: any = {}
    constructor() {
        this.#initClass()
    }
    #initClass () {
        if (isMainThread) {
            throw new Error("WorkerMessenger is not running on the main thread! Do you want to use ParentMessenger?")
        }
        this.#parent?.on('message', async ({ action, uuid, result, type, name, data }: any) => {
            if (action === PARENT_CALL_WORKER) {
                const fncHandle = this.messageHandler[name]
                if (fncHandle) {
                    try {
                        const result = await fncHandle(data)
                        this.#parent?.postMessage({ action: WORKER_RESULT, uuid, result, name, type: SUCCESS })
                    } catch (error) {
                        this.#parent?.postMessage({ action: WORKER_RESULT, uuid, result: error, name, type: ERROR })
                    }
                } else {
                    this.#parent?.postMessage({ action: WORKER_RESULT, uuid, result: "No handler", name, type: ERROR })
                }
            } else if (action === PARENT_RESULT) {
                const promise = this.#promise[uuid]
                if (type === SUCCESS && promise?.resolve) {
                    promise.resolve(result)
                    return delete this.#promise[uuid]
                } else if (type === ERROR && promise?.reject) {
                    promise.reject(result)
                    return delete this.#promise[uuid]
                }
            }
        })
    }
    async callParent (name: string, args: any, timeout = 3000) {
        const uuid = uuidV4()
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const promise = this.#promise[uuid]
                if (promise) {
                    promise.reject("Timeout handle! " + name)
                    return delete this.#promise[uuid]
                }
            }, timeout)
            this.#promise[uuid] = { resolve, reject }
            this.#parent?.postMessage({
                action: WORKER_CALL_PARENT,
                uuid: uuid,
                name,
                data: args
            })
        })
    }
}
