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


function _relativeIndexToAbsoluteFormatter(mapper) {
    return (index) => `[${mapper(index)}]`;
}

function _convertSolutionRelativeIndexToAbsolute(mapper, solutions) {
    const absoluteIndexSolutions = {};

    for (const solutionName in solutions) {
        const convertedSolutions = {};
        const solutionNameInfo = Object.entries(solutions[solutionName]);
        absoluteIndexSolutions[solutionName] = convertedSolutions;

        for (const [solutionPart, solutionRelativeIndexes] of solutionNameInfo) {
            convertedSolutions[solutionPart] = solutionRelativeIndexes.map(
                mapper);
        }
    }

    return absoluteIndexSolutions;
}


export class FiveSquareKatona {
    constructor({ indexMapperFunction, movableElementsRelativeIndexes }) {
        this._movesMade = 0;

        const indexMapper = _relativeIndexToAbsoluteFormatter(
            indexMapperFunction);
        const solutionInAbsoluteIndex = _convertSolutionRelativeIndexToAbsolute(
            indexMapper, FIVE_SQUARE_KATONA_SOLUTIONS);
        const movableElementsAbsoluteIndexes = movableElementsRelativeIndexes.map(
            indexMapper);
        this._answerChecker = new AnswerChecker(
            solutionInAbsoluteIndex,
            3,
            movableElementsAbsoluteIndexes,
        );
    }

    countMove(chosenElementName, wasTakenFrom, placedTo) {
        if (wasTakenFrom !== placedTo) {
            this._movesMade += 1;
            this._answerChecker.addMove(wasTakenFrom, placedTo);
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
    constructor(solutions, solutionMoves, movableElementsIndexes) {
        this._correctSolutions = solutions;
        this._defaultPositions = new Set(movableElementsIndexes);

        this._solutionName = null;
        this._solved = false;
        this._movesToSolve = solutionMoves;

        this._taken = new Set();
        this._placed = new Set();
    }

    addMove(takenFrom, placedTo) {
        // if element is placed then this position is not free
        this._taken.delete(placedTo);
        // if element is taken then this position is not occupied
        this._placed.delete(takenFrom);

        // only elements taken from default position are free
        if (this._defaultPositions.has(takenFrom)) {
            this._taken.add(takenFrom);
        }

        // only elements placed outside position must be traced
        if (!this._defaultPositions.has(placedTo)) {
            this._placed.add(placedTo);
        }

        this._isSolved();
    }

    _isCorrectSolution(solutionInfo) {
        const takenCorrectly = solutionInfo.elements.every(
            (taken) => this._taken.has(taken));
        const placedCorrectly = solutionInfo.positions.every(
            (placed) => this._placed.has(placed));

        return takenCorrectly && placedCorrectly;
    }

    _isSolutionImpossible() {
        return this._taken.size !== this._movesToSolve || this._placed.size !==
            this._movesToSolve;
    }

    _isSolved() {
        if (this._isSolutionImpossible()) return;

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
        this._taken.clear();
        this._placed.clear();
    }
}