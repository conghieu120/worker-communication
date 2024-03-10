/// <reference types="node" />
import { Worker, parentPort } from 'worker_threads';
export declare class ParentMessenger {
    #private;
    messageHandler: any;
    constructor(worker: Worker);
    callWorker(name: string, args: any, timeout?: number): Promise<unknown>;
}
export declare class WorkerMessenger {
    #private;
    messageHandler: any;
    constructor(parent: typeof parentPort);
    callParent(name: string, args: any, timeout?: number): Promise<unknown>;
}
