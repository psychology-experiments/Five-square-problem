import { util, visual } from '../../../lib/psychojs-2021.2.3.developer.js';

import * as general from '../general.js';


class GridElement extends visual.Rect {
    constructor({
        name,
        win,
        lineColor,
        fillColor,
        width,
        height,
        pos,
        size,
        ori,
        units,
    }) {
        super({
            win,
            lineColor,
            fillColor,
            width,
            height,
            pos,
            size,
            ori,
            units,
        });
        this.name = `[${name}]`;
        this._occupiedBy = null;
        this._occupiedByDefalut = null;

        const shapeToCalculateContainsMethod = new visual.Rect({
            win,
            width: width * 4,
            height,
            pos,
            size,
            ori,
            units,
            fillColor,
        });

        // this._test = shapeToCalculateContainsMethod;
        this._verticesPositions = this._getVerticesPositionPixels(
            shapeToCalculateContainsMethod);
    }

    // setAutoDraw(toShow) {
    // if (this._test === undefined) return;
    // console.log("CC", this._test)
    // this._test.setAutoDraw(toShow);
    // }

    _getVerticesPositionPixels(visualElement) {
        const rawVertices = visualElement._getVertices_px();
        const rotatedVertices = general.multiplyMatrices(
            rawVertices,
            general.calculateRotationMatrix(visualElement.ori));
        const elementCenter = util.to_px(
            visualElement.pos,
            visualElement.win.units,
            visualElement.win);
        return rotatedVertices.map(v =>
            [elementCenter[0] + v[0], elementCenter[1] + v[1]]);
    }

    addDefaultMovableElement(movableElement) {
        this._occupiedByDefalut = movableElement;
        this.placeMovableElement(movableElement);
    }

    contains(object, units) {
        const objectPositionPixels = util.getPositionFromObject(object, units);

        if (typeof objectPositionPixels === 'undefined') {
            const className = this.constructor.name;
            // noinspection JSCheckFunctionSignatures
            throw {
                origin: `${className}.contains`,
                context: `when determining whether ${className}: ${this._name} 
                contains object: ${util.toString(object)}`,
                error: 'unable to determine the position of the object',
            };
        }

        // test for inclusion:
        const polygonPositionPixels = this.getVerticesPositionPixels();
        return util.IsPointInsidePolygon(objectPositionPixels,
            polygonPositionPixels);
    }

    getVerticesPositionPixels() {
        return this._verticesPositions;
    }

    giveMovableElement() {
        if (this._occupiedBy === null) {
            throw new Error(
                `GridElement (${this.name}) was asked to give movable element when there is no`);
        }

        const movableElement = this._occupiedBy;
        this._occupiedBy = null;
        return movableElement;
    }

    get occupied() {
        return this._occupiedBy !== null;
    }

    get orientation() {
        return this.ori;
    }

    placeMovableElement(movableElement) {
        movableElement.position = this.pos;
        movableElement.orientation = this.ori;
        this._occupiedBy = movableElement;
    }

    returnToDefault() {
        if (this._occupiedByDefalut === this._occupiedBy) return;

        this.placeMovableElement(this._occupiedByDefalut);
    }
}


class SingleMovableElement {
    constructor({
        name,
        defaultGridElement,
        win,
        width,
        height,
        fillColor,
        lineColor,
        pos,
        size,
        ori,
        units,
    }) {
        this._visualElement = new visual.Rect({
            win,
            width,
            height,
            fillColor,
            lineColor,
            pos,
            size,
            ori,
            units,
        });

        this.name = `[${name}]`;
        this._defaultGridElement = defaultGridElement;
        this._defaultGridElement.addDefaultMovableElement(this);
    }

    get position() {
        return this._visualElement.pos;
    }

    set position(position) {
        this._visualElement.pos = position;
    }

    get orientation() {
        return this._visualElement.ori;
    }

    set orientation(orientation) {
        this._visualElement.ori = orientation;
    }

    returnToDefault() {
        this._defaultGridElement.returnToDefault();
    }

    setAutoDraw(toShow) {
        this._visualElement.setAutoDraw(toShow);
    }

}


class MovableElements {
    constructor(elements) {
        this.elements = elements;
    }

    returnToDefault() {
        for (const movableElement of this.elements) {
            movableElement.returnToDefault();
        }
    }

    setAutoDraw(toShow) {
        for (const movableElement of this.elements) {
            movableElement.setAutoDraw(toShow);
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
        this._grid = grid;
        this.gridElements = [];

        const movableElements = [];
        const absoluteMovableElementIndexes = movableElementsRelativeIndexes.map(
            (relativeIndex) =>
                `[${grid.convertRelativeIndexToAbsolute(relativeIndex)}]`,
        );

        for (const elementInfo of Object.values(grid.gridElements)) {
            const visualGridElement = this._createVisualGridElement(elementInfo,
                gridColor);
            this.gridElements.push(visualGridElement);

            if (absoluteMovableElementIndexes.includes(
                visualGridElement.name)) {
                const movableElement = this._createMovableElement(
                    elementInfo,
                    movableElementColor,
                    visualGridElement);
                movableElements.push(movableElement);
            }

        }

        this._movableElements = new MovableElements(movableElements);
    }

    _createVisualGridElement(elementInfo, color) {
        return new GridElement({
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

    _createMovableElement(elementInfo, color, defaultGridElement) {
        return new SingleMovableElement({
            name: elementInfo.gridIndex,
            defaultGridElement: defaultGridElement,
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

    getRelativeIdxToAbsoluteMapper() {
        return (relativeIndex) => {
            return this._grid.convertRelativeIndexToAbsolute(relativeIndex);
        };
    }

    getOccupiedGridElements() {
        return this.gridElements.filter(({ occupied }) => occupied);
    }

    getUnOccupiedGridElements(elementOrientation) {
        return this.gridElements.filter(({ occupied, orientation }) => {
            return orientation === elementOrientation && !occupied;
        });
    }

    get movableElements() {
        return this._movableElements.elements;
    }

    returnToDefault() {
        this._movableElements.returnToDefault();
    }

    setAutoDraw(toShow) {
        for (const gridElement of this.gridElements) {
            gridElement.setAutoDraw(toShow);
        }

        this._movableElements.setAutoDraw(toShow);
    }
}


export { VisualGrid };