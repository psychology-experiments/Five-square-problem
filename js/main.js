// import {core, data, sound, util, visual} from '../lib/psychojs-2021.2.3.js';
import { core, util, visual } from '../lib/psychojs-2021.2.3.developer.js';

import * as eventHandler from './katona/eventhandler.js';
import * as movement from './katona/presenter/logic/movement.js';

import { Grid } from './katona/presenter/logic/grid.js';
import { VisualGrid } from './katona/view/grid.js';
import { chooseProbe, DataSaver, MovesTimeObserver } from './katona/optional.js';
import {
    SingleSymbolKeyboard,
    AdditionalTrialData
} from './inputprocessing/inputprocessing.js';
import { FiveSquareKatona } from './katona/katona.js';
import { createProbe, existingProbes } from './probes/probe.js';
import { instructions as INSTRUCTIONS } from './instructions/instructions.js';
import { SingleClickMouse } from './katona/presenter/logic/movement.js';
import { ResizeWorkAround } from './katona/general.js';


const { PsychoJS } = core;
const { Scheduler } = util;

const { EVENT } = eventHandler;

// Development constants
const PROBE_CAN_BE_CHOSEN = false;
const DOWNLOAD_RESOURCES = true;
const SHOW_IMPASSE_PROBES = DOWNLOAD_RESOURCES && true;
const SHOW_SINGLE_INSTRUCTION = true;
const GRID_TRAINING = true;
const PROBE_TRAINING = true;
const IN_DEVELOPMENT = false;
// Experiment constants
const PROBE_TYPES = Object.keys(existingProbes);
let PROBE_TYPE;
const IMPASSE_INTERRUPTION_TIME = 15;
const MINIMAL_THRESHOLD_TIME = 15;
const MINIMAL_PROBE_TRAINING_TRAILS = 30;
const MAX_KATONA_SOLUTION_TIME = 15 * 60; // minutes to seconds
// Participants constants
const NEEDED_PARTICIPANTS_IN_GROUP = 20;
const CURRENT_PARTICIPANTS_IN_GROUP = new Map(
    [ // order must be as in existingProbes
        ['ControlProbe', 11],
        ['UpdateProbe', 11],
        ['ShiftProbe', 7],
        ['InhibitionProbe', 14],
    ]
);


// store info about the experiment session:
const expName = 'Five square problem';
// noinspection NonAsciiCharacters
const expInfo = {
    пол: ['Ж', 'М'],
    возраст: '',
};

if (PROBE_CAN_BE_CHOSEN) {
    expInfo.probeType = PROBE_TYPES;
} else {
    PROBE_TYPE = chooseProbe({
        probes: PROBE_TYPES,
        inGroupNeeded: NEEDED_PARTICIPANTS_IN_GROUP,
        inGroupCurrent: Array.from(CURRENT_PARTICIPANTS_IN_GROUP.values())
    });
}

// experiment constants
const MOVABLE_STICKS_INDEXES = [
    [-1, -1], [0, -1], [1, -1],
    [-2, 0], [-3, 0], [-2, 1],
    [0, 0], [-1, 0], [1, 0], [0, 1],
    [-1, 1], [0, 2], [1, 1],
    [2, 0], [3, 0], [2, 1],
];

const PROBES_DATA = {
    'UpdateProbe': {
        'probes': [
            'materials/Probes/Update/1.png',
            'materials/Probes/Update/2.png',
            'materials/Probes/Update/3.png'
        ],
        'answers': null
    },
    'ShiftProbe': {
        'probes': [
            'materials/Probes/Shift/1.png',
            'materials/Probes/Shift/2.png',
            'materials/Probes/Shift/3.png',
            'materials/Probes/Shift/4.png',
            'materials/Probes/Shift/5.png',
            'materials/Probes/Shift/6.png',
            'materials/Probes/Shift/7.png',
            'materials/Probes/Shift/8.png'
        ],
        'answers': [
            'right',
            'right',
            'left',
            'right',
            'left',
            'left',
            'left',
            'right'
        ]
    },
    'InhibitionProbe': {
        'probes': [
            'materials/Probes/Inhibition/RR.png',
            'materials/Probes/Inhibition/RG.png',
            'materials/Probes/Inhibition/RB.png',
            'materials/Probes/Inhibition/RY.png',
            'materials/Probes/Inhibition/GR.png',
            'materials/Probes/Inhibition/GG.png',
            'materials/Probes/Inhibition/GB.png',
            'materials/Probes/Inhibition/GY.png',
            'materials/Probes/Inhibition/BR.png',
            'materials/Probes/Inhibition/BG.png',
            'materials/Probes/Inhibition/BB.png',
            'materials/Probes/Inhibition/BY.png',
            'materials/Probes/Inhibition/YR.png',
            'materials/Probes/Inhibition/YG.png',
            'materials/Probes/Inhibition/YB.png',
            'materials/Probes/Inhibition/YY.png'
        ],
        'answers': [
            'right',
            'left',
            'left',
            'right',
            'right',
            'left',
            'left',
            'right',
            'right',
            'left',
            'left',
            'right',
            'right',
            'left',
            'left',
            'right'
        ]
    },
    'ControlProbe': {
        'probes': [
            'materials/Probes/Control/dot.png',
        ],
        'answers': null
    }
};

