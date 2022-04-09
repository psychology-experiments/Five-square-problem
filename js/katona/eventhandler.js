import { util } from '../../lib/psychojs-2021.2.3.developer.js';


const EVENTS = Object.freeze({
    'CLICK': 0,
    'CHOSEN': 1,
    'PLACED': 2,
    'MOUSE_UPDATE': 3,
    'RESET': 4,
    'WRONG_SOLUTION': 5,
    'PROBE_ANSWER': 6,
    'TRAINING_PROBE_ANSWER': 7,
    'IMPASSE': 8,
    'INSTRUCTION_READING': 9,
});

export const EVENT = new Proxy(EVENTS, {
    get: ((target, p) => {
        if (!target.hasOwnProperty(p)) {
            throw Error(`Event "${p}" does not exist`);
        }
        return target[p];
    })
});


class DefaultObject {
    constructor(defaultFactory) {
        if (typeof defaultFactory !== 'function') {
            throw Error('defaultFactory must be a function');
        }

        return new Proxy({}, {
            get: (target, p) => {
                if (!target.hasOwnProperty(p)) {
                    target[p] = new defaultFactory();
                }
                return target[p];
            }
        });
    }
}


const REMOVE_HANDLER_AFTER = new DefaultObject(Array);
const EMITTER = new util.EventEmitter();


function _registerExpiringHandler(event, uuid, removeAfter) {
    REMOVE_HANDLER_AFTER[removeAfter].push([event, uuid]);
}

export function removeExpiredHandlers(event) {
    const toRemove = REMOVE_HANDLER_AFTER[event];
    if (toRemove.length === 0) return;

    for (const [originalEvent, uuid] of toRemove) {
        EMITTER.off(originalEvent, uuid);
    }
    delete REMOVE_HANDLER_AFTER[event];
}

export function removeAllExpiringHandlers() {
    for (const event in EVENT) {
        removeExpiredHandlers(EVENT[event]);
    }
}

export function registerHandler({
    event,
    handler,
    removeAfter = undefined
}) {
    const uuid = EMITTER.on(event, handler);

    if (removeAfter !== undefined) {
        _registerExpiringHandler(event, uuid, removeAfter);
    }
}

export function registerSingleEventHandler({
    event,
    handler,
}) {
    EMITTER.once(event, handler);
}

export function emitEvent(event, data) {
    console.log("EMITTING", Object.keys(EVENT)[event])
    EMITTER.emit(event, data);
    removeExpiredHandlers(event);
}

