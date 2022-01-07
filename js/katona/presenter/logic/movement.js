import { core, util } from '../../../../lib/psychojs-2021.2.3.developer.js';


export class SingleClickMouse {
    constructor({ window, buttonToCheck }) {
        this._isPressed = true;
        this._timePressed = null;
        this._isInitilized = false;

        const buttons = { left: 0, center: 1, right: 2 };
        this._checkButton = buttons[buttonToCheck];

        this._mouse = new core.Mouse({ win: window });
        this._mouse.leftButtonClock = new util.Clock();
    }

    get isInitialized() {
        return this._isInitilized;
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
        this._mouse.getWheelRel();
    }
}


export function chooseElement(grid, mouse) {
    console.log('CHOOSING');
    for (const gridElement of grid.getOccupiedGridElements()) {
        if (mouse.isPressedIn(gridElement)) {

            const chosenElement = gridElement.giveMovableElement();
            console.log('CHOSEN',
                chosenElement.position,
                chosenElement.orientation);
            const chosenElementIndex = chosenElement.name;
            const chosenFromIndex = gridElement.name;
            return chosenElement;
        }
    }
    return null;
}


export function dragChosen(chosenElement, mouse) {
    console.log('DRAGGING');

    // chosenElement.position = mouse.getPosition();
    chosenElement.position = mouse.getPosition();

    if (!mouse.isWheelMoved()) return;
    console.log('ROTATING');

    chosenElement.orientation = chosenElement.orientation === 90 ?
        0 :
        90;
}


export function placeElement(chosenElement, grid, mouse) {
    console.log('PLACING');

    const { orientation } = chosenElement;
    for (const gridElement of grid.getUnOccupiedGridElements(orientation)) {
        if (mouse.isPressedIn(gridElement)) {
            gridElement.placeMovableElement(chosenElement);
            return gridElement;
        }
    }
    return null;
}