const PROBES_TO_DOWNLOAD = [];
for (const probeName in PROBES_DATA) {
    if (probeName !== PROBE_TYPE && !PROBE_CAN_BE_CHOSEN) continue;
    for (const stimulusFP of PROBES_DATA[probeName].probes) {
        PROBES_TO_DOWNLOAD.push({ name: stimulusFP, path: stimulusFP });
    }
}

// init psychoJS:
const psychoJS = new PsychoJS({
    debug: false
});

// open window:
psychoJS.openWindow({
    fullscr: true,
    color: new util.Color('white'),
    units: 'height',
    waitBlanking: true
});
psychoJS.schedule(checkDeviceIsPermittedToUse); // at the start check that device is permitted
const flowScheduler = new Scheduler(psychoJS);

if (DOWNLOAD_RESOURCES) {
    // schedule the experiment
    psychoJS.schedule(psychoJS.gui.DlgFromDict({
        logoUrl: './materials/favicon.ico',
        text: 'Пожалуйста, дождитесь завершения  загрузки эксперимента' +
            ',\nа затем нажмите Ok',
        dictionary: expInfo,
        title: 'Пять квадратов'
    }));

    // Cast age field to number input
    const castAgeFieldFromTextToNumber = setInterval(() => {
        const ageField = document.querySelector('input[name=\'возраст\']');
        if (ageField === null) return;

        ageField.type = 'number';
        ageField.min = '14';
        ageField.max = '99';
        clearInterval(castAgeFieldFromTextToNumber);
    }, 100);

    // Protect experiment from start before all files were loaded
    const waitResourceDownloadingID = setInterval(() => {
        const okButton = document.getElementById('buttonOk');
        if (okButton === null) return;


        if (!okButton.disabled) {
            okButton.disabled = true;
            okButton.style.color = '#C3C3C3';
        }

        if (psychoJS.gui._allResourcesDownloaded) {
            okButton.disabled = false;
            okButton.style.color = '#454545';
            clearInterval(waitResourceDownloadingID);
        }

    }, 100);

    const dialogCancelScheduler = new Scheduler(psychoJS);
    psychoJS.scheduleCondition(function() {
        if (PROBE_CAN_BE_CHOSEN) {
            PROBE_TYPE = expInfo.probeType;
        }

        return (psychoJS.gui.dialogComponent.button === 'OK');
    }, flowScheduler, dialogCancelScheduler);

    // quit if user presses Cancel in dialog box:
    dialogCancelScheduler.add(quitPsychoJS, '', false);
} else {
    // during development start experiment without dialog component if w/o probes
    psychoJS.scheduleCondition(() => true, flowScheduler, flowScheduler);
}


// flowScheduler gets run if the participants presses OK
flowScheduler.add(updateInfo); // add timeStamp
flowScheduler.add(experimentInit);
flowScheduler.add(eventHandlersInit);
// instructions before training with grid and elements
scheduleConditionally(flowScheduler,
    showSingleInstruction('start', INSTRUCTIONS),
    SHOW_SINGLE_INSTRUCTION);
// training with grid and elements
scheduleConditionally(flowScheduler,
    trainingOnGrid(
        [[0, 0]],
        ['[1,2]'],
        (grid, [target]) => {
            const movableElement = grid.movableElements[0];
            return movableElement.getElementInfo().placedOn === target;
        },
        'firstControlsTraining',
        INSTRUCTIONS),
    GRID_TRAINING);
scheduleConditionally(flowScheduler,
    trainingOnGrid(
        [[0, -1], [0, 0]],
        ['[6,2]'],
        (grid, [target]) => {
            const movableElements = grid.movableElements;
            return movableElements.some((element) => {
                return element.getElementInfo().placedOn === target;
            });
        },
        'secondControlsTraining',
        INSTRUCTIONS),
    GRID_TRAINING);
scheduleConditionally(flowScheduler,
    trainingOnGrid(
        [[-2, -1], [0, -1], [2, -1]],
        ['[1,3]', '[3,3]', '[5,3]'],
        (() => {
            let isFinished = false;
            return (grid, targets) => {
                if (isFinished) return true;

                const movableElements = grid.movableElements;
                isFinished = movableElements.every((element) =>
                    targets.includes(element.getElementInfo().placedOn));
                return isFinished;
            };
        })(),
        'thirdControlsTraining',
        INSTRUCTIONS),
    GRID_TRAINING);
// instructions before training with probe
scheduleConditionally(flowScheduler,
    showSingleInstruction('beforeProbeTraining', INSTRUCTIONS),
    SHOW_SINGLE_INSTRUCTION);
scheduleConditionally(flowScheduler,
    showSingleInstruction(`${PROBE_TYPE}Full`, INSTRUCTIONS),
    SHOW_SINGLE_INSTRUCTION);
// probe training
const probeTrainingScheduler = scheduleConditionally(flowScheduler,
    probesTraining(INSTRUCTIONS[`${PROBE_TYPE}Short`], 0),
    PROBE_TRAINING);
// instructions after training with probe
scheduleConditionally(flowScheduler,
    showSingleInstruction('afterProbeTraining', INSTRUCTIONS),
    SHOW_SINGLE_INSTRUCTION);
