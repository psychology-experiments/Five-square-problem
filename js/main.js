// import {core, data, sound, util, visual} from '../lib/psychojs-2021.2.3.js';
import { core, util, visual } from '../lib/psychojs-2021.2.3.developer.js';

import * as eventHandler from './katona/eventhandler.js';
import * as movement from './katona/presenter/logic/movement.js';

import { Grid } from './katona/presenter/logic/grid.js';
import { VisualGrid } from './katona/view/grid.js';
import { DataSaver, MovesTimeObserver } from './katona/optional.js';
import {
    SingleSymbolKeyboard,
    AdditionalTrialData
} from './inputprocessing/inputprocessing.js';
import { FiveSquareKatona } from './katona/katona.js';
import { createProbe } from './probes/probe.js';
import { instructions as INSTRUCTIONS } from "./instructions/instructions.js";


const { PsychoJS } = core;
const { Scheduler } = util;

const { EVENT } = eventHandler;

// Development constants
const DOWNLOAD_RESOURCES = true;
const SHOW_IMPASSE_PROBES = DOWNLOAD_RESOURCES && true;
const SHOW_SINGLE_INSTRUCTION = true;
const PROBE_TRAINING = true;
// TODO: определить длительность прерывания
const IMPASSE_INTERRUPTION_TIME = 15;
const MINIMAL_THRESHOLD_TIME = 15;
// TODO: make random or arbitrary choice of probes at experiment start
const PROBE_TYPE = 'ShiftProbe';
const MINIMAL_PROBE_TRAINING_TRAILS = 30;


// store info about the experiment session:
const expName = 'Five square problem';
const expInfo = { 'participant': '' };

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
            'materials/Probes/Switch/1.png',
            'materials/Probes/Switch/2.png',
            'materials/Probes/Switch/3.png',
            'materials/Probes/Switch/4.png',
            'materials/Probes/Switch/5.png',
            'materials/Probes/Switch/6.png',
            'materials/Probes/Switch/7.png',
            'materials/Probes/Switch/8.png'
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
    }
};

const PROBES_TO_DOWNLOAD = [];
for (const probeName in PROBES_DATA) {
    if (probeName !== PROBE_TYPE) continue;
    for (const stimulusFP of PROBES_DATA[probeName].probes) {
        PROBES_TO_DOWNLOAD.push({ name: stimulusFP, path: stimulusFP });
    }
}

// init psychoJS:
const psychoJS = new PsychoJS({
    debug: true // TODO: remove when development done
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
        // TODO: add text attribute
        dictionary: expInfo,
        title: expName
    }));

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
        return (psychoJS.gui.dialogComponent.button === 'OK');
    }, flowScheduler, dialogCancelScheduler);
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
    showSingleInstruction("start", INSTRUCTIONS.start),
    SHOW_SINGLE_INSTRUCTION);
// instructions before training with probe
scheduleConditionally(flowScheduler,
    showSingleInstruction("beforeProbeTraining", INSTRUCTIONS.beforeProbeTraining),
    SHOW_SINGLE_INSTRUCTION);
// probe traing
const addProbeTrainingTrial = scheduleConditionally(flowScheduler, probesTraining(INSTRUCTIONS[`${PROBE_TYPE}Full`]), PROBE_TRAINING);
// instructions after training with probe
scheduleConditionally(flowScheduler,
    showSingleInstruction("afterProbeTraining", INSTRUCTIONS.afterProbeTraining),
    SHOW_SINGLE_INSTRUCTION);
// main task
flowScheduler.add(mainRoutineBegin(true));
flowScheduler.add(mainRoutineEachFrame());
flowScheduler.add(mainRoutineEnd());
// impasse task
const addImpasseProbeTrial = scheduleConditionally(flowScheduler,
    probesDuringImpasse(),
    SHOW_IMPASSE_PROBES);


// quit if user presses Cancel in dialog box: TODO: uncomment when script ready
// dialogCancelScheduler.add(quitPsychoJS, '', false);

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
            const title = document.querySelector(".ui-dialog-title");
            const message = document.querySelector("p.validateTips");

            if (title !== null && message !== null) {
                title.textContent = "Сообщение";
                message.innerHTML = message.innerHTML
                    .replace(
                        "Thank you for your patience",
                        "Спасибо за ваше терпение");
                clearInterval(messageEditorID);
            }

        }, 10);

        await quitPsychoJS(exitMessage, false);
    }
    return Scheduler.Event.NEXT;
}


function prepareReturnToMainRoutine() {
    probe.setAutoDraw(false, t);
    flowScheduler.add(mainRoutineBegin(false));
    flowScheduler.add(mainRoutineEachFrame());
    flowScheduler.add(mainRoutineEnd());
}


