export function calculateRotationMatrix(orientation) {
    let radians = -orientation * 0.017453292519943295;
    return [
        [Math.cos(radians), -Math.sin(radians)],
        [Math.sin(radians), Math.cos(radians)]
    ];
}

export const multiplyMatrices = (m1, m2) => {
    return m1.map((row, i) => {
        return m2.map((col, j) => {
            return m1[i].reduce((total, elm, k) => total + (elm * m2[k][j]), 0);
        });
    });
};

/**
 * Return elements from the iterable until it is exhausted. Then repeat the sequence indefinitely.
 *
 * @function
 * @public
 * @param {Iterable<T>} iterable - any iterable to cycle through
 */
export function* cycle(iterable) {
    const saved = [];
    for (const element of iterable) {
        yield element;
        saved.push(element);
    }
    const length = saved.length;
    while (saved) {
        for (let i = 0; i < length; i++) {
            yield saved[i];
        }
    }
}

/**
 * Calculate mean of an Array
 *
 * @function
 * @public
 * @param {Array<Number>} x - array with numbers
 * @return Number
 */
export function mean(x) {
    if (!(x instanceof Array)) {
        throw new Error(`Mean defined only for Array, but get ${typeof x}`);
    }

    const add = (x, y) => x + y;
    const length = x.length;
    return x.reduce(add, 0) / length;
}

/**
 * Calculate sample standard deviation (n - 1)  of an Array
 *
 * @function
 * @public
 * @param {Array<Number>} x - array with numbers
 * @param {Number} [xMean=null] - mean of an Array
 * @return Number
 */
export function sd(x, xMean) {
    if (!(x instanceof Array)) {
        throw new Error(`Mean defined only for Array, but get ${typeof x}`);
    }

    const xMeanValue = xMean !== null ? xMean : mean(x);

    const subtractMeanAndPow = x => Math.pow(x - xMeanValue, 2);
    const add = (x, y) => x + y;
    const sampleLength = x.length - 1;
    return Math.pow(
        x.map(subtractMeanAndPow).reduce(add) / sampleLength,
        0.5
    );
}

export class ResizeWorkAround {
    constructor(window) {
        this._handlerID = null;
        this._window = window;
        this._previousSize = Array.from(window.size);
    }

    _isStable() {
        return this._window.size[0] === this._previousSize[0] && this._window.size[1] === this._previousSize[1];
    }

    _handleWhenStabilized(f, ms) {
        let startHandlerId = null;
        return () => {
            if (this._isStable()) return;
            this._previousSize = Array.from(this._window.size);
            clearTimeout(startHandlerId);
            startHandlerId = setTimeout(f, ms);
        };
    }

    addHandler(handler) {
        if (this._handlerID !== null) {
            throw new Error(
                `There is must be only one handler registered! But has already this handler ${this._handlerID}`
            );
        }

        this._handlerID = setInterval(this._handleWhenStabilized(handler, 20), 200);
    }

    removeLastHandler() {
        if (this._handlerID === null) {
            throw new Error('There is no handler to remove');
        }
        clearInterval(this._handlerID);
        this._handlerID = null;
    }
}