## This package is used to call the function between worker_thread and parent using Async function
### Using:
- At parent:
    ```
    import { Worker } from 'worker_threads'
    import { ParentMessenger } from 'worker-messenger'

    const worker = new Worker('Path/to/your/worker')
    const messenger = new ParentMessenger(worker)
    const timeout = 5000

    // Add handlers
    messenger.messageHandler.testFunction_1 = (argsFromWorker) => {
        //Your code handler
        return 'Result from parent'
    }
    // Call function in worker
    const test = async () => {
        const results = await messenger.callWorker('testFunction_2', 'args', timeout)
        console.log({results});
    }
    test()
    ```
- At worker:
    ```
    import { WorkerMessenger } from 'worker-messenger'

    const messenger = new WorkerMessenger()
    const timeout = 5000

    // Add handlers
    messenger.messageHandler.testFunction_2 = (argsFromParent) => {
        //Your code handler
        return 'Result from worker'
    }
    // Call function in parent
    const test = async () => {
        const result = await messenger.callParent('testFunction_1', 'args', timeout)
        console.log({result});
    }
    test()
    ```