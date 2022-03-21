const FIVE_SQUARE_KATONA_SOLUTIONS = {
    'left': {
        'elements': [[0, 0], [-1, -1], [1, -1]],
        'positions': [[0, -2], [-1, -2], [1, -2]]
    },
    'right': {
        'elements': [[0, 1], [-1, 1], [1, 1]],
        'positions': [[0, 3], [-1, 2], [1, 2]]
    },
    'up': {
        'elements': [[-1, 0], [-2, 0], [-2, 1]],
        'positions': [[-4, 0], [-5, 0], [-4, 1]]
    },
    'down': {
        'elements': [[1, 0], [2, 0], [2, 1]],
        'positions': [[4, 0], [5, 0], [4, 1]]
    },
};


function _convertSolutionRelativeIndexToAbsolute(mapper, solutions) {
    const absoluteIndexSolutions = {};

    for (const solutionName in solutions) {
        const convertedSolutions = {};
        const solutionNameInfo = Object.entries(solutions[solutionName]);
        absoluteIndexSolutions[solutionName] = convertedSolutions;

        for (const [solutionPart, solutionRelativeIndexes] of solutionNameInfo) {
            convertedSolutions[solutionPart] = solutionRelativeIndexes.map(
                (idx) => `[${mapper(idx)}]`
            );
        }
    }

    return absoluteIndexSolutions;
}


export class FiveSquareKatona {
    constructor({ indexMapper }) {
        this._movesMade = 0;
        this._maxMoves = 3;

        const solutionInAbsoluteIndex = _convertSolutionRelativeIndexToAbsolute(
            indexMapper, FIVE_SQUARE_KATONA_SOLUTIONS);
        this._answerChecker = new AnswerChecker(solutionInAbsoluteIndex);
    }

    countMove(chosenElementName, wasTakenFrom, placedTo) {
        if (wasTakenFrom !== placedTo) {
            this._movesMade += 1;
            this._answerChecker.addMove(chosenElementName, placedTo);
        }
    }

    isSolved() {
        if (this._movesMade < this._maxMoves) return false;

        return this._answerChecker.isSolved();
    }

    returnToDefault() {
        this._movesMade = 0;
        this._answerChecker.reset();
    }
}


class AnswerChecker {
    constructor(solutions) {
        this._correctSolutions = solutions;
        this._solutionName = null;

        this._currentSolutionName = null;

        this._moves = new Map();

        this._chosenElements = [];
        this._placedTo = [];
    }

    _identifySolutionName(chosenElement, placedTo) {
        for (const solutionName in this._correctSolutions) {
            const {
                elements,
                positions
            } = this._correctSolutions[solutionName];
            const isCorrectElement = elements.includes(chosenElement);
            const isCorrectPosition = positions.includes(placedTo);

            if (isCorrectElement && isCorrectPosition) {
                this._currentSolutionName = solutionName;
                break;
            }
        }
    }

    _canIdentifySolutionName() {
        return this._chosenElements.length === 0 &&
            this._currentSolutionName === null;
    }

    _addMove(chosenElement, placedTo) {
        this._moves.set(chosenElement, placedTo);
    }

    addMove(chosenElement, placedTo) {
        if (this._canIdentifySolutionName()) {
            this._identifySolutionName(chosenElement, placedTo);
        }

        this._chosenElements.push(chosenElement);
        this._placedTo.push(placedTo);
    }

    _isCorrectSolution(solutionInfo) {
        const solutionPositions = solutionInfo.positions;
        for (const element of solutionInfo) {
            const placedTo = this._moves.get(element);

            if (!solutionPositions.includes(placedTo)) return false;
        }
        return true;

    }

    _isSolved() {
        for (const {name, info} of this._correctSolutions.entries()) {
            if (this._isCorrectSolution(info)) {
                this._solutionName = name;
                return true;
            }
        }
        return false;
    }

    isSolved() {
        if (this._currentSolutionName === null) return false;

        const solutionInfo = this._correctSolutions[this._currentSolutionName];
        const allElementsTaken = this._chosenElements.every((e) => {
            return solutionInfo.elements.includes(e);
        });

        const allPositionsUsed = this._placedTo.every((p) => {
            return solutionInfo.positions.includes(p);
        });

        return allElementsTaken && allPositionsUsed;
    }

    reset() {
        this._currentSolutionName = null;
        this._chosenElements = [];
        this._placedTo = [];
    }
}