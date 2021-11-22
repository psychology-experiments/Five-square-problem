// import {core, data, sound, util, visual} from '../lib/psychojs-2021.2.3.js';
import { core, util, visual } from '../lib/psychojs-2021.2.3.developer.js';

import { Grid } from './katona/presenter/logic/grid.js';
import { GridElementMover } from './katona/presenter/logic/movement.js';
import { VisualGrid } from './katona/view/grid.js';


const { PsychoJS } = core;
const { Scheduler } = util;

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


// schedule the experiment: (turned off during development) TODO: remove when script ready
// psychoJS.schedule(psychoJS.gui.DlgFromDict({
//     dictionary: expInfo,
//     title: expName
// }));

const flowScheduler = new Scheduler(psychoJS);
// const dialogCancelScheduler = new Scheduler(psychoJS); TODO: uncomment when script ready
// psychoJS.scheduleCondition(function () {
//     return (psychoJS.gui.dialogComponent.button === 'OK');
// }, flowScheduler, dialogCancelScheduler);

// during development start experiment without dialog component TODO: remove when script ready
psychoJS.scheduleCondition(() => true, flowScheduler, flowScheduler);

// flowScheduler gets run if the participants presses OK
flowScheduler.add(updateInfo); // add timeStamp
flowScheduler.add(experimentInit);


flowScheduler.add(mainRoutineBegin());
flowScheduler.add(mainRoutineEachFrame());
flowScheduler.add(mainRoutineEnd());
flowScheduler.add(quitPsychoJS, '', true);

// quit if user presses Cancel in dialog box: TODO: uncomment when script ready
// dialogCancelScheduler.add(quitPsychoJS, '', false);

// load resources for experiment (during or after dialog component)
await psychoJS.start({
    expName: expName,
    expInfo: expInfo,
    resources: []
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
    // noinspection JSUnresolvedVariable
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
let mover;
let aim;

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

    mover = new GridElementMover({ window: psychoJS.window });

    aim = new visual.Rect({
        win: psychoJS.window,
        pos: [-0.4, 0.47],
        ori: 0,
        fillColor: new util.Color('red'),
        lineColor: new util.Color('red'),
        width: 0.001,
        height: 0.001,
        size: 1,
    });

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

        grid.setAutoDraw(true);
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


        // check for quit (typically the Esc key)
        if (psychoJS.experiment.experimentEnded ||
            psychoJS.eventManager.getKeys({ keyList: ['escape'] }).length > 0) {
            return quitPsychoJS('The [Escape] key was pressed. Goodbye!',
                false);
        }

        mover.checkMove(grid.gridElements);
        mover.dragChosen();
        aim.draw();

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
