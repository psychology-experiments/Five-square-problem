import { util, visual } from '../../lib/psychojs-2021.2.3.developer.js';

import { cycle } from '../katona/general.js';


/**
 * Check that from given settings it is possible to create valid probe
 *
 * @function
 * @private
 * @param {Array.<string>} probes - file paths to probes stimuli
 * @param {Array.<string>} answers - correct answers for given probes
 */
function checkProbeSettings(probes, answers) {
    const probesQty = probes.length;
    const uniqueProbesQty = new Set(probes).size;

    if (probesQty === 0) {
        throw new Error('Probe without stimuli is prohibited');
    }

    if (probesQty !== uniqueProbesQty) {
        const notUniqueProbesErrorMessage = `
            Every probe must be unique.
            But there are ${probesQty - uniqueProbesQty} repeats in probes`;
        throw new Error(notUniqueProbesErrorMessage);
    }

    if (answers === null) return;

    const answersQty = answers.length;
    if (probesQty !== answersQty) {
        const notEnoughAnswersErrorMessage = `
            Every probe must have the answer.
            But there are ${probesQty} probes and ${answersQty} answers`;
        throw new Error(notEnoughAnswersErrorMessage);
    }
}


class ProbeFactory {
    constructor(type, probes, answers, window, position, startTime) {
        const probeView = new ProbeView({ window, probeFPs: probes, position });
        return new existingProbes[type](probes, answers, probeView, startTime);
    }
}


class BaseProbe {
    constructor(probeView, startTime) {
        this._probeView = probeView;
        this._startTime = startTime;
        this._isStarted = false;

        this._probePosition = probeView.position;
        const windowSize = this._probeView.windowSize;
        this._windowWidth = windowSize[0];
        this._windowHeight = windowSize[1];
    }

    adjustOnResize() {
        // const previousWidth = this._windowWidth;
        // const previousHeight = this._windowHeight;
        //
        // const windowSize = this._probeView.windowSize;
        // this._windowWidth = windowSize[0];
        // this._windowHeight = windowSize[1];
        //
        // const widthRatio = this._windowWidth / previousWidth;
        // const heightRatio = this._windowHeight / previousHeight;
        // this._probePosition = [this._probePosition[0] * widthRatio, this._probePosition[1] * heightRatio];
        // this._probeView.position = this._probePosition;
    }

    contains(object, units) {
        return this._probeView.contains(object, units);
    }

    nextProbe() {
        throw new Error('Not Implemented');
    }

    getProbeName() {
        throw new Error('Not Implemented');
    }

    getPressCorrectness(pressedKeyName) {
        throw new Error('Not Implemented');
    }

    prepareForNewStart() {
        throw new Error('Not Implemented');
    }

    get isStarted() {
        return this._isStarted;
    }

    get position() {
        return this._probeView.position;
    }

    set position(coordinates) {
        this._probeView.position = coordinates;
    }

    stop() {
        this._isStarted = false;
        this.setAutoDraw(false);
    }

    setAutoDraw(toShow, t) {
        if (!toShow) {
            this._isStarted = false;
            this._probeView.setAutoDraw(false);
            return;
        }

        if (t >= this._startTime) {
            this._isStarted = true;
            this._probeView.setAutoDraw(toShow);
        }
    }
}


class UpdateProbe extends BaseProbe {
    constructor(probes, answers, probeView, startTime) {
        super(probeView, startTime);
        this._probes = probes;

        this._previousProbeIndex = null;
        this._currentProbeIndex = null;
    }

    nextProbe() {
        this._previousProbeIndex = this._currentProbeIndex;
        this._currentProbeIndex = Math.floor(
            Math.random() * this._probes.length);
        this._probeView.setNextProbe(this._currentProbeIndex);
    }

    getProbeName() {
        return this._probes[this._currentProbeIndex].slice(-5, -4);
    }

    getPressCorrectness(pressedKeyName) {
        if (this._previousProbeIndex === null) return true;

        if (pressedKeyName === 'right') {
            return this._currentProbeIndex === this._previousProbeIndex;
        } else if (pressedKeyName === 'left') {
            return this._currentProbeIndex !== this._previousProbeIndex;
        } else {
            throw `Key ${pressedKeyName} is prohibited for UpdateProbe`;
        }
    }

    prepareForNewStart() {
        this._previousProbeIndex = null;
        this._currentProbeIndex = null;
    }
}


class ShiftProbe extends BaseProbe {
    constructor(probes, answers, probeView, startTime) {
        super(probeView, startTime);
        this._probes = probes;
        this._answers = answers;

        const repeatStimuli = 2;
        const blackIndexes = [0, 1, 4, 5];
        const blueIndexes = [2, 3, 6, 7];

        const rightSequence = [];
        for (const stimuli of [blackIndexes, blueIndexes]) {
            for (let time = 0; time < repeatStimuli; time++) {
                rightSequence.push(stimuli);
            }
        }

        this._rightSequence = cycle(rightSequence);

        this._currentProbeIndex = null;
    }

    nextProbe() {
        const currentStimuli = this._rightSequence.next().value;
        const randomIndex = Math.floor(Math.random() * currentStimuli.length);
        this._currentProbeIndex = currentStimuli[randomIndex];
        this._probeView.setNextProbe(this._currentProbeIndex);

    }

    getProbeName() {
        return this._probes[this._currentProbeIndex].slice(-5, -4);
    }

