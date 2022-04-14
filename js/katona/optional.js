import { core, util, visual } from '../../lib/psychojs-2021.2.3.developer.js';

import * as general from './general.js';


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
        this._isCoveredScreen = false;

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

    isCoveredScreen() {
        return this._isCoveredScreen;
    }

    reset() {
        clearInterval(this._growId);
        this._cover.height = this._maxHeight * this._growBy;
        this._isCoveredScreen = false;
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
                this._isCoveredScreen = true;
            }
        }, this._growRate);
    }
}


class MovesTimeObserver {
    constructor({
        minimalMovesBeforeImpasse = 3,
        minimalThresholdTime = 5,
    }) {
        this._movesClock = new util.Clock();
        this._lastMoveTime = 0;
        this._thresholdTime = null;
        this._movesTime = [];
        this._moveAfterImpasse = false;

        this._minimalMovesBeforeImpasse = minimalMovesBeforeImpasse;
        this._minimalThresholdTime = minimalThresholdTime;
    }

    prepareToStart() {
        this._movesClock.reset();
    }

    addStartTime(RT) {
        if (this._moveAfterImpasse) {
            // TODO: Обсудить добавлять ли после тупика время хода, если считать
            // от момента, когда вернулись к решению, а не от предыдущего хода
            this._moveAfterImpasse = false;
        }

        this._movesTime.push(RT + this._lastMoveTime);
        this._lastMoveTime = null;

        if (this._movesTime.length >= this._minimalMovesBeforeImpasse) {
            const meanTime = general.mean(this._movesTime);
            const sdTime = general.sd(this._movesTime, meanTime);
            const thresholdTime = meanTime + 2 * sdTime;
            this._thresholdTime = thresholdTime > this._minimalThresholdTime
                ? thresholdTime
                : this._minimalThresholdTime;
        }

        this._movesClock.reset();
    }

    addEndTime(RT) {
        console.assert(this._lastMoveTime === null,
            {
                where: 'MovesTimeObserver',
                problem: 'Время конца хода не было сброшено',
                data: this._lastMoveTime
            });

        this._lastMoveTime = RT;
    }

    isImpasse() {
        if (this._thresholdTime === null) return false;

        if (this._moveAfterImpasse) return false;

        if (this._movesClock.getTime() >= this._thresholdTime) {
            this._moveAfterImpasse = true;
            return true;
        }

        return false;
    }
}

class DataSaver {
    constructor({ psychoJS }) {
        this._saveEngine = psychoJS.experiment;

        this._eventToStageName = {
            "CHOSEN": "Katona",
            "PLACED": "Katona",
            "RESET": "Katona",
            "IMPASSE": "Katona",
            "PROBE_ANSWER": "Probe",
            "INSTRUCTION_READING": "Instuction",
        };

        // setting up order of columns
        this._saveEngine._currentTrialData = {
            stage: "",
            element: "",
            takenFrom: "",
            placedTo: "",
            takeRT: "",
            placeRT: "",
            resetRT: "",
            timeSolving: "",
            probeType: "",
            probeName: "",
            probeRT: "",
            keyPressed: "",
            isCorrect: "",
            timeFromStart: "",
            instructionName: "",
            instructionExitRT: "",
        };

    }

    _addRowData(event, rowData) {
        const stage = this._eventToStageName[event];
        const trainingModifier = "isTraining" in rowData ? "Training " : "";
        if (rowData.isTraining) delete rowData.isTraining;
        this._saveEngine.addData("stage", trainingModifier + stage);
        const columnsData = Object.entries(rowData);
        for (const [columnName, columnValue] of columnsData) {
            this._saveEngine.addData(columnName, columnValue);
        }
    }

    _saveRow() {
        this._saveEngine.nextEntry();
    }

    saveData({ event, eventData }) {
        this._addRowData(event, eventData);

        if (event !== 'CHOSEN') {
            this._saveRow(event);
        }
    }
}

export { DataSaver, ScreenCover, MovesTimeObserver };