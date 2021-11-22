class Grid {
    constructor({ startPoint, gridSquares, gridUnitLength, gridUnitWidth }) {
        this.startPoint = startPoint;
        this.gridSquares = gridSquares;
        this.gridUnitLength = gridUnitLength;
        this.gridUnitWidth = gridUnitWidth;

        this.evenRowPositionShift = gridUnitWidth / 2 + gridUnitLength / 2;
        this.step = gridUnitLength + gridUnitWidth;

        this.gridElements = {};
        this._createGrid();
    }

    _createGrid() {
        const gridRows = this.gridSquares * 2 + 1;
        for (let rowIndex = 0; rowIndex < gridRows; rowIndex++) {
            this._createRow(rowIndex);
        }
    }

    _createRow(rowIndex) {
        const isOdd = rowIndex % 2 === 1;
        const columns = this.gridSquares + isOdd;

        const x = this.startPoint[0] + this.evenRowPositionShift * !isOdd;
        const y = this.startPoint[1] - this.step * rowIndex / 2;
        const elementOrientation = isOdd ? 0 : 90;

        for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
            const gridIndex = [rowIndex, columnIndex];
            this.gridElements[`[${gridIndex}]`] = {
                position: [x + this.step * columnIndex, y],
                orientation: elementOrientation,
                length: this.gridUnitLength,
                width: this.gridUnitWidth,
                gridIndex: gridIndex,
            };
        }
    }

    convertRelativeIndexToAbsolute(relativeIndex) {
        if (this.gridSquares % 2 !== 1) {
            throw new Error('Five square Katona works only on odd grid');
        }

        const centerRow = this.gridSquares;
        const centerColumn = Math.floor(this.gridSquares / 2);
        const [relativeRow, relativeColumn] = relativeIndex;
        return [centerRow + relativeRow, centerColumn + relativeColumn];
    }

}


export { Grid };