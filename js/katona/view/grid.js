import { util, visual } from '../../../lib/psychojs-2021.2.3.developer.js';


class VisualGrid {
    constructor({
                    window,
                    grid,
                    gridColor,
                    movableElementColor,
                    movableElementsRelativeIndexes,
                }) {
        this._window = window;
        this.gridElements = [];
        this.movableElements = [];
        this._defaultElementPostions = {};

        for (const elementInfo of Object.values(grid.gridElements)) {
            const visualGridElement = this._createVisualElement(elementInfo, gridColor);
            this.gridElements.push(visualGridElement);

            this._defaultElementPostions[elementInfo.gridIndex] = {
                position: elementInfo.position,
                orientation: elementInfo.orientation,
            };
        }

        for (const relativeIndex of movableElementsRelativeIndexes) {
            const absoluteIndex = grid.convertRelativeIndexToAbsolute(relativeIndex);
            const elementInfo = grid.gridElements[absoluteIndex];
            const movableElement = this._createVisualElement(elementInfo, movableElementColor);
            this.movableElements.push(movableElement);
        }

    }

    _createVisualElement(elementInfo, color) {
        return new visual.Rect({
            name: elementInfo.gridIndex,
            win: this._window,
            pos: elementInfo.position,
            ori: elementInfo.orientation,
            fillColor: new util.Color(color),
            lineColor: new util.Color(color),
            width: elementInfo.width,
            height: elementInfo.length,
            size: 1,
        });
    }

    returnMovableElementsToDefaultPositions() {
        for (const movableElement of this.movableElements) {
            const index = movableElement.name;
            const { position, orientation } = this._defaultElementPostions[index];
            movableElement.pos = position;
            movableElement.ori = orientation;
        }
    }

    setAutoDraw(toShow) {
        for (const element of this.gridElements) {
            element.setAutoDraw(toShow);
        }

        for (const element of this.movableElements) {
            element.setAutoDraw(toShow);
        }
    }
}

export { VisualGrid };