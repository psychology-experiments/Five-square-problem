import { util, visual } from '../../lib/psychojs-2021.2.3.developer.js';


const INFORMATION_HANDLERS = {
    Update: InformationSequence,
    Switch: InformationMapper,
    Inhibition: InformationMapper,
};


class InformationHandler {
    constructor(probes) {
        const probesQty = probes.lenght;
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

        this._currentProbeIndex = null;
        this._probes = probes;
    }

    nextProbe() {
        // this._currentProbeIndex = choice(range(len(self.probes)));
    }

    getPressCorrectness(pressedKeyName) {
        throw Error('Not implemented');
    }

    prepareForNewTask() {
        throw Error('Not implemented');
    }
}


class InformationSequence extends InformationHandler {}


class InformationMapper extends InformationHandler {}


class ProbePresenter {
    constructor({
        window,
        probes,
        answers,
        position,
        startTime,
    }) {
        this._view = new ProbeView({
            window,
            probeNames,
            position,
        });
    }
}


class ProbeView {
    constructor({
        window,
        probeNames,
        position,
    }) {
        this._position = position;
        this._visualProbes = [];
        this._currentProbe = null;

        for (const probeName of probeNames) {
            const probe = new visual.ImageStim({
                win: window,
                pos: this._position,
                image: probeName,
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


export { ProbePresenter as Probe };