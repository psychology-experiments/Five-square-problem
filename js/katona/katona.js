const FIVE_SQUARE_KATONA_SOLUTIONS = {
    'left': {
        'sticks': [[0, 0], [-1, -1], [1, -1]],
        'positions': [[0, -2], [-1, -2], [1, -2]]
    },
    'right': {
        'sticks': [[0, 1], [-1, 1], [1, 1]],
        'positions': [[0, 3], [-1, 2], [1, 2]]
    },
    'up': {
        'sticks': [[-1, 0], [-2, 0], [-2, 1]],
        'positions': [[-4, 0], [-5, 0], [-4, 1]]
    },
    'down': {
        'sticks': [[1, 0], [2, 0], [2, 1]],
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
        console.log(solutionInAbsoluteIndex);
    }

    countMove() {
        this._movesMade += 1;
    }

    isMaxMovesMade() {
        return this._movesMade === this._maxMoves;
    }

    isSolved() {
        return false;
    }

    returnToDefault() {
        this._movesMade = 0;
    }
}