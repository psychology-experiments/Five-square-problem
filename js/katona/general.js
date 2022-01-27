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
export function * cycle(iterable) {
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