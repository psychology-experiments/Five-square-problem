import { util } from '../../lib/psychojs-2021.2.3.developer.js';


const EVENTS = Object.freeze({
    'CLICK': 0,
    'CHOSEN': 1,
    'PLACED': 2,
    'MOUSE_UPDATE': 3,
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


function _remove_expired_handlers(event) {
    const toRemove = REMOVE_HANDLER_AFTER[event];
    if (toRemove.length === 0) return;

    for (const [originalEvent, uuid] of toRemove) {
        EMITTER.off(originalEvent, uuid);
    }
    delete REMOVE_HANDLER_AFTER[event];
}


export function registerHandler({
    event,
    handler,
    removeAfter = undefined
}) {
    const uuid = EMITTER.on(event, handler);

    if (removeAfter !== undefined) {
        REMOVE_HANDLER_AFTER[removeAfter].push([event, uuid]);
    }
}

export function registerSingleEventHandler({
    event,
    handler,
}) {
    EMITTER.once(event, handler);
}

export function emitEvent(event, data) {
    EMITTER.emit(event, data);
    _remove_expired_handlers(event);
}