    getPressCorrectness(pressedKeyName) {
        return this._answers[this._currentProbeIndex] === pressedKeyName;
    }

    prepareForNewStart() {
        this._currentProbeIndex = null;
    }

}


class InhibitionProbe extends BaseProbe {
    constructor(probes, answers, probeView, startTime) {
        super(probeView, startTime);
        this._probes = probes;
        this._answers = answers;

        this._congruentIncongruentRatio = 1 / 6;

        const indexedProbes = probes.
            map((v) => v.split('/').slice(-1)[0].slice(0, 2)).
            map((v, i) => [i, v]);
        const congruentProbes = indexedProbes.
            filter((v) => v[1][0] === v[1][1]).
            map((v) => v[0]);
        const incongruentProbes = indexedProbes.
            filter((v) => v[1][0] !== v[1][1]).
            map((v) => v[0]);
        this._probesGroups = [congruentProbes, incongruentProbes];
    }

    nextProbe() {
        const group = Math.random() <= this._congruentIncongruentRatio ? 0 : 1;
        const groupStimuli = this._probesGroups[group];
        const randomIndex = Math.floor(Math.random() * groupStimuli.length);

        this._currentProbeIndex = groupStimuli[randomIndex];
        this._probeView.setNextProbe(this._currentProbeIndex);

    }

    getProbeName() {
        return this._probes[this._currentProbeIndex].slice(-6, -4);
    }

    getPressCorrectness(pressedKeyName) {
        return this._answers[this._currentProbeIndex] === pressedKeyName;
    }

    prepareForNewStart() {
        this._currentProbeIndex = null;
    }
}

class ControlProbe extends BaseProbe {
    constructor(probes, answers, probeView, startTime) {
        super(probeView, startTime);
        this._probePosition = null;

        const windowSize = probeView.windowSize;
        this._windowWidth = windowSize[0];
        this._windowHeight = windowSize[1];
        this._shiftX = this._windowWidth / 2;
        this._shiftY = this._windowHeight / 2;
    }

    adjustOnResize() {
        // super.adjustOnResize();
        const previousWidth = this._windowWidth;
        const previousHeight = this._windowHeight;

        const windowSize = this._probeView.windowSize;
        this._windowWidth = windowSize[0];
        this._windowHeight = windowSize[1];

        const widthRatio = this._windowWidth / previousWidth;
        const heightRatio = this._windowHeight / previousHeight;
        this._probePosition = [this._probePosition[0] * widthRatio, this._probePosition[1] * heightRatio];
        this._probeView.position = this._probePosition;

        this._shiftX = this._windowWidth / 2;
        this._shiftY = this._windowHeight / 2;
    }

    _roundFloat(floatNumber, decimalPlaces) {
        const roundTo = Math.pow(10, decimalPlaces);
        return Math.round((floatNumber + Number.EPSILON) * roundTo) / roundTo;
    }

    nextProbe() {
        // multiply by 0.6 to ensure that probe is inside screen
        const moveFromWindowBorder = 0.6;
        const x = (Math.random() * this._windowWidth - this._shiftX) * moveFromWindowBorder;
        const y = (Math.random() * this._windowHeight - this._shiftY) * moveFromWindowBorder;
        this._probePosition = [this._roundFloat(x, 2), this._roundFloat(y, 2)];
        this._probeView.setNextProbe(0);
        this._probeView.position = this._probePosition;
    }

    getProbeName() {
        return this._probePosition;
    }

    getPressCorrectness(pressedKeyName) {
        return true;
    }

    prepareForNewStart() {
        this._probePosition = null;
    }
}


class ProbeView {
    constructor({
        window, probeFPs, position,
    }) {
        this._window = window;
        this._position = position;
        this._visualProbes = [];
        this._currentProbe = null;

        for (const probeFP of probeFPs) {
            const probe = new visual.ImageStim({
                win: window, pos: this._position, image: probeFP,
            });
            this._visualProbes.push(probe);
        }
    }

    get windowSize() {
        return util.to_height(this._window.size, 'pix', this._window);
    }

    contains(object, units) {
        return this._currentProbe.contains(object, units);
    }

    get position() {
        return this._position;
    }

    set position(coordinates) {
        for (const probe of this._visualProbes) {
            console.log("SETTING COORDS:", {P: probe.pos.toString(), C: coordinates.toString()});
            probe.pos = coordinates;
        }
        this._position = coordinates;
    }

    setNextProbe(probeIndex) {
        this._currentProbe = this._visualProbes[probeIndex];
    }

    setAutoDraw(toShow) {
        this._currentProbe.setAutoDraw(toShow);
    }
}


export const existingProbes = {
    ControlProbe,
    UpdateProbe,
    ShiftProbe,
    InhibitionProbe,
};

/**
 * Create probes of chosen type
 *
 * @function
 *
 * @param {string} probeType - file paths to probes stimuli
 * @param {Array.<string>} probes - file paths to probes stimuli
 * @param {Array.<string>} answers - correct answers for given probes
 * @param {core.Window} window - object to display stimuli
 * @param {[x :number, y: number]} position - position of probes on screen
 * @param {number} startTime - time after routine start when probe should be drawn
 *
 * @public
 */
function createProbe({
    probeType,
    probes,
    answers,
    window,
    position,
    startTime
}) {
    checkProbeSettings(probes, answers);
    return new ProbeFactory(probeType, probes, answers, window, position,
        startTime);
}


export { createProbe };