// main task
flowScheduler.add(mainRoutineBegin(true));
flowScheduler.add(mainRoutineEachFrame());
flowScheduler.add(mainRoutineEnd());
// impasse task
// const addImpasseProbeTrial = scheduleConditionally(flowScheduler,
//     probesDuringImpasse(),
//     SHOW_IMPASSE_PROBES);


// load resources for experiment (during or after dialog component)

await psychoJS.start({
    expName: expName,
    expInfo: expInfo,
    resources: PROBES_TO_DOWNLOAD,
});
psychoJS.experimentLogger.setLevel(core.Logger.ServerLevel.EXP);

async function checkDeviceIsPermittedToUse() {
    const regExpRestrictedDevices =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

    if (regExpRestrictedDevices.test(navigator.userAgent)) {
        const exitMessage = `К сожалению, поучаствовать в исследовании можно только с компьютера или ноутбука`;
        const messageEditorID = setInterval(() => {
            const title = document.querySelector('.ui-dialog-title');
            const message = document.querySelector('p.validateTips');

            if (title !== null && message !== null) {
                title.textContent = 'Сообщение';
                message.innerHTML = message.innerHTML.replace(
                    'Thank you for your patience',
                    'Спасибо за ваше терпение');
                clearInterval(messageEditorID);
            }

        }, 10);

        await quitPsychoJS(exitMessage, false);
    }
    return Scheduler.Event.NEXT;
}


function prepareReturnToMainRoutine() {
    probe.setAutoDraw(false, t);
    instructionTextStim.status = PsychoJS.Status.NOT_STARTED;
    flowScheduler.add(
        showWarningMessage(INSTRUCTIONS.katonaWarning.toString()));
    flowScheduler.add(mainRoutineBegin(false));
    flowScheduler.add(mainRoutineEachFrame());
    flowScheduler.add(mainRoutineEnd());
}


function prepareImpasseRoutine() {
    probe.prepareForNewStart();
    instructionTextStim.status = PsychoJS.Status.NOT_STARTED;
    instructionTextStim.text = INSTRUCTIONS[`${PROBE_TYPE}Short`];
    instructionTextStim.pos = [0, 0.2];
    flowScheduler.add(
        showWarningMessage(INSTRUCTIONS.impasseWarning.toString()));
    flowScheduler.add(probesDuringImpasse());
    routineTimer.reset(IMPASSE_INTERRUPTION_TIME);
}


function scheduleConditionally(scheduler, routine, condition) {
    const routineScheduler = new Scheduler(psychoJS);
    routineScheduler.add(routine);
    if (condition) {
        scheduler.add(routineScheduler);
        return routineScheduler;
    }

}

async function updateInfo() {
    expInfo.date = util.MonotonicClock.getDateStr();  // add a simple timestamp
    expInfo.expName = expName;
    expInfo.psychopyVersion = '2021.2.3';
    // noinspection JSUnresolvedVariable,JSDeprecatedSymbols
    expInfo.OS = window.navigator.platform;

    // store frame rate of monitor if we can measure it successfully
    expInfo.frameRate = psychoJS.window.getActualFrameRate();
    // add info from the URL:
    util.addInfoFromUrl(expInfo);

    return Scheduler.Event.NEXT;
}


let mainClock;
let globalClock;
let impasseProbesClock;
let trainingProbesClock;
let instructionClock;
let routineTimer;
let fiveSquaresGrid;
let dataSaver;

let singleClick;
let mainResetButton;
let katonaRules;
let probe;
let probeInput;
let movesObserver;
let trainingProbe;
let trainingProbeInput;
let instructionExitKeyboard;
let instructionTextStim;
let warningMessage;

let resizeWorkAround;

