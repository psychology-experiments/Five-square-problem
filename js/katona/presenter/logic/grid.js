class GridElement {
    constructor({ position, orientation, gridIndex }) {
        this.position = position; // Array[float, float]
        this.orientation = orientation; // int
        this.gridIndex = gridIndex; // Array[int, int]
    }
}


class Grid {
    constructor({ startPoint, gridSize, gridUnitLength, gridUnitWidth }) {
        this.startPoint = startPoint;
        this.gridSize = gridSize;
        this.gridUnitLength = gridUnitLength;
        this.gridUnitWidth = gridUnitWidth;
        this.step = this.gridUnitLength + this.gridUnitWidth;

        this.gridElements = [];
        this._createGrid();
    }

    _createGrid() {
        const [startX, startY] = this.startPoint;
        const startEven = [startX + this.gridUnitLength / 2, startY - this.gridUnitWidth / 2];
        const startOdd = [startX - this.gridUnitWidth / 2, startY - this.gridUnitWidth];

        const gridRows = this.gridSize * 2 + 1;
        for (let rowIndex = 0; rowIndex < gridRows; rowIndex++) {
            const startPosition = rowIndex % 2 === 0 ? startEven : startOdd;
            const rowElements = this._createRow(rowIndex, startPosition);
            this.gridElements.push.apply(this.gridElements, rowElements);
        }
    }

    _createRow(rowIndex, firstRowPosition) {
        const isOdd = rowIndex % 2 === 1;
        const columns = this.gridSize + isOdd;

        let x = firstRowPosition[0];
        const y = firstRowPosition[1] -
            this.gridUnitLength * rowIndex / 2 -
            this.gridUnitWidth * (rowIndex - isOdd) / 2;
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