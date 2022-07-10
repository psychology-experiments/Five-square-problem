import { core, util } from '../../lib/psychojs-2021.2.3.developer.js';


class UserInputProcessor {
    constructor({ inputType, additionalTrialData }) {
        if (this.constructor === UserInputProcessor) {
            throw new Error('Abstract classes can\'t be instantiated.');
        }

        if (typeof inputType !== 'string') {
            throw new Error(
                'inputType attribute must be given to super() and be a string');
        }
        this.inputType = inputType;

        if (!(additionalTrialData instanceof AdditionalTrialData)) {
            throw new Error(
                'additionalTrialData attribute must be given to super() and be a instance of AdditionalTrialData');
        }
        this._additionalTrialData = additionalTrialData;

        this._isInitialized = false;
    }

    initialize(taskConditions) {
        throw new Error(
            `Method 'initialize(taskConditions)' must be implemented in ${this.inputType}.`);
    }

    stop() {
        throw new Error(
            `Method 'stop()' must be implemented in ${this.inputType}.`);
    }

    isSendInput() {
        throw new Error(
            `Method 'isSendInput()' must be implemented in ${this.inputType}.`);
    }

    getData() {
        throw new Error(
            `Method 'getData()' must be implemented in ${this.inputType}.`);
    }

    showInputError() {
        throw new Error(
            `Method 'showInputError()' must be implemented in ${this.inputType}.`);
    }

    clearInput() {
        throw new Error(
            `Method 'clearInput()' must be implemented in ${this.inputType}.`);
    }

    get isInitialized() {
        return this._isInitialized;
    }
}


export class SingleSymbolKeyboard extends UserInputProcessor {
    constructor({ psychoJS, additionalTrialData }) {
        super({ inputType: 'SingleSymbolKeyboard', additionalTrialData });
        this._keyList = null;
        this._isPressed = false;
        this._keyName = null;
        this._rt = null;

        this._keyboard = new core.Keyboard({
            psychoJS: psychoJS, clock: new util.Clock(), waitForStart: true,
        });
        this._psychoJS = psychoJS;
    }

    get rt() {
        return this._rt;
    }

    get keyName() {
        return this._keyName;
    }

    get isPressed() {
        return this._isPressed;
    }

    initialize(taskConditions) {
        this._keyList = taskConditions.keysToWatch;
        this._isInitialized = true;

        // t === 0 on next screen flip
        this._psychoJS.window.callOnFlip(() => this._keyboard.clock.reset());
        // start on screen flip
        this._psychoJS.window.callOnFlip(() => this._keyboard.start());
        // remove all previous events
        this._psychoJS.window.callOnFlip(() => this._keyboard.clearEvents());
    }

    isSendInput() {
        if (!this._isInitialized) return;

        let pressedKey = this._keyboard.getKeys({
            keyList: this._keyList, waitRelease: false,
        });

        if (pressedKey.length > 0) {
            this._keyName = pressedKey[0].name;
            this._rt = pressedKey[0].rt;
            this._isPressed = true;
        }

        return this._isPressed;
    }

    getData() {
        const inputData = {
            keyName: this._keyName, RT: this._rt,
        };

        return this._additionalTrialData.addData(inputData);
    }

    stop() {
        this._keyboard.stop();
        this._keyList = null;
        this._isInitialized = false;
        this._isPressed = false;
        this._keyName = null;
        this._rt = null;
    }
}


export class AdditionalTrialData {
    constructor(data) {
        this._data = Object.entries(data);
    }

    _checkNoDataOverwritten(trialData, additionalData) {
        const overwrittenData = [];
        for (let additionalKey of Object.keys(additionalData)) {
            if (additionalKey in trialData) {
                overwrittenData.push(additionalKey);
            }
        }

        if (overwrittenData.length > 0) {
            throw new Error(
                `Additional data overwrites this trial data ${overwrittenData}`);
        }
    }

    _generateAdditionalData() {
        const additionalData = {};

        for (let [additionalKey, additionalDataGetter] of this._data) {
            additionalData[additionalKey] = additionalDataGetter();
        }
        return additionalData;
    }

    addData(trialData) {
        const additionalData = this._generateAdditionalData();
        this._checkNoDataOverwritten(trialData, additionalData);

        return Object.assign(trialData, additionalData);
    }
}