async function experimentInit() {
    // Create some handy timers
    globalClock = new util.Clock();  // to track the time since experiment started
    routineTimer = new util.CountdownTimer();  // to track time remaining of each (non-slip) routine

    // Initialize time components for Routine "showSingleInstruction"
    instructionClock = new util.Clock();

    // Initialize time components for Routine "probesTraining"
    trainingProbesClock = new util.Clock();

    // Initialize time components for Routine "probesDuringImpasse"
    impasseProbesClock = new util.Clock(); // to track the time since experiment started

    // Initialize time components for Routine "mainRoutine"
    mainClock = new util.Clock();

    const gridUnitWidth = 0.01;
    const gridUnitHeight = 0.07;
    const fiveSquaresGridInfo = new Grid({
        startPoint: [-0.4, 0.45],
        gridSquares: 9,
        gridUnitLength: gridUnitHeight,
        gridUnitWidth: gridUnitWidth,
    });

    fiveSquaresGrid = new VisualGrid({
        window: psychoJS.window,
        grid: fiveSquaresGridInfo,
        gridColor: 'lightgrey',
        movableElementColor: 'black',
        movableElementsRelativeIndexes: MOVABLE_STICKS_INDEXES,
    });
    const gridBoundingBox = fiveSquaresGrid.getBoundingBox();

    singleClick = new movement.SingleClickMouse({
        window: psychoJS.window,
        buttonToCheck: 'left',
    });

    const middleGridPosition = [
        gridBoundingBox[1][0] + gridUnitHeight * 2,
        (gridBoundingBox[1][1] + gridBoundingBox[2][1]) / 2,
    ];
    mainResetButton = new visual.ButtonStim({
        win: psychoJS.window,
        text: 'Заново',
        fillColor: new util.Color('#011B56'),
        pos: middleGridPosition,
        size: [0.185, 0.07],
        padding: 0,
        letterHeight: 0.05,
    });

    katonaRules = new FiveSquareKatona(
        {
            indexMapperFunction: fiveSquaresGrid.getRelativeIdxToAbsoluteMapper(),
            movableElementsRelativeIndexes: MOVABLE_STICKS_INDEXES,
        }
    );

    if (SHOW_IMPASSE_PROBES) {
        probe = createProbe({
            probeType: PROBE_TYPE,
            probes: PROBES_DATA[PROBE_TYPE].probes,
            answers: PROBES_DATA[PROBE_TYPE].answers,
            window: psychoJS.window,
            position: [0.0, -0.25],
            startTime: 0.1,
        });

        probeInput = PROBE_TYPE !== 'ControlProbe' ?
            new SingleSymbolKeyboard({
                psychoJS: psychoJS,
                additionalTrialData: new AdditionalTrialData({})
            }) :
            new SingleClickMouse({
                window: psychoJS.window,
                buttonToCheck: 'left'
            });

        trainingProbe = createProbe({
            probeType: PROBE_TYPE,
            probes: PROBES_DATA[PROBE_TYPE].probes,
            answers: PROBES_DATA[PROBE_TYPE].answers,
            window: psychoJS.window,
            position: [0.0, -0.25],
            startTime: 0.1,
        });
        trainingProbeInput = PROBE_TYPE !== 'ControlProbe' ?
            new SingleSymbolKeyboard({
                psychoJS: psychoJS,
                additionalTrialData: new AdditionalTrialData({})
            }) :
            new SingleClickMouse({
                window: psychoJS.window,
                buttonToCheck: 'left'
            });
    }

    instructionTextStim = new visual.TextStim({
        win: psychoJS.window,
        color: new util.Color('black'),
        height: 0.035,
        text: '',
        wrapWidth: psychoJS.window.size[0] / psychoJS.window.size[1] * 0.8
    });
    instructionTextStim.adjustWrapWidthOnResize = function() {
        this.wrapWidth = psychoJS.window.size[0] / psychoJS.window.size[1] *
            0.8;
    };

    instructionTextStim.status = PsychoJS.Status.NOT_STARTED;
    instructionExitKeyboard = new SingleSymbolKeyboard({
        psychoJS: psychoJS,
        additionalTrialData: new AdditionalTrialData({})
    });

    warningMessage = new visual.TextStim({
        win: psychoJS.window,
        color: new util.Color('black'),
        height: 0.035,
        text: '',
        wrapWidth: psychoJS.window.size[0] / psychoJS.window.size[1] * 0.8
    });
    warningMessage.adjustWrapWidthOnResize = function() {
        this.wrapWidth = psychoJS.window.size[0] / psychoJS.window.size[1] *
            0.8;
    };

    warningMessage.status = PsychoJS.Status.NOT_STARTED;

    movesObserver = new MovesTimeObserver({
        minimalThresholdTime: MINIMAL_THRESHOLD_TIME
    });
    dataSaver = new DataSaver({ psychoJS });

    resizeWorkAround = new ResizeWorkAround(psychoJS.window);

    return Scheduler.Event.NEXT;
}


