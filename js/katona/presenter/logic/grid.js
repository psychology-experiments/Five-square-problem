class GridElement {
    constructor({ position, orientation, gridIndex }) {
        this.position = position; // Array[float, float]
        this.orientation = orientation; // int
        this.gridIndex = gridIndex; // Array[int, int]
    }
}


class Grid {
    constructor({ startPoint, gridSquares, gridUnitLength, gridUnitWidth }) {
        this.startPoint = startPoint;
        this.gridSquares = gridSquares;

        this.evenRowPositionShift = gridUnitWidth / 2 + gridUnitLength / 2;
        this.step = gridUnitLength + gridUnitWidth;

        this.gridElements = [];
        this._createGrid();
    }

    _createGrid() {
        const gridRows = this.gridSquares * 2 + 1;
        for (let rowIndex = 0; rowIndex < gridRows; rowIndex++) {
            const rowElements = this._createRow(rowIndex);
            this.gridElements.push.apply(this.gridElements, rowElements);
        }
    }

    _createRow(rowIndex) {
        const isOdd = rowIndex % 2 === 1;
        const columns = this.gridSquares + isOdd;

        const x = this.startPoint[0] + this.evenRowPositionShift * !isOdd;
        const y = this.startPoint[1] - this.step * rowIndex / 2;
        const elementOrientation = isOdd ? 0 : 90;

        const rowElements = [];
        for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
            const element = new GridElement({
                position: [x + this.step * columnIndex, y],
                orientation: elementOrientation,
                gridIndex: [rowIndex, columnIndex]
            });
            rowElements.push(element);
        }

        return rowElements;
    }

}

export { Grid };