import { core, util } from '../../../../lib/psychojs-2021.2.3.developer.js';


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

    checkMove(gridElements) {
        if (!this._clicker.isSingleClick()) return;

        if (this.chosenElement === null) {
            this._chooseElement(gridElements);
        } else {
            this._placeElement(gridElements);
        }
    }

    dragChosen() {
        if (this.chosenElement === null) return;
        console.log('DRAGGING');

        this.chosenElement.position = this._clicker.getPosition();

        if (!this._clicker.isWheelMoved()) return;
        console.log('ROTATING');

        this.chosenElement.orientation = this.chosenElement.orientation === 90 ?
            0 :
            90;
    }

    _chooseElement(gridElements) {
        console.log('CHOOSING');
        for (const gridElement of gridElements) {
            if (this._clicker.isPressedIn(gridElement)) {
                if (!gridElement.occupied) return;

                this.chosenElement = gridElement.giveMovableElement();
                console.log('CHOSEN', this.chosenElement.position,
                    this.chosenElement.orientation);
                this._chosenElementIndex = this.chosenElement.name;
                this._clicker.resetWheelData();
                this._chosenFromIndex = gridElement.name;
                break;
            }
        }
    }

    _placeElement(gridElements) {
        console.log('PLACING');
        const equalOrientationGridElements = gridElements.filter(
            ({ ori }) => ori === this.chosenElement.orientation);

        for (const gridElement of equalOrientationGridElements) {
            if (this._clicker.isPressedIn(gridElement)) {
                if (gridElement.occupied) return;

                gridElement.placeMovableElement(this.chosenElement);

                this.chosenElement = null;
                this._chosenElementIndex = null;
                break;
            }
        }
    }
}


export { GridElementMover };