async function eventHandlersInit() {
    // support functions

    // without handleNewClick previous to choosing mouse wheel movement would
    // trigger rotation of the chosen problem element
    const handleNewClick = () => singleClick.clearInput();
    const resetFiveSquaresToDefaultState = ({ isTraining }) => {
        if (isTraining) {
            eventHandler.removeAllExpiringHandlers();
            setTimeout(registerChoosingHandler, 6000);
            return;
        }

        eventHandler.removeAllExpiringHandlers();
        fiveSquaresGrid.returnToDefault();
        katonaRules.returnToDefault();

        registerChoosingHandler();
    };
    const isMainResetButtonClick = () => {
        if (!mainResetButton.isClicked) return;

        eventHandler.emitEvent(EVENT.RESET, {
            resetRT: singleClick.getData().RT,
            timeFromStart: globalClock.getTime(),
            timeSolving: mainClock.getTime(),
        });
    };

    const registerChoosingHandler = () => {
        eventHandler.registerHandler({
            event: EVENT.CLICK,
            handler: gridElementChoosingHandler,
            removeAfter: EVENT.CHOSEN,
        });
    };

    const registerDraggingHandler = (mouse, chosenElement) => {
        eventHandler.registerHandler({
            event: EVENT.MOUSE_UPDATE,
            handler: () => movement.dragChosen(chosenElement, mouse),
            removeAfter: EVENT.PLACED,
        });
    };

    const registerPlacingHandler = (chosenElement, grid, isTraining) => {
        eventHandler.registerHandler({
            event: EVENT.CLICK,
            handler: () => gridElementPlacingHandler(chosenElement, grid,
                isTraining),
            removeAfter: EVENT.PLACED,
        });
    };

    // main handlers (switching)
    const gridElementChoosingHandler = (({
        clicker,
        grid,
        routineClock,
        isTraining
    }) => {
        const chosenElement = movement.chooseElement(grid, clicker);

        if (chosenElement === null) return;

        registerDraggingHandler(clicker, chosenElement);
        registerPlacingHandler(chosenElement, grid, isTraining);

        const reportData = {
            // isTraining: isTraining,
            element: chosenElement.name,
            takenFrom: chosenElement.wasTakenFrom,
            takeRT: clicker.getData().RT,
            timeFromStart: globalClock.getTime(),
            timeSolving: routineClock.getTime(),
        };
        if (isTraining) {
            reportData['isTraining'] = isTraining;
        }
        eventHandler.emitEvent(
            EVENT.CHOSEN,
            reportData
        );
    });

    const gridElementPlacingHandler = (chosenElement, grid, isTraining) => {
        const placedTo = movement.placeElement(
            chosenElement,
            grid,
            singleClick
        );

        if (placedTo === null) return;

        registerChoosingHandler();

        if (!isTraining) {
            katonaRules.countMove(
                chosenElement.name,
                chosenElement.wasTakenFrom,
                placedTo.name);
        }

        const reportData = {
            placedTo: placedTo.name,
            placeRT: singleClick.getData().RT,
            timeFromStart: globalClock.getTime(),
            timeSolving: mainClock.getTime(),
        };
        if (isTraining) {
            reportData['isTraining'] = isTraining;
        }
        eventHandler.emitEvent(EVENT.PLACED, reportData);
    };


    // permanent handlers registrations
    eventHandler.registerHandler({
        event: EVENT.CLICK,
        handler: handleNewClick,
    });

    eventHandler.registerHandler({
        event: EVENT.CHOSEN,
        handler: (data) => {
            if (data.isTraining) return;
            movesObserver.addStartTime(data.takeRT);
        }
    });

    eventHandler.registerHandler({
        event: EVENT.PLACED,
        handler: (data) => {
            if (data.isTraining) return;
            movesObserver.addEndTime(data.placeRT);
        }
    });

    eventHandler.registerHandler({
        event: EVENT.CLICK,
        handler: isMainResetButtonClick,
    });

    eventHandler.registerHandler({
        event: EVENT.RESET,
        handler: resetFiveSquaresToDefaultState,
    });

    registerChoosingHandler();

    const eventsToSave = [
        EVENT.CHOSEN,
        EVENT.PLACED,
        EVENT.RESET,
        EVENT.PROBE_ANSWER,
        EVENT.IMPASSE,
        EVENT.INSTRUCTION_READING,
    ];

    eventsToSave.forEach((event) => eventHandler.registerHandler({
        event: event,
        handler: (data) => {
            dataSaver.saveData({
                event: Object.keys(EVENT)[event],
                eventData: data,
            });
        }
    }));

    // start interval events
    setInterval(() =>
        eventHandler.emitEvent(EVENT.MOUSE_UPDATE, singleClick), 10);

    return Scheduler.Event.NEXT;
}


let t;
let frameN;
let lastImpasseTime;

function mainRoutineBegin(firstStart) {
    return async function() {
        //------Prepare to start Routine 'trial'-------
        fiveSquaresGrid.status = PsychoJS.Status.NOT_STARTED;
        mainResetButton.status = PsychoJS.Status.NOT_STARTED;
        instructionTextStim.status = PsychoJS.Status.NOT_STARTED;

        instructionTextStim.text = INSTRUCTIONS.fiveSquare;
        instructionTextStim.pos = [0, -0.4];

        if (firstStart) {
            t = 0;
            mainClock.reset(); // clock
            movesObserver.prepareToStart();
            frameN = -1;
        } else {
            mainClock.reset(-lastImpasseTime);
        }

        resizeWorkAround.addHandler(() => {
            const isStarted = [instructionTextStim, fiveSquaresGrid].some(
                (element) => element.status === PsychoJS.Status.STARTED);
            if (!isStarted) return;

            instructionTextStim.adjustWrapWidthOnResize();
            fiveSquaresGrid.setAutoDraw(false);
            fiveSquaresGrid.setAutoDraw(true);
        });
        // test.setAutoDraw(true);
        // test.forEach((tt) => tt.setAutoDraw(true));
        // screenCoverAfterWrongSolution.setAutoDraw(true);
        return Scheduler.Event.NEXT;
    };
}


