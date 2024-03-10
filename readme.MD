#This package is used to call the function between worker_thread and parent using Async function
##Using
- At parent:
    ```
    import { ParentMessenger } from 'worker-messenger'
    const worker = new Worker('Path to your worker')
    const messenger = new ParentMessenger(worker)

    // Add handlers
    messenger.messageHandler.testFunction = (argsFromWorker) => {
        //Your code handler
        return 'Result from parent'
    }
    // Call function in worker
    const timeout = 5000
    const results = await parent.callWorker('testFunction', 'args', timeout)
    console.log({results});
    ```
- At worker:
    ```
    import { WorkerMessenger } from 'worker-messenger'
    import { parentPort } from 'worker_threads'

    const timeout = 5000
    messenger.messageHandler.testFunction = (argsFromParent) => {
        return 'Result from worker'
    }
    const result = await messenger.callParent('testFunction', 'args', timeout)
    console.log({result});
    ```