function prepareImpasseRoutine() {
    probe.prepareForNewStart();
    flowScheduler.add(probesDuringImpasse());
    routineTimer.reset(IMPASSE_INTERRUPTION_TIME);
}

function preparTrainingRoutine() {
    probe.prepareForNewStart();
    flowScheduler.add(probesDuringImpasse());
    routineTimer.reset(IMPASSE_INTERRUPTION_TIME);
}

function skipRoutine() {
    return Scheduler.Event.NEXT;
}

function scheduleConditionally(scheduler, routine, condition) {
    const routineScheduler = new Scheduler(psychoJS);
    routineScheduler.add(routine);
    if (condition) {
        scheduler.add(routineScheduler);
        return () => routineScheduler.add(routine);
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
let grid;
let dataSaver;

let singleClick;
let resetButton;
let katonaRules;
let probe;
let probeKeyboard;
let movesObserver;
let trainingProbe;
let trainingKeyboard;
let instructionExitKeyboard;
let instructionTextStim;

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
    const gridUnitHeight = 0.09;
    const gridInfo = new Grid({
        startPoint: [-0.4, 0.47],
        gridSquares: 9,
        gridUnitLength: gridUnitHeight,
        gridUnitWidth: gridUnitWidth,
    });

    grid = new VisualGrid({
        window: psychoJS.window,
        grid: gridInfo,
        gridColor: 'lightgrey',
        movableElementColor: 'black',
        movableElementsRelativeIndexes: MOVABLE_STICKS_INDEXES,
    });
    const gridBoundingBox = grid.getBoundingBox();

    singleClick = new movement.SingleClickMouse({
        window: psychoJS.window,
        buttonToCheck: 'left',
    });

    const middleGridPosition = [
        gridBoundingBox[1][0] + gridUnitHeight * 2,
        (gridBoundingBox[1][1] + gridBoundingBox[2][1]) / 2,
    ];
    resetButton = new visual.ButtonStim({
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
            indexMapperFunction: grid.getRelativeIdxToAbsoluteMapper(),
            movableElementsRelativeIndexes: MOVABLE_STICKS_INDEXES,
        }
    );

    if (SHOW_IMPASSE_PROBES) {
        // TODO: make random or arbitrary choice of probes at experiment start
        probe = createProbe({
            probeType: PROBE_TYPE,
            probes: PROBES_DATA[PROBE_TYPE].probes,
            answers: PROBES_DATA[PROBE_TYPE].answers,
            window: psychoJS.window,
            position: [0.0, 0.0],
            startTime: 0.1,
        });

        probeKeyboard = new SingleSymbolKeyboard({
            psychoJS: psychoJS,
            additionalTrialData: new AdditionalTrialData({})
        });

        trainingProbe = createProbe({
            probeType: PROBE_TYPE,
            probes: PROBES_DATA[PROBE_TYPE].probes,
            answers: PROBES_DATA[PROBE_TYPE].answers,
            window: psychoJS.window,
            position: [0.0, 0.0],
            startTime: 0.1,
        });
        trainingKeyboard = new SingleSymbolKeyboard({
            psychoJS: psychoJS,
            additionalTrialData: new AdditionalTrialData({})
        });
    }

    instructionTextStim = new visual.TextStim({
        win: psychoJS.window,
        color: new util.Color("black"),
        height: 0.04,
        text: "",
        wrapWidth: psychoJS.window.size[0] / psychoJS.window.size[1] * 0.9
    });

    instructionTextStim.status = PsychoJS.Status.NOT_STARTED;
    instructionExitKeyboard = new SingleSymbolKeyboard({
        psychoJS: psychoJS,
        additionalTrialData: new AdditionalTrialData({})
    });

    movesObserver = new MovesTimeObserver({
        minimalThresholdTime: MINIMAL_THRESHOLD_TIME
    });
    dataSaver = new DataSaver({ psychoJS });

    return Scheduler.Event.NEXT;
}


async function eventHandlersInit() {
    // support functions

    // without handleNewClick previous to choosing mouse wheel movement would
    // trigger rotation of the chosen problem element
    const handleNewClick = () => singleClick.clearInput();
    const resetToDefaultState = () => {
        eventHandler.removeAllExpiringHandlers();
        grid.returnToDefault();
        katonaRules.returnToDefault();
        registerChoosingHandler();
    };
    const isResetButtonClick = () => {
        if (!resetButton.isClicked) return;

        // TODO: обсудить как считать время хода, если человек нажал ЗАНОВО (во время зонда не решал)!
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

    const registerPlacingHandler = (chosenElement) => {
        eventHandler.registerHandler({
            event: EVENT.CLICK,
            handler: () => gridElementPlacingHandler(chosenElement),
            removeAfter: EVENT.PLACED,
        });
    };

    // main handlers (switching)
    const gridElementChoosingHandler = ((clicker) => {
        const chosenElement = movement.chooseElement(grid, clicker);

        if (chosenElement === null) return;

        registerDraggingHandler(clicker, chosenElement);
        registerPlacingHandler(chosenElement);

        eventHandler.emitEvent(
            EVENT.CHOSEN,
            {
                element: chosenElement.name,
                takenFrom: chosenElement.wasTakenFrom,
                takeRT: clicker.getData().RT,
                timeFromStart: globalClock.getTime(),
                timeSolving: mainClock.getTime(),
            }
        );
    });

    const gridElementPlacingHandler = (chosenElement) => {
        const placedTo = movement.placeElement(
            chosenElement,
            grid,
            singleClick
        );

        if (placedTo === null) return;

        registerChoosingHandler();
        katonaRules.countMove(
            chosenElement.name,
            chosenElement.wasTakenFrom,
            placedTo.name);

        eventHandler.emitEvent(EVENT.PLACED, {
            placedTo: placedTo.name,
            placeRT: singleClick.getData().RT,
            timeFromStart: globalClock.getTime(),
            timeSolving: mainClock.getTime(),
        });
    };


    // permanent handlers registrations
    eventHandler.registerHandler({
        event: EVENT.CLICK,
        handler: handleNewClick,
    });

    eventHandler.registerHandler({
        event: EVENT.CHOSEN,
        handler: (data) => {
            movesObserver.addStartTime(data.takenRT);
        }
    });

    eventHandler.registerHandler({
        event: EVENT.PLACED,
        handler: (data) => {
            movesObserver.addEndTime(data.placedRT);
        }
    });

    eventHandler.registerHandler({
        event: EVENT.CLICK,
        handler: isResetButtonClick,
    });

    eventHandler.registerHandler({
        event: EVENT.RESET,
        handler: resetToDefaultState,
    });

    registerChoosingHandler();

    const eventsToSave = [
        EVENT.CHOSEN,
        EVENT.PLACED,
        EVENT.RESET,
        EVENT.PROBE_ANSWER,
        EVENT.IMPASSE,
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

    // eventHandler.registerHandler({
    //     event: EVENT.CLICK,
    //     handler: console.log,
    // });

    // start interval events
    setInterval(() =>
        eventHandler.emitEvent(EVENT.MOUSE_UPDATE, singleClick), 10);

    return Scheduler.Event.NEXT;
}


let t;
let frameN;

function mainRoutineBegin(firstStart) {
    return async function() {
        //------Prepare to start Routine 'trial'-------
        grid.status = PsychoJS.Status.NOT_STARTED;
        resetButton.status = PsychoJS.Status.NOT_STARTED;

        if (firstStart) {
            t = 0;
            mainClock.reset(); // clock
            movesObserver.prepareToStart();
            frameN = -1;
        }
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

        if (grid.status === PsychoJS.Status.NOT_STARTED && t >=
            TIME_BEFORE_START) {
            grid.setAutoDraw(true);
            grid.status = PsychoJS.Status.STARTED;
        }

        if (resetButton.status === PsychoJS.Status.NOT_STARTED && t >=
            TIME_BEFORE_START) {
            resetButton.setAutoDraw(true);
            resetButton.status = PsychoJS.Status.STARTED;
        }

        if (!singleClick.isInitialized && t >= TIME_BEFORE_START) {
            singleClick.initialize();
        }

        if (singleClick.isInitialized && singleClick.isSingleClick()) {
            eventHandler.emitEvent(EVENT.CLICK, singleClick);
        }


        // check for quit (typically the Esc key)
        if (psychoJS.experiment.experimentEnded ||
            psychoJS.eventManager.getKeys({ keyList: ['escape'] }).length > 0) {
            return quitPsychoJS('The [Escape] key was pressed. Goodbye!',
                false);
        }

        if (katonaRules.isSolved()) {
            flowScheduler.add(quitPsychoJS, '', true);
            return Scheduler.Event.NEXT;
        }

        if (SHOW_IMPASSE_PROBES && movesObserver.isImpasse()) {
            eventHandler.emitEvent(EVENT.IMPASSE, {});
            return Scheduler.Event.NEXT;
        }

        // refresh the screen if continuing
        return Scheduler.Event.FLIP_REPEAT;
    };
}


function mainRoutineEnd() {
    return async function() {
        // the Routine "main" was not non-slip safe, so reset the non-slip timer
        grid.status = PsychoJS.Status.NOT_STARTED;
        resetButton.status = PsychoJS.Status.NOT_STARTED;

        // TODO: check all states and make sure Katona is stopped during probe
        singleClick.stop();
        grid.setAutoDraw(false);
        resetButton.setAutoDraw(false);

        prepareImpasseRoutine();
        return Scheduler.Event.NEXT;
    };
}

function probesTraining(probeInstruction) {
    let n = 0;
    let areProbesPrepared = false;
    return async () => {
        if (!areProbesPrepared) {
            areProbesPrepared = true;
            trainingProbe.prepareForNewStart();
            trainingProbe.nextProbe();
            trainingProbesClock.reset();
        }

        t = trainingProbesClock.getTime();

        if (!trainingProbe.isStarted) {
            trainingProbe.setAutoDraw(true, t);
        }

        if (!trainingKeyboard.isInitialized && trainingProbe.isStarted) {
            trainingKeyboard.initialize({ keysToWatch: ['left', 'right'] });
        }

        if (trainingKeyboard.isSendInput()) {
            const pressInfo = trainingKeyboard.getData();
            eventHandler.emitEvent(EVENT.TRAINING_PROBE_ANSWER, {
                probeType: PROBE_TYPE,
                probeName: trainingProbe.getProbeName(),
                probeRT: pressInfo.RT,
                keyPressed: pressInfo.keyName,
                isCorrect: trainingProbe.getPressCorrectness(pressInfo.keyName) ? 1 : 0,
                timeFromStart: globalClock.getTime(),
            });
            trainingKeyboard.stop();
            trainingProbe.stop();
            trainingProbe.nextProbe();
            // go to next probe if training is not finished
            addProbeTrainingTrial();
            n += 1;
            return Scheduler.Event.NEXT;
        }

        if (n === MINIMAL_PROBE_TRAINING_TRAILS) {
            trainingProbe.stop();
            return Scheduler.Event.NEXT;
        }

        return Scheduler.Event.FLIP_REPEAT;
    };
}

function probesDuringImpasse() {
    let t = 0;
    // probe.nextProbe();
    // impasseProbesClock.reset();
    return async () => {
        t = impasseProbesClock.getTime();

        if (!probe.isStarted) {
            probe.setAutoDraw(true, t);
        }

        if (!probeKeyboard.isInitialized && probe.isStarted) {
            probeKeyboard.initialize({ keysToWatch: ['left', 'right'] });
        }

        if (probeKeyboard.isSendInput()) {
            const pressInfo = probeKeyboard.getData();
            eventHandler.emitEvent(EVENT.PROBE_ANSWER, {
                probeType: PROBE_TYPE,
                probeName: probe.getProbeName(),
                probeRT: pressInfo.RT,
                keyPressed: pressInfo.keyName,
                isCorrect: probe.getPressCorrectness(pressInfo.keyName) ? 1 : 0,
                timeFromStart: globalClock.getTime(),
            });
            probeKeyboard.stop();
            probe.stop();
            // go to next probe if impasse intervention is not finished
            flowScheduler.add(probesDuringImpasse());
            return Scheduler.Event.NEXT;
        }

        if (routineTimer.getTime() < 0) {
            prepareReturnToMainRoutine();
            return Scheduler.Event.NEXT;
        }

        return Scheduler.Event.FLIP_REPEAT;
    };
}


// function endLoopIteration(scheduler, snapshot) { TODO: uncomment when done
//     // ------Prepare for next entry------
//     return async function () {
//         if (typeof snapshot !== 'undefined') {
//             // ------Check if user ended loop early------
//             if (snapshot.finished) {
//                 // Check for and save orphaned data
//                 if (psychoJS.experiment.isEntryEmpty()) {
//                     psychoJS.experiment.nextEntry(snapshot);
//                 }
//                 scheduler.stop();
//             } else {
//                 const thisTrial = snapshot.getCurrentTrial();
//                 if (typeof thisTrial === 'undefined' || !('isTrials' in thisTrial) || thisTrial.isTrials) {
//                     psychoJS.experiment.nextEntry(snapshot);
//                 }
//             }
//             return Scheduler.Event.NEXT;
//         }
//     };
// }

function showSingleInstruction(instructionName, instructionText) {
    return async () => {
        t = instructionClock.getTime();

        if (instructionTextStim.status !== PsychoJS.Status.STARTED) {
            instructionTextStim.status = PsychoJS.Status.STARTED;
            instructionTextStim.text = instructionText;
            instructionTextStim.setAutoDraw(true);
        }

        if (!instructionExitKeyboard.isInitialized && instructionTextStim.status === PsychoJS.Status.STARTED) {
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

    return Scheduler.Event.QUIT;
}