function mainRoutineEachFrame() {
    // needed to bypass PsychoJS problem when visual elements calculate
    // wrong positions in full screen mode
    const TIME_BEFORE_START = 0.1;
    return async function() {
        //------Loop for each frame of Routine 'main'-------
        // get current time
        t = mainClock.getTime();
        frameN = frameN + 1;// number of completed frames (so 0 is the first frame)
        // update/draw components on each frame
        if (fiveSquaresGrid.status === PsychoJS.Status.NOT_STARTED && t >=
            TIME_BEFORE_START) {
            fiveSquaresGrid.setAutoDraw(true);
            fiveSquaresGrid.status = PsychoJS.Status.STARTED;
        }

        if (mainResetButton.status === PsychoJS.Status.NOT_STARTED && t >=
            TIME_BEFORE_START) {
            mainResetButton.setAutoDraw(true);
            mainResetButton.status = PsychoJS.Status.STARTED;
        }

        if (instructionTextStim.status === PsychoJS.Status.NOT_STARTED) {
            instructionTextStim.status = PsychoJS.Status.STARTED;
            instructionTextStim.setAutoDraw(true);
        }

        if (!singleClick.isInitialized && t >= TIME_BEFORE_START) {
            singleClick.initialize();
        }

        if (singleClick.isInitialized && singleClick.isSingleClick()) {
            eventHandler.emitEvent(EVENT.CLICK, {
                clicker: singleClick,
                grid: fiveSquaresGrid,
                routineClock: mainClock,
            });
        }


        // check for quit (typically the Esc key)
        if (IN_DEVELOPMENT && (
            psychoJS.experiment.experimentEnded ||
            psychoJS.eventManager.getKeys({
                keyList: ['escape']
            }).length > 0)) {
            return quitPsychoJS('The [Escape] key was pressed. Goodbye!',
                false);
        }

        if (katonaRules.isSolved() || t > MAX_KATONA_SOLUTION_TIME) {
            flowScheduler.add(quitPsychoJS, '', true);
            dataSaver.saveData({
                event: 'SOLUTION',
                eventData: { isSolved: katonaRules.isSolved() }
            });
            return Scheduler.Event.NEXT;
        }

        if (SHOW_IMPASSE_PROBES && movesObserver.isImpasse()) {
            lastImpasseTime = t;
            eventHandler.emitEvent(EVENT.IMPASSE, {
                timeFromStart: globalClock.getTime(),
                timeSolving: mainClock.getTime(),
            });
            return Scheduler.Event.NEXT;
        }

        // refresh the screen if continuing
        return Scheduler.Event.FLIP_REPEAT;
    };
}


function mainRoutineEnd() {
    return async function() {
        resizeWorkAround.removeLastHandler();
        // the Routine "main" was not non-slip safe, so reset the non-slip timer
        fiveSquaresGrid.status = PsychoJS.Status.NOT_STARTED;
        mainResetButton.status = PsychoJS.Status.NOT_STARTED;

        // TODO: check all states and make sure Katona is stopped during probe
        singleClick.stop();
        fiveSquaresGrid.setAutoDraw(false);
        mainResetButton.setAutoDraw(false);
        instructionTextStim.setAutoDraw(false);

        instructionTextStim.status = PsychoJS.Status.FINISHED;
        instructionTextStim.pos = [0, 0];

        prepareImpasseRoutine();
        return Scheduler.Event.NEXT;
    };
}

function allProbeTrainingConditionsMet(trainingProbe) {
    return PROBE_TYPE !== 'ControlProbe' ||
        trainingProbeInput.isPressedIn(trainingProbe);
}

function allImpasseProbeConditionsMet(probe) {
    return PROBE_TYPE !== 'ControlProbe' || probeInput.isPressedIn(probe);
}

function probesTraining(probeInstruction, nTrial) {
    let areProbesPrepared = false;
    return async () => {
        if (!areProbesPrepared) {
            areProbesPrepared = true;
            trainingProbe.prepareForNewStart();
            trainingProbe.nextProbe();
            trainingProbesClock.reset();

            instructionTextStim.text = INSTRUCTIONS[`${PROBE_TYPE}Short`];
            instructionTextStim.pos = PROBE_TYPE !== 'ControlProbe'
                ? [0, 0.2]
                : [0, 0.38];
            instructionTextStim.status = PsychoJS.Status.NOT_STARTED;

            resizeWorkAround.addHandler(() => {
                trainingProbe.adjustOnResize();
                instructionTextStim.adjustWrapWidthOnResize();
            });
        }

        t = trainingProbesClock.getTime();

        if (!trainingProbe.isStarted) {
            trainingProbe.setAutoDraw(true, t);
        }

        if (instructionTextStim.status === PsychoJS.Status.NOT_STARTED) {
            instructionTextStim.setAutoDraw(true);
        }

        if (!trainingProbeInput.isInitialized && trainingProbe.isStarted) {
            trainingProbeInput.initialize({ keysToWatch: ['left', 'right'] });
        }

        if (trainingProbeInput.isSendInput() &&
            allProbeTrainingConditionsMet(trainingProbe)) {
            const pressInfo = trainingProbeInput.getData();
            eventHandler.emitEvent(EVENT.PROBE_ANSWER, {
                isTraining: true,
                probeType: PROBE_TYPE,
                probeName: trainingProbe.getProbeName(),
                probeRT: pressInfo.RT,
                keyPressed: pressInfo.keyName,
                isCorrect: trainingProbe.getPressCorrectness(pressInfo.keyName)
                    ? 1
                    : 0,
                timeFromStart: globalClock.getTime(),
            });
            trainingProbeInput.stop();
            trainingProbe.stop();
            trainingProbe.nextProbe();
            // go to next probe if training is not finished
            probeTrainingScheduler.add(
                probesTraining(INSTRUCTIONS[`${PROBE_TYPE}Short`], nTrial + 1));
            resizeWorkAround.removeLastHandler();
            return Scheduler.Event.NEXT;
        }

        if (nTrial === MINIMAL_PROBE_TRAINING_TRAILS) {
            trainingProbe.stop();
            instructionTextStim.pos = [0, 0];
            instructionTextStim.status = PsychoJS.Status.FINISHED;
            instructionTextStim.setAutoDraw(false);
            resizeWorkAround.removeLastHandler();
            return Scheduler.Event.NEXT;
        }

        return Scheduler.Event.FLIP_REPEAT;
    };
}

