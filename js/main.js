﻿// import {core, data, sound, util, visual} from '../lib/psychojs-2021.2.3.js';
import { core, util, visual } from '../lib/psychojs-2021.2.3.developer.js';

import * as eventHandler from './katona/eventhandler.js';
import * as movement from './katona/presenter/logic/movement.js';

import { Grid } from './katona/presenter/logic/grid.js';
import { VisualGrid } from './katona/view/grid.js';
import { ScreenCover } from './katona/optional.js';
import { FiveSquareKatona } from './katona/katona.js';
import { createProbe } from './probes/probe.js';


const { PsychoJS } = core;
const { Scheduler } = util;

const { EVENT } = eventHandler;

// Development constants
const SHOW_PROBES = true;


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

if (SHOW_PROBES) {
    // schedule the experiment
    psychoJS.schedule(psychoJS.gui.DlgFromDict({
        dictionary: expInfo,
        title: expName
    }));
    const dialogCancelScheduler = new Scheduler(psychoJS);
    psychoJS.scheduleCondition(function() {
        return (psychoJS.gui.dialogComponent.button === 'OK');
    }, flowScheduler, dialogCancelScheduler);
} else {
    // during development start experiment without dialog component if w/o probes
    // TODO: remove when script ready
    psychoJS.scheduleCondition(() => true, flowScheduler, flowScheduler);
}


// flowScheduler gets run if the participants presses OK
flowScheduler.add(updateInfo); // add timeStamp
flowScheduler.add(experimentInit);
flowScheduler.add(eventHandlersInit);


flowScheduler.add(mainRoutineBegin());
flowScheduler.add(mainRoutineEachFrame());
flowScheduler.add(mainRoutineEnd());
flowScheduler.add(quitPsychoJS, '', true);

// quit if user presses Cancel in dialog box: TODO: uncomment when script ready
// dialogCancelScheduler.add(quitPsychoJS, '', false);

// load resources for experiment (during or after dialog component)
console.log(PROBES_TO_DOWNLOAD)
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
        // TODO: before launch check that message is correct
        const exitMessage = `К сожалению для прохождения исследования нужна клавиатура. 
        К тому же с мобильного устройства сложнее рассмотреть все визуальные элементы.
        Запустите исследование с браузера компьютера, пожалуйста.`;
        await quitPsychoJS(exitMessage, false);
    }
    return Scheduler.Event.NEXT;
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
let routineTimer;
let grid;

let singleClick;
let resetButton;
let katonaRules;
let screenCoverAfterWrongSolution;
let probe;

let test;

