import { util, visual } from '../../../lib/psychojs-2021.2.3.developer.js';


class MovableElements {
    constructor({ elements, defaultPositions }) {
        this.elements = elements;
        this._defaultElementPostions = defaultPositions;
    }

    returnToDefault() {
        for (const movableElement of this.elements) {
            const index = movableElement.name;
            const { position, orientation } = this._defaultElementPostions[index];
            movableElement.pos = position;
            movableElement.ori = orientation;
        }
    }

    setAutoDraw(toShow) {
        for (const element of this.elements) {
            element.setAutoDraw(toShow);
        }
    }

}

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

        for (const elementInfo of Object.values(grid.gridElements)) {
            const visualGridElement = this._createVisualElement(elementInfo, gridColor);
            visualGridElement.occupied = false;
            this.gridElements.push(visualGridElement);
        }

        const movableElements = [];
        const defaultMovableElementsPositions = {};
        for (const relativeIndex of movableElementsRelativeIndexes) {
            const absoluteIndex = grid.convertRelativeIndexToAbsolute(relativeIndex);
            const elementInfo = grid.gridElements[absoluteIndex];
            const movableElement = this._createVisualElement(elementInfo, movableElementColor);
            movableElements.push(movableElement);

            this.gridElements
                .find(element => element.name === elementInfo.gridIndex)
                .occupied = true;

            defaultMovableElementsPositions[elementInfo.gridIndex] = {
                position: elementInfo.position,
                orientation: elementInfo.orientation,
            };

        }

        this._movableElements = new MovableElements({
            elements: movableElements,
            defaultPositions: defaultMovableElementsPositions,
        });
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

    get movableElements() {
        return this._movableElements.elements;
    }

    returnToDefault() {
        this._movableElements.returnToDefault();
    }

    setAutoDraw(toShow) {
        for (const element of this.gridElements) {
            element.setAutoDraw(toShow);
        }

        this._movableElements.setAutoDraw(toShow);
    }
}

export { VisualGrid };