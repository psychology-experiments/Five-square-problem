import { util, visual } from '../../lib/psychojs-2021.2.3.developer.js';


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
        throw Error('Probe without stimuli is prohibited');
    }

    if (probesQty !== uniqueProbesQty) {
        const notUniqueProbesErrorMessage = `
            Every probe must be unique.
            But there are ${probesQty - uniqueProbesQty} repeats in probes`;
        throw Error(notUniqueProbesErrorMessage);
    }

    if (answers === null) return;

    const answersQty = answers.length;
    if (probesQty !== answersQty) {
        const notEnoughAnswersErrorMessage = `
            Every probe must have the answer.
            But there are ${probesQty} probes and ${answersQty} answers`;
        throw Error(notEnoughAnswersErrorMessage);
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
    }

    nextProbe() {
        throw Error('Not Implemented');
    }

    getPressCorrectness(pressedKeyName) {
        throw Error('Not Implemented');
    }

    prepareForNewStart() {
        throw Error('Not Implemented');
    }

    get position() {
        return this._probeView.position;
    }

    set position(coordinates) {
        this._probeView.position = coordinates;
    }

    setAutoDraw(toShow, t) {
        if (!toShow) {
            this._probeView.setAutoDraw(false);
            return;
        }

        if (t >= this._startTime) {
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
    }
}


class InhibitionProbe extends BaseProbe{
    constructor(probes, answers, probeView, startTime) {
        super(probeView, startTime);
        this._probes = probes;
        this._answers = answers;
    }
}


class ProbeView {
    constructor({
        window, probeFPs, position,
    }) {
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

    get position() {
        return this._position;
    }

    set position(coordinates) {
        for (const probe of this._visualProbes) {
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


const existingProbes = {
    UpdateProbe,
    ShiftProbe,
    InhibitionProbe,
};


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
