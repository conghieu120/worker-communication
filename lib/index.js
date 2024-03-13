"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _ParentMessenger_instances, _ParentMessenger_worker, _ParentMessenger_promise, _ParentMessenger_initClass, _WorkerMessenger_instances, _WorkerMessenger_parent, _WorkerMessenger_promise, _WorkerMessenger_initClass;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerMessenger = exports.ParentMessenger = void 0;
const uuid_1 = require("uuid");
const worker_threads_1 = require("worker_threads");
const SUCCESS = 'success';
const ERROR = 'error';
const WORKER_RESULT = 'result-from-worker';
const WORKER_CALL_PARENT = 'worker-call-parent';
const PARENT_RESULT = 'result-from-parent';
const PARENT_CALL_WORKER = 'parent-call-worker';
class ParentMessenger {
    constructor(worker) {
        _ParentMessenger_instances.add(this);
        _ParentMessenger_worker.set(this, void 0);
        _ParentMessenger_promise.set(this, {});
        this.messageHandler = {};
        __classPrivateFieldSet(this, _ParentMessenger_worker, worker, "f");
        __classPrivateFieldGet(this, _ParentMessenger_instances, "m", _ParentMessenger_initClass).call(this);
    }
    callWorker(name, args, timeout = 3000) {
        return __awaiter(this, void 0, void 0, function* () {
            const uuid = (0, uuid_1.v4)();
            return new Promise((resolve, reject) => {
                var _a;
                setTimeout(() => {
                    const promise = __classPrivateFieldGet(this, _ParentMessenger_promise, "f")[uuid];
                    if (promise) {
                        promise.reject("Timeout handle! " + name);
                        return delete __classPrivateFieldGet(this, _ParentMessenger_promise, "f")[uuid];
                    }
                }, timeout);
                __classPrivateFieldGet(this, _ParentMessenger_promise, "f")[uuid] = { resolve, reject };
                (_a = __classPrivateFieldGet(this, _ParentMessenger_worker, "f")) === null || _a === void 0 ? void 0 : _a.postMessage({
                    action: PARENT_CALL_WORKER,
                    uuid: uuid,
                    name,
                    data: args
                });
            });
        });
    }
}
exports.ParentMessenger = ParentMessenger;
_ParentMessenger_worker = new WeakMap(), _ParentMessenger_promise = new WeakMap(), _ParentMessenger_instances = new WeakSet(), _ParentMessenger_initClass = function _ParentMessenger_initClass() {
    var _a;
    (_a = __classPrivateFieldGet(this, _ParentMessenger_worker, "f")) === null || _a === void 0 ? void 0 : _a.on('message', ({ action, uuid, result, type, name, data }) => __awaiter(this, void 0, void 0, function* () {
        var _b, _c, _d;
        if (action === WORKER_RESULT) {
            const promise = __classPrivateFieldGet(this, _ParentMessenger_promise, "f")[uuid];
            if (type === SUCCESS && (promise === null || promise === void 0 ? void 0 : promise.resolve)) {
                promise.resolve(result);
                return delete __classPrivateFieldGet(this, _ParentMessenger_promise, "f")[uuid];
            }
            else if (type === ERROR && (promise === null || promise === void 0 ? void 0 : promise.reject)) {
                promise.reject(result);
                return delete __classPrivateFieldGet(this, _ParentMessenger_promise, "f")[uuid];
            }
        }
        else if (action === WORKER_CALL_PARENT) {
            const fncHandle = this.messageHandler[name];
            if (fncHandle) {
                try {
                    const result = yield fncHandle(data);
                    (_b = __classPrivateFieldGet(this, _ParentMessenger_worker, "f")) === null || _b === void 0 ? void 0 : _b.postMessage({ action: PARENT_RESULT, uuid, result, name, type: SUCCESS });
                }
                catch (error) {
                    (_c = __classPrivateFieldGet(this, _ParentMessenger_worker, "f")) === null || _c === void 0 ? void 0 : _c.postMessage({ action: PARENT_RESULT, uuid, result: error, name, type: ERROR });
                }
            }
            else {
                (_d = __classPrivateFieldGet(this, _ParentMessenger_worker, "f")) === null || _d === void 0 ? void 0 : _d.postMessage({ action: PARENT_RESULT, uuid, result: 'No handler', name, type: ERROR });
            }
        }
    }));
};
class WorkerMessenger {
    constructor() {
        _WorkerMessenger_instances.add(this);
        _WorkerMessenger_parent.set(this, worker_threads_1.parentPort);
        _WorkerMessenger_promise.set(this, {});
        this.messageHandler = {};
        __classPrivateFieldGet(this, _WorkerMessenger_instances, "m", _WorkerMessenger_initClass).call(this);
    }
    callParent(name, args, timeout = 3000) {
        return __awaiter(this, void 0, void 0, function* () {
            const uuid = (0, uuid_1.v4)();
            return new Promise((resolve, reject) => {
                var _a;
                setTimeout(() => {
                    const promise = __classPrivateFieldGet(this, _WorkerMessenger_promise, "f")[uuid];
                    if (promise) {
                        promise.reject("Timeout handle! " + name);
                        return delete __classPrivateFieldGet(this, _WorkerMessenger_promise, "f")[uuid];
                    }
                }, timeout);
                __classPrivateFieldGet(this, _WorkerMessenger_promise, "f")[uuid] = { resolve, reject };
                (_a = __classPrivateFieldGet(this, _WorkerMessenger_parent, "f")) === null || _a === void 0 ? void 0 : _a.postMessage({
                    action: WORKER_CALL_PARENT,
                    uuid: uuid,
                    name,
                    data: args
                });
            });
        });
    }
}
exports.WorkerMessenger = WorkerMessenger;
_WorkerMessenger_parent = new WeakMap(), _WorkerMessenger_promise = new WeakMap(), _WorkerMessenger_instances = new WeakSet(), _WorkerMessenger_initClass = function _WorkerMessenger_initClass() {
    var _a;
    (_a = __classPrivateFieldGet(this, _WorkerMessenger_parent, "f")) === null || _a === void 0 ? void 0 : _a.on('message', ({ action, uuid, result, type, name, data }) => __awaiter(this, void 0, void 0, function* () {
        var _b, _c, _d;
        if (action === PARENT_CALL_WORKER) {
            const fncHandle = this.messageHandler[name];
            if (fncHandle) {
                try {
                    const result = yield fncHandle(data);
                    (_b = __classPrivateFieldGet(this, _WorkerMessenger_parent, "f")) === null || _b === void 0 ? void 0 : _b.postMessage({ action: WORKER_RESULT, uuid, result, name, type: SUCCESS });
                }
                catch (error) {
                    (_c = __classPrivateFieldGet(this, _WorkerMessenger_parent, "f")) === null || _c === void 0 ? void 0 : _c.postMessage({ action: WORKER_RESULT, uuid, result: error, name, type: ERROR });
                }
            }
            else {
                (_d = __classPrivateFieldGet(this, _WorkerMessenger_parent, "f")) === null || _d === void 0 ? void 0 : _d.postMessage({ action: WORKER_RESULT, uuid, result: "No handler", name, type: ERROR });
            }
        }
        else if (action === PARENT_RESULT) {
            const promise = __classPrivateFieldGet(this, _WorkerMessenger_promise, "f")[uuid];
            if (type === SUCCESS && (promise === null || promise === void 0 ? void 0 : promise.resolve)) {
                promise.resolve(result);
                return delete __classPrivateFieldGet(this, _WorkerMessenger_promise, "f")[uuid];
            }
            else if (type === ERROR && (promise === null || promise === void 0 ? void 0 : promise.reject)) {
                promise.reject(result);
                return delete __classPrivateFieldGet(this, _WorkerMessenger_promise, "f")[uuid];
            }
        }
    }));
};
