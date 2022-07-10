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
        this._verticesPositions = null;

        this._trueShape = new visual.Rect({
            win,
            width: width * 4,
            height,
            pos,
            size,
            ori,
            units,
            fillColor,
        });
    }

    setAutoDraw(toShow) {
        // Calculate positions AFTER window became FULL SCREEN
        // otherwise PsychoJS calculate it wrong
        // but recalculate position before every autoDraw command because window resize creates bugs with positions
        if (toShow) {
            this._verticesPositions = this._getVerticesPositionPixels(
                this._trueShape);
        }

        super.setAutoDraw(toShow);
    }

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
        if (!this.occupied) {
            throw new Error(
                `GridElement (${this.name}) was asked to give movable element when there is no`);
        }

        const movableElement = this._occupiedBy;
        movableElement.wasTakenFrom = this.name;
        movableElement._currentlyPlacedOn = null;
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
        movableElement._wasPlacedOn = this;
        movableElement._currentlyPlacedOn = this;
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
        this._wasPlacedOn = defaultGridElement;
        this._currentlyPlacedOn = defaultGridElement;
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

    getElementInfo() {
        return {
            name: this.name,
            takenFrom: this.wasTakenFrom,
            placedOn: this._wasPlacedOn.name,
        }
    }

    returnToDefault() {
        if (this._wasPlacedOn !== this._defaultGridElement && this._currentlyPlacedOn !== null) {
            // return to default grid element that did not have movable element
            this._wasPlacedOn.giveMovableElement();
        }
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
        name,
        window,
        grid,
        gridColor,
        movableElementColor,
        movableElementsRelativeIndexes,
    }) {
        this.name = name;
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

    /**
     * Return [x, y] positions of vertices in following order:
     * upper-left, upper-right, bottom-right, bottom-left
     *
     * @function
     * @public
     * @returns {Array.<Array.<Number>>}
     */
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
        this.setAutoDraw(true);
    }

    setGridElementColor(index, color) {
        for (const gridElement of this.gridElements) {
            if (gridElement.name === index) {
                gridElement.fillColor = color;
                gridElement.lineColor = color;
            }
        }

    }

    setAutoDraw(toShow) {
        for (const gridElement of this.gridElements) {
            gridElement.setAutoDraw(toShow);
        }

        this._movableElements.setAutoDraw(toShow);
    }
}


export { VisualGrid };