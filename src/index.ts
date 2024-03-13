import { v4 as uuidV4 } from 'uuid'
import { Worker, parentPort } from 'worker_threads'

const SUCCESS = 'success'
const ERROR = 'error'

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
                action: 'parent-call-worker',
                uuid: uuid,
                name,
                data: args
            })
        })
    }
    #initClass() {
        this.#worker?.on('message', async ({ action, uuid, result, type, name, data }: any) => {
            if (action === 'result-from-worker') {
                const promise = this.#promise[uuid]
                if (type === SUCCESS && promise?.resolve) {
                    promise.resolve(result)
                    return delete this.#promise[uuid]
                } else if (type === ERROR && promise?.reject) {
                    promise.reject(result)
                    return delete this.#promise[uuid]
                }
            } else if (action === 'worker-call-parent') {
                const fncHandle = this.messageHandler[name]
                if (fncHandle) {
                    try {
                        const result = await fncHandle(data)
                        this.#worker?.postMessage({ action: 'result-from-parent', uuid, result, name, type: 'success' })
                    } catch (error) {
                        this.#worker?.postMessage({ action: 'result-from-parent', uuid, result: error, name, type: 'error' })
                    }
                } else {
                    this.#worker?.postMessage({ action: 'result-from-parent', uuid, result: 'No handler', name, type: 'error' })
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
        this.#parent?.on('message', async ({ action, uuid, result, type, name, data }: any) => {
            if (action === 'parent-call-worker') {
                const fncHandle = this.messageHandler[name]
                if (fncHandle) {
                    try {
                        const result = await fncHandle(data)
                        this.#parent?.postMessage({ action: 'result-from-worker', uuid, result, name, type: 'success' })
                    } catch (error) {
                        this.#parent?.postMessage({ action: 'result-from-worker', uuid, result: error, name, type: 'error' })
                    }
                } else {
                    this.#parent?.postMessage({ action: 'result-from-worker', uuid, result: "No handler", name, type: 'error' })
                }
            } else if (action === 'result-from-parent') {
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
                action: 'worker-call-parent',
                uuid: uuid,
                name,
                data: args
            })
        })
    }
}