async function experimentInit() {
    // Create some handy timers
    globalClock = new util.Clock();  // to track the time since experiment started
    routineTimer = new util.CountdownTimer();  // to track time remaining of each (non-slip) routine

    // Initialize components for Routine "main"
    mainClock = new util.Clock();

    const w = 0.01;
    const h = 0.09;
    const gridInfo = new Grid({
        startPoint: [-0.4, 0.47],
        gridSquares: 9,
        gridUnitLength: h,
        gridUnitWidth: w,
    });

    grid = new VisualGrid({
        window: psychoJS.window,
        grid: gridInfo,
        gridColor: 'lightgrey',
        movableElementColor: 'black',
        movableElementsRelativeIndexes: MOVABLE_STICKS_INDEXES,
    });

    const wrongSolutionMessage = `Данное решение неверное.
    Пожалуйста, нажмите на кнопку:\n\n"Заново"`;
    screenCoverAfterWrongSolution = new ScreenCover({
        window: psychoJS.window,
        boundingBoxOfSquares: grid.getBoundingBox(),
        coverColor: new util.Color('orange'),
        textMessage: wrongSolutionMessage,
        textColor: new util.Color('black'),
        secondsToCover: 1,
    });

    singleClick = new movement.SingleClickMouse({
        window: psychoJS.window,
        buttonToCheck: 'left',
    });

    resetButton = new visual.ButtonStim({
        win: psychoJS.window,
        text: 'Заново',
        fillColor: new util.Color('#011B56'),
        pos: [0.75, 0.02],
        size: [0.185, 0.07],
        padding: 0,
        letterHeight: 0.05,
    });

    katonaRules = new FiveSquareKatona(
        { indexMapper: grid.getRelativeIdxToAbsoluteMapper() }
    );

    if (SHOW_PROBES) {
        probe = createProbe({
            probeType: 'UpdateProbe',
            probes: PROBES_DATA.UpdateProbe.probes,
            answers: PROBES_DATA.UpdateProbe.answers,
            window: psychoJS.window,
            position: [0.3, 0.3],
            startTime: 0.1,
        });
    }


    // test = new visual.ImageStim({
    //     win: psychoJS.window,
    //     image: 'SwitchProbe 1.png',
    //     pos: [0, 0],
    // });

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
        screenCoverAfterWrongSolution.reset();
        registerChoosingHandler();
    };
    const isResetButtonClick = () => {
        if (!resetButton.isClicked) return;

        eventHandler.emitEvent(EVENT.RESET, singleClick);
    };
    const wrongSolutionHandler = () => {
        screenCoverAfterWrongSolution.setAutoDraw(true);

        const checkScreenCoverWork = setInterval(() => {
            if (screenCoverAfterWrongSolution.isCoveredScreen()) {
                grid.setAutoDraw(false);
                clearInterval(checkScreenCoverWork);
            }
        }, 300);

        eventHandler.removeExpiredHandlers(EVENT.CHOSEN);
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
            { chosenElement: chosenElement }
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

        eventHandler.emitEvent(EVENT.PLACED, {});

        if (katonaRules.isMaxMovesMade()) {
            eventHandler.emitEvent(EVENT.WRONG_SOLUTION, {});
        }
    };


    // permanent handlers registrations
    eventHandler.registerHandler({
        event: EVENT.CLICK,
        handler: handleNewClick,
    });

    eventHandler.registerHandler({
        event: EVENT.CLICK,
        handler: isResetButtonClick,
    });

    eventHandler.registerHandler({
        event: EVENT.RESET,
        handler: resetToDefaultState,
    });

    eventHandler.registerHandler({
        event: EVENT.WRONG_SOLUTION,
        handler: wrongSolutionHandler,
    });

    registerChoosingHandler();

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

function mainRoutineBegin() {
    return async function() {
        //------Prepare to start Routine 'trial'-------
        t = 0;
        mainClock.reset(); // clock
        frameN = -1;

        console.log(probe);
        probe.nextProbe();
        probe.setAutoDraw(true, 0.3);
        grid.setAutoDraw(true);
        resetButton.setAutoDraw(true);
        // test.setAutoDraw(true);
        // test.forEach((tt) => tt.setAutoDraw(true));
        // screenCoverAfterWrongSolution.setAutoDraw(true);
        return Scheduler.Event.NEXT;
    };
}


function mainRoutineEachFrame() {
    return async function() {
        //------Loop for each frame of Routine 'main'-------
        // get current time
        t = mainClock.getTime();
        frameN = frameN + 1;// number of completed frames (so 0 is the first frame)
        // update/draw components on each frame

        if (!singleClick.isInitialized && t >= 0) {
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
            return Scheduler.Event.NEXT;
        }

        // refresh the screen if continuing
        return Scheduler.Event.FLIP_REPEAT;
    };
}


function mainRoutineEnd() {
    return async function() {
        // the Routine "main" was not non-slip safe, so reset the non-slip timer
        routineTimer.reset();

        return Scheduler.Event.NEXT;
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


async function quitPsychoJS(message, isCompleted) {
    // Check for and save orphaned data
    if (psychoJS.experiment.isEntryEmpty()) {
        psychoJS.experiment.nextEntry();
    }
    psychoJS.window.close();
    await psychoJS.quit({ message: message, isCompleted: isCompleted });

    return Scheduler.Event.QUIT;
}
