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
