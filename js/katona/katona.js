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

        const solutionInAbsoluteIndex = _convertSolutionRelativeIndexToAbsolute(
            indexMapper, FIVE_SQUARE_KATONA_SOLUTIONS);
        this._answerChecker = new AnswerChecker(
            solutionInAbsoluteIndex,
            3
        );
    }

    countMove(chosenElementName, wasTakenFrom, placedTo) {
        if (wasTakenFrom !== placedTo) {
            this._movesMade += 1;
            this._answerChecker.addMove(chosenElementName, placedTo);
        }
    }

    isSolved() {
        return this._answerChecker.isSolved();
    }

    returnToDefault() {
        this._movesMade = 0;
        this._answerChecker.reset();
    }
}


class AnswerChecker {
    constructor(solutions, solutionMoves) {
        this._correctSolutions = solutions;
        this._solutionName = null;
        this._solutionMoves = solutionMoves;
        this._solved = false;
        this._moves = new Map();
    }

    addMove(chosenElement, placedTo) {
        if (chosenElement === placedTo) {
            this._moves.delete(chosenElement);
        } else {
            this._moves.set(chosenElement, placedTo);
        }
        this._isSolved();
    }

    _isCorrectSolution(solutionInfo) {
        const solutionPositions = solutionInfo.positions;
        for (const element of solutionInfo.elements) {
            const placedTo = this._moves.get(element);

            if (!solutionPositions.includes(placedTo)) return false;
        }
        return true;

    }

    _isSolved() {
        if (this._moves.size !== this._solutionMoves) return;

        const solutions = Object.entries(this._correctSolutions);
        for (const [name, info] of solutions) {
            if (this._isCorrectSolution(info)) {
                this._solutionName = name;
                this._solved = true;
            }
        }
    }

    isSolved() {
        return this._solved;
    }

    reset() {
        this._moves.clear();
    }
}