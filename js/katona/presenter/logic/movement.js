import { core, util } from '../../../../lib/psychojs-2021.2.3.developer.js';

import { calculateRotationMatrix, multiplyMatrices } from '../../general.js';


class SingleClickMouse {
    constructor({ window, buttonToCheck }) {
        this._isPressed = true;
        this._timePressed = null;

        const buttons = { left: 0, center: 1, right: 2 };
        this._checkButton = buttons[buttonToCheck];

        this._mouse = new core.Mouse({ win: window });
        this._mouse.leftButtonClock = new util.Clock();
    }

    initialize() {
        this._mouse.leftButtonClock.reset();

        this._isInitilized = true;
        this._isPressed = true;
        this._timePressed = null;
    }

    stop() {
        this._isInitilized = false;
    }

    _getButtonPress() {
        let getTime = true;
        let clickInfo = this._mouse.getPressed(getTime);

        return {
            isPressed: clickInfo[0][this._checkButton],
            timePressed: this._mouse.leftButtonClock.getTime(),
        };
    }

    isPressedIn(shape) {
        return this._mouse.isPressedIn(shape, this._checkButton);
    }

    isSingleClick() {
        let click = this._getButtonPress();

        if (click.isPressed && !this._isPressed) {
            this._isPressed = true;
            this._timePressed = click.timePressed;
            return true;
        }

        if (!click.isPressed) {
            this._isPressed = false;
            this._timePressed = null;
        }

        return false;
    }

    getPosition() {
        return this._mouse.getPos();
    }

    resetWheelData() {
        this._mouse.getWheelRel();
    }

    isWheelMoved() {
        return Boolean(this._mouse.getWheelRel()[1]);
    }

    getData() {
        return {
            mouse: this._mouse,
            RT: this._timePressed,
        };
    }

    clearInput() {
        this._mouse.leftButtonClock.reset();
    }
}

class GridElementMover {
    constructor({ window }) {
        this._window = window;
        this._clicker = new SingleClickMouse({
            window: window,
            buttonToCheck: 'left',
        });

        this.chosenElement = null;
        this._chosenElementIndex = null;
        this._chosenFromIndex = null;
    }

    checkMove({ movableElements, gridElements }) {
        if (!this._clicker.isSingleClick()) return;

        if (this.chosenElement === null) {
            this._chooseElement(movableElements, gridElements);
        } else {
            this._placeElement(movableElements, gridElements);
        }
    }

    dragChosen() {
        if (this.chosenElement === null) return;
        console.log('DRAGGING');

        this.chosenElement.pos = this._clicker.getPosition();

        if (!this._clicker.isWheelMoved()) return;
        console.log('ROTATING');

        this.chosenElement.ori = this.chosenElement.ori === 90 ? 0 : 90;
    }

    _getElementVertices(element) {
        // workaround for psychoJS because its formulas do not pay attention for element orientation
        let vertices = element._getVertices_px();
        if (element.ori !== 0) {
            vertices = multiplyMatrices(vertices, calculateRotationMatrix(element.ori));
        }

        const elementCenter = util.to_px(element.pos, this._window.units, this._window);
        return vertices.map(v =>
            [elementCenter[0] + v[0], elementCenter[1] + v[1]]);
    }

    _chooseElement(movableElements, gridElements) {
        const mousePosition = util.to_px(this._clicker.getPosition(), this._window.units, this._window);
        for (const element of movableElements) {
            const elementVertices = this._getElementVertices(element);
            if (util.IsPointInsidePolygon(mousePosition, elementVertices)) {
                console.log('CHOSEN', element.pos, element.ori);
                this.chosenElement = element;
                this._chosenElementIndex = element.name;
                this._clicker.resetWheelData();
                this._getGridIndexOfTakenElement(gridElements);
                break;
            }
        }
    }

    _getGridIndexOfTakenElement(gridElements) {
        console.log('TRYING TO FIND INDEX');
        const mousePosition = util.to_px(this._clicker.getPosition(), this._window.units, this._window);
        for (const element of gridElements) {
            const elementVertices = this._getElementVertices(element);
            if (util.IsPointInsidePolygon(mousePosition, elementVertices)) {
                console.log('FOUND', element.pos, element.ori);
                this._chosenFromIndex = element.name;
                element.occupied = false;
                break;
            }
        }
    }

    _placeElement(movableElements, gridElements) {
        console.log('PLACING');
        const equalOrientationGridElements = gridElements.filter(
            ({ ori }) => ori === this.chosenElement.ori);

        const mousePosition = util.to_px(this._clicker.getPosition(), this._window.units, this._window);
        for (const gridElement of equalOrientationGridElements) {
            const elementVertices = this._getElementVertices(gridElement);
            if (util.IsPointInsidePolygon(mousePosition, elementVertices)) {
                if (gridElement.occupied) return;

                this.chosenElement.pos = gridElement.pos;
                gridElement.occupied = true;

                this.chosenElement = null;
                this._chosenElementIndex = null;
                break;
            }
        }
    }
}

export { GridElementMover };
