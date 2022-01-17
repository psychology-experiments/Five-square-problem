import { util, visual } from '../../lib/psychojs-2021.2.3.developer.js';


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


export { ScreenCover };