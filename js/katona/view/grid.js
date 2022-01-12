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
        movableElement.wasTakenFrom = this.name;
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
        this.wasTakenFrom = defaultGridElement.name;
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

    _getVerticesPositions() {
        const vertices = [];
        const elementsQTY = this.gridElements.length;
        const shift = this.gridElements[0].width / 2;

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        for (let i = 0; i < elementsQTY; i++) {
            const [X, Y] = this.gridElements[i].pos;
            minX = X < minX ? X : minX;
            maxX = X > maxX ? X : maxX;
            minY = Y < minY ? Y : minY;
            maxY = Y > maxY ? Y : maxY;
        }

        vertices.push([minX - shift, maxY + shift]);
        vertices.push([maxX + shift, maxY + shift]);
        vertices.push([maxX + shift, minY - shift]);
        vertices.push([minX - shift, minY - shift]);

        return vertices;
    }

    getBoundingBox() {
        return this._getVerticesPositions();
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


class ScreenCover {
    constructor({
        window,
        boundingBoxOfSquares,
        coverColor,
        textMessage,
        textColor,
        secondsToCover,
    }) {
        const [width, height, position] = this._findDimensionsParameters(
            boundingBoxOfSquares
        );

        this._growBy = 0.005;
        this._growRate = Math.floor(secondsToCover * this._growBy * 1000);
        this._maxHeight = height;

        this._cover = new visual.Rect({
            win: window,
            width: width,
            height: this._maxHeight * this._growBy,
            fillColor: coverColor,
            lineColor: coverColor,
            pos: position,
            size: 1,
            ori: 0,
        });

        this._message = new visual.TextStim({
            win: window,
            text: textMessage,
            height: 0.04,
            color: textColor,
            pos: position,
        });
    }

    _findDimensionsParameters(boundingBox) {
        const width = Math.abs(boundingBox[0][0]) +
            Math.abs(boundingBox[1][0]);
        const height = Math.abs(boundingBox[0][1]) +
            Math.abs(boundingBox[3][1]);
        const position = [
            (boundingBox[0][0] + boundingBox[2][0]) / 2,
            (boundingBox[0][1] + boundingBox[2][1]) / 2];
        return [width, height, position];
    }

    reset() {
        clearInterval(this._growId);
        this._cover.height = this._maxHeight * this._growBy;
        this.setAutoDraw(false);
    }

    setAutoDraw(toShow) {
        this._cover.setAutoDraw(toShow);
        this._message.setAutoDraw(toShow);

        if (!toShow) return;

        this._growId = setInterval(() => {
            this._cover.height += this._maxHeight * this._growBy;
            this._message._needUpdate = true;

            if (this._cover.height >= this._maxHeight) {
                clearInterval(this._growId);
            }
        }, this._growRate);
    }
}


export { VisualGrid, ScreenCover };