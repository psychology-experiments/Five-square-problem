class InstructionInfo {
    constructor(info) {
        this._info = info.trim().replace(/\n/g, " ").replaceAll("  ", "\n");
    }

    toString() {
        return this._info;
    }
}


const start = `
Здравствуйте!\n
Спасибо, что согласились поучаствовать в исследовании.
Нам потребуется приблизительно 20 минут времени. На это время мы 
очень просим Вас не отвлекаться от выполнения заданий. Мы, группа учёных 
из Ярославского университета, изучаем решение инсайтных задач, поэтому мы 
просим Вас решить одну такую задачу. Мы не проверяем Ваши интеллектуальные 
способности. Более того, способность решать задачи из эксперимента слабо 
связана с умом и умением решать другие задачи, так что не переживайте, если 
покажется, что Вы плохо решили, и не особо радуйтесь, если хорошо :))\n
Нам интересно узнать, как именно происходит решение, поэтому прежде всего 
просим Вас все ходы делать на компьютере, а не в голове.\n
Сейчас мы покажем, как делать ходы на компьютере.\n
Если инструкция понятна, нажмите ПРОБЕЛ`;
const firstControlsTraining = `
Нажмите на чёрный элемент левой клавишей мыши. Удерживать клавишу, 
для перемещения элемента, не нужно. Поставьте элемент на подсвеченное зелёным место.`;
const secondControlsTraining = `
Замечательно! Элементы задачи ещё можно вращать. Для этого возьмите элемент и покрутите колесо мыши.
Элементы можно ставить на любые свободные элементы серого цвета (можете попробовать поставить один чёрный
элемент на другой). Однако на горизонтальные элементы можно ставить только горизонтально повернутые 
чёрные элементы. То же само и для вертикальных. Поставьте один из чёрных элементов на подсвеченное зелёным место.`;
const thirdControlsTraining = `
Великолепно! Перенесите чёрные элементы на подсвеченные зелёным места. После этого появится кнопка
"Заново". Она возвращает все элементы в исходное состояние. Нажмите на неё и посмотрите как выглядит результат
нажатия. Через 3 секунд после этого тренировка завершится.`;
const beforeProbeTraining = `
Отлично!\n
Иногда, возможно, программа попросит Вас отложить 
на время решение основной задачи
и на несколько секунд отвлечься на другое задание.\n
Нажмите ПРОБЕЛ, чтобы потренироваться выполнять задание.`;
const afterProbeTraining = `
Теперь Вы готовы решать задачу. Решайте ту задачу, которая перед Вами на экране. 
Ещё раз напомним главное –  по возможности, показывайте нам и программе каждый свой ход.\n
Жмите ПРОБЕЛ и приступайте :)`;
const ControlProbeFull = `
Сейчас на экране будет появляться точка. 
Ваша задача щёлкать по ней левой клавишей мыши как можно быстрее
после её появления на экране.\n
Если Вы готовы, нажмите ПРОБЕЛ`;
const ControlProbeShort = `
Щёлкайте левой клавишей мыши по точкам как можно быстрее после их появления`;
const ShiftProbeFull = `
Сейчас на экране Вам будут показаны различные фигуры
В зависимости от цвета фигуры задание будет меняться\n
1) Если фигура ЧЕРНАЯ:\n
Нажимайте стрелку ВПРАВО, когда фигура состоит из МАЛЕНЬКИХ КРУГОВ\n
Нажимайте стрелку ВЛЕВО, когда фигура состоит из МАЛЕНЬКИХ КВАДРАТОВ\n
2) Если фигура СИНЯЯ:\n
Нажимайте стрелку ВПРАВО, когда фигура – БОЛЬШОЙ КРУГ\n
Нажимайте стрелку ВЛЕВО, когда фигура – БОЛЬШОЙ КВАДРАТ\n
Постарайтесь выполнять задание как можно быстрее и точнее\n
Если Вы готовы, нажмите ПРОБЕЛ`;
const ShiftProbeShort = `
1) Если фигура ЧЕРНАЯ:\n
Нажимайте стрелку ВПРАВО, когда фигура состоит из МАЛЕНЬКИХ КРУГОВ\n
Нажимайте стрелку ВЛЕВО, когда фигура состоит из МАЛЕНЬКИХ КВАДРАТОВ\n
2) Если фигура СИНЯЯ:\n
Нажимайте стрелку ВПРАВО, когда фигура – БОЛЬШОЙ КРУГ\n
Нажимайте стрелку ВЛЕВО, когда фигура – БОЛЬШОЙ КВАДРАТ\n`;
const InhibitionProbeFull = `
Сейчас на экране Вам будут показаны слова, окрашенные в различные цвета
Вам необходимо определять цвет, которым написано слово\n
Если слово окрашено в КРАСНЫЙ или ЖЕЛТЫЙ цвет, нажимайте стрелку ВПРАВО\n
Если слово окрашено в ЗЕЛЕНЫЙ или СИНИЙ цвет, нажимайте стрелку ВЛЕВО\n
Постарайтесь выполнять задание как можно быстрее и точнее\n
Если Вы готовы, нажмите ПРОБЕЛ`;
const InhibitionProbeShort = `
Если слово окрашено в КРАСНЫЙ или ЖЕЛТЫЙ цвет, нажимайте стрелку ВПРАВО\n
Если слово окрашено в ЗЕЛЕНЫЙ или СИНИЙ цвет, нажимайте стрелку ВЛЕВО\n`;
const UpdateProbeFull = `
Сейчас на экране Вам будет показан ряд фигур\n
Если фигура на экране ОДИНАКОВАЯ с предыдущей фигурой, нажимайте стрелку ВПРАВО\n
Если предъявленная фигура и фигура до нее РАЗЛИЧНЫ – стрелку ВЛЕВО\n
Постарайтесь выполнять задание как можно быстрее и точнее\n
После того, как Вы увидите и запомните первую фигуру, нажмите стрелку ВПРАВО\n
Если Вы готовы, нажмите ПРОБЕЛ`;
const UpdateProbeShort = `
Если фигура на экране ОДИНАКОВАЯ с предыдущей фигурой, нажимайте стрелку ВПРАВО\n
Если предъявленная фигура и фигура до нее РАЗЛИЧНЫ – стрелку ВЛЕВО\n`;
const fiveSquare = `
Палочки на экране организуют фигуру из пяти квадратов. 
Ваша задача – переместить ровно три палочки,\n
чтобы получить четыре квадрата одинакового размера.`

const rawInstructions = {
    start,
    firstControlsTraining,
    secondControlsTraining,
    thirdControlsTraining,
    beforeProbeTraining,
    afterProbeTraining,
    ControlProbeFull,
    ControlProbeShort,
    ShiftProbeFull,
    ShiftProbeShort,
    InhibitionProbeFull,
    InhibitionProbeShort,
    UpdateProbeFull,
    UpdateProbeShort,
    fiveSquare,
};

const instructions = {};
for (const [name, info] of Object.entries(rawInstructions)) {
    instructions[name] = new InstructionInfo(info);
}

export { instructions };