function trainingOnGrid(
    movableElementsIndexes,
    targetElementsIndexes,
    isTrainingRoutineFinished,
    instructionName,
    instructions) {
    const TIME_BEFORE_START = 0.1;
    const gridUnitWidth = 0.01;
    const gridUnitHeight = 0.07;

    // calculation of starting position to place grid in the center of the screen
    const startPoint = gridUnitWidth * 1.5 + gridUnitHeight * 1.5;
    const trainingGridInfo = new Grid({
        startPoint: [-startPoint, startPoint],
        gridSquares: 3,
        gridUnitLength: gridUnitHeight,
        gridUnitWidth: gridUnitWidth,
    });

    const trainingGrid = new VisualGrid({
        name: 'training',
        window: psychoJS.window,
        grid: trainingGridInfo,
        gridColor: 'lightgrey',
        movableElementColor: 'black',
        movableElementsRelativeIndexes: movableElementsIndexes,
    });
    trainingGrid.status = PsychoJS.Status.NOT_STARTED;

    targetElementsIndexes.forEach((targetIndex) => {
        trainingGrid.setGridElementColor(targetIndex, new util.Color('green'));
    });

    const trainingGridBoundingBox = trainingGrid.getBoundingBox();
    const trainingMiddleGridPosition = [
        trainingGridBoundingBox[1][0] + gridUnitHeight * 2,
        (trainingGridBoundingBox[1][1] + trainingGridBoundingBox[2][1]) / 2,
    ];
    const trainingResetButton = new visual.ButtonStim({
        win: psychoJS.window,
        text: 'Заново',
        fillColor: new util.Color('#011B56'),
        pos: trainingMiddleGridPosition,
        size: [0.185, 0.07],
        padding: 0,
        letterHeight: 0.05,
    });
    trainingResetButton.status = PsychoJS.Status.CONFIGURED;

    const trainingOnGridClock = new util.Clock();
    let trainingFinished = instructionName !== 'thirdControlsTraining';
    let placedCorrectly = false;
    let firstStart = true;
    let trainingT = 0;
    return () => {
        if (firstStart) {
            firstStart = false;
            instructionTextStim.status = PsychoJS.Status.NOT_STARTED;
            if (instructionName === 'thirdControlsTraining') {
                trainingResetButton.status = PsychoJS.Status.NOT_STARTED;
                eventHandler.registerHandler({
                    event: EVENT.CLICK,
                    handler: () => {
                        if (
                            !trainingResetButton.isClicked
                            || trainingResetButton.status ===
                            PsychoJS.Status.NOT_STARTED
                        ) return;

                        setTimeout(() => trainingFinished = true, 3000);
                        trainingGrid.returnToDefault();
                        eventHandler.emitEvent(EVENT.RESET, {
                            isTraining: true,
                            resetRT: singleClick.getData().RT,
                            timeFromStart: globalClock.getTime(),
                            timeSolving: trainingOnGridClock.getTime(),
                        });
                    },
                    removeAfter: EVENT.RESET,
                });
            }

            instructionTextStim.text = instructions[instructionName];
            instructionTextStim.pos = [0, 0.3];

            trainingOnGridClock.reset();
        }

        trainingT = trainingOnGridClock.getTime();

        if (trainingGrid.status === PsychoJS.Status.NOT_STARTED) {
            trainingGrid.status = PsychoJS.Status.STARTED;
            trainingGrid.setAutoDraw(true);
        }

        if (instructionTextStim.status === PsychoJS.Status.NOT_STARTED) {
            resizeWorkAround.addHandler(
                () => instructionTextStim.adjustWrapWidthOnResize());
            instructionTextStim.status = PsychoJS.Status.STARTED;
            instructionTextStim.setAutoDraw(true);
        }

        if (trainingResetButton.status === PsychoJS.Status.NOT_STARTED &&
            placedCorrectly) {
            trainingResetButton.status = PsychoJS.Status.STARTED;
            trainingResetButton.setAutoDraw(true);
        }

        if (!singleClick.isInitialized && trainingT >= TIME_BEFORE_START) {
            singleClick.initialize();
        }

        if (singleClick.isInitialized && singleClick.isSingleClick()) {
            eventHandler.emitEvent(EVENT.CLICK, {
                isTraining: true,
                clicker: singleClick,
                grid: trainingGrid,
                routineClock: trainingOnGridClock,
            });
        }


        placedCorrectly = isTrainingRoutineFinished(trainingGrid,
            targetElementsIndexes);
        if (placedCorrectly && trainingFinished) {
            instructionTextStim.text = '';
            instructionTextStim.pos = [0, 0];

            instructionTextStim.setAutoDraw(false);
            trainingGrid.returnToDefault();
            trainingGrid.setAutoDraw(false);
            trainingResetButton.setAutoDraw(false);
            singleClick.stop();
            resizeWorkAround.removeLastHandler();
            return Scheduler.Event.NEXT;
        }

        return Scheduler.Event.FLIP_REPEAT;
    };
}

function probesDuringImpasse(performedProbe = false) {
    let t = 0;
    probe.nextProbe();
    impasseProbesClock.reset();
    return async () => {
        t = impasseProbesClock.getTime();

        if (!probe.isStarted) {
            probe.setAutoDraw(true, t);
        }

        if (instructionTextStim.status === PsychoJS.Status.NOT_STARTED) {
            if (PROBE_TYPE === 'ControlProbe') instructionTextStim.pos = [
                0,
                0.4];

            resizeWorkAround.addHandler(() => {
                probe.adjustOnResize();
                instructionTextStim.adjustWrapWidthOnResize();
            });
            instructionTextStim.setAutoDraw(true);
        }

        if (!probeInput.isInitialized && probe.isStarted) {
            probeInput.initialize({ keysToWatch: ['left', 'right'] });
        }

        if (probeInput.isSendInput() && allImpasseProbeConditionsMet(probe)) {
            const pressInfo = probeInput.getData();
            eventHandler.emitEvent(EVENT.PROBE_ANSWER, {
                probeType: PROBE_TYPE,
                probeName: probe.getProbeName(),
                probeRT: pressInfo.RT,
                keyPressed: pressInfo.keyName,
                isCorrect: probe.getPressCorrectness(pressInfo.keyName) ? 1 : 0,
                timeFromStart: globalClock.getTime(),
            });
            probeInput.stop();
            probe.stop();
            // go to next probe if impasse intervention is not finished
            flowScheduler.add(probesDuringImpasse(true));
            return Scheduler.Event.NEXT;
        }

        if (routineTimer.getTime() < 0) {
            if (!performedProbe) {
                eventHandler.emitEvent(EVENT.PROBE_ANSWER, {
                    probeType: PROBE_TYPE,
                    probeName: probe.getProbeName(),
                    probeRT: 'не выполнял зонд',
                    keyPressed: '',
                    isCorrect: '',
                    timeFromStart: globalClock.getTime(),
                });
            }

            resizeWorkAround.removeLastHandler();
            instructionTextStim.setAutoDraw(false);
            prepareReturnToMainRoutine();
            return Scheduler.Event.NEXT;
        }

        return Scheduler.Event.FLIP_REPEAT;
    };
}


function showSingleInstruction(instructionName, instructions) {
    let isProbeManuallyChosen = PROBE_CAN_BE_CHOSEN;
    return async () => {
        if (isProbeManuallyChosen && (instructionName.includes('Full') ||
            instructionName.includes('Short'))) {
            instructionName = `${PROBE_TYPE}Full`;
            isProbeManuallyChosen = false;
        }

        t = instructionClock.getTime();

        if (instructionTextStim.status !== PsychoJS.Status.STARTED) {
            resizeWorkAround.addHandler(
                () => instructionTextStim.adjustWrapWidthOnResize());
            instructionTextStim.status = PsychoJS.Status.STARTED;
            instructionTextStim.text = instructions[instructionName];
            instructionTextStim.setAutoDraw(true);
        }

        if (!instructionExitKeyboard.isInitialized &&
            instructionTextStim.status === PsychoJS.Status.STARTED) {
            instructionExitKeyboard.initialize({ keysToWatch: ['space'] });
        }

        if (instructionExitKeyboard.isSendInput()) {
            const pressInfo = instructionExitKeyboard.getData();
            eventHandler.emitEvent(EVENT.INSTRUCTION_READING, {
                instructionName: instructionName,
                instructionExitRT: pressInfo.RT,
                keyPressed: pressInfo.keyName,
                timeFromStart: globalClock.getTime(),
            });
            instructionExitKeyboard.stop();
            instructionTextStim.setAutoDraw(false);
            instructionTextStim.status = PsychoJS.Status.FINISHED;

            resizeWorkAround.removeLastHandler();
            return Scheduler.Event.NEXT;
        }

        return Scheduler.Event.FLIP_REPEAT;
    };
}

function showWarningMessage(warningText) {
    let isPreparationComplete = false;
    let countdown = 3;
    let countdownID;
    return async () => {
        if (!isPreparationComplete) {
            isPreparationComplete = true;
            warningMessage.status = PsychoJS.Status.NOT_STARTED;
            countdownID = setInterval(() => {
                countdown -= 1;
                warningMessage.text = `${warningText} ${countdown}`;
            }, 1000);
        }

        if (warningMessage.status !== PsychoJS.Status.STARTED) {
            resizeWorkAround.addHandler(
                () => warningMessage.adjustWrapWidthOnResize());
            warningMessage.status = PsychoJS.Status.STARTED;
            warningMessage.text = `${warningText} ${countdown}`;
            warningMessage.setAutoDraw(true);
        }


        if (countdown <= -1) {
            clearInterval(countdownID);
            warningMessage.setAutoDraw(false);
            warningMessage.status = PsychoJS.Status.FINISHED;
            resizeWorkAround.removeLastHandler();
            return Scheduler.Event.NEXT;
        }

        return Scheduler.Event.FLIP_REPEAT;
    };
}


async function quitPsychoJS(message, isCompleted) {
    // Check for and save orphaned data
    if (psychoJS.experiment.isEntryEmpty()) {
        psychoJS.experiment.nextEntry();
    }
    psychoJS.window.close();
    await psychoJS.quit({ message: message, isCompleted: isCompleted });

    const translatePatienceMessage = setInterval(() => {
        const messageTitle = document.querySelector('span#ui-id-3');
        const messageField = document.querySelector('p.validateTips');
        if (messageField === null || messageTitle === null) return;

        messageTitle.textContent = 'Сообщение';
        messageField.textContent = 'Спасибо, что дождались окончания загрузки!';
        clearInterval(translatePatienceMessage);
    }, 10);

    return Scheduler.Event.QUIT;
}
