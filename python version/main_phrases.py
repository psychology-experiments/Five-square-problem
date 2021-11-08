from psychopy import core, gui, visual
from psychopy.hardware import keyboard

from katona.katona import Katona, TrainingOnGrid


# handy functions
def show_instruction(text_for_instruction):
    instruction_text.text = text_for_instruction
    while True:
        continue_key = kb.getKeys(keyList=["space"])

        quit_instruction_key = kb.getKeys(keyList=["escape"])

        if quit_instruction_key:
            core.quit()

        if continue_key:
            break

        instruction_text.draw()
        win.flip()


# Handy variables for testing
TEST = True
SKIP_TRAINING = True
FULL_SCREEN = False

# Global variables
BACKGROUND_COLOR = "#E0FFFF"
SCREEN_COVER_COLOR = "#D8BFD8"
GRID_COLOR = "#cbcbcb"
MOVABLE_STICK_COLOR = "black"


# Variables to store information of particular problem on squared grid
MOVABLE_STICKS_INDEXES = ((-1, -1), (0, -1), (1, -1),
                          (-2, 0), (-3, 0), (-2, 1),
                          (0, 0), (-1, 0), (1, 0), (0, 1),
                          (-1, 1), (0, 2), (1, 1),
                          (2, 0), (3, 0), (2, 1),
                          )
SOLUTIONS = {"left": {"sticks": ((0, 0), (-1, -1), (1, -1)),
                      "positions": ((0, -2), (-1, -2), (1, -2))},
             "right": {"sticks": ((0, 1), (-1, 1), (1, 1)),
                       "positions": ((0, 3), (-1, 2), (1, 2))},
             "up": {"sticks": ((-1, 0), (-2, 0), (-2, 1)),
                    "positions": ((-4, 0), (-5, 0), (-4, 1))},
             "down": {"sticks": ((1, 0), (2, 0), (2, 1)),
                      "positions": ((4, 0), (5, 0), (4, 1))},
             }

# instruction texts
first_instruction = "Здравствуйте! Вам предлагается принять участие в эксперименте! " \
                    "Сначала необходимо выполнить тренировочное задание!\n" \
                    "Для продолжения нажмите ПРОБЕЛ"
second_instruction = "Отлично! Теперь Вам необходимо решить задачу! Перед Вами 5 квадратов, " \
                     " из них нужно сделать 4 равных квадрата, переместив 3 спички!\n" \
                     "Если Вы ощущаете, что не знаете как решать, у Вас нет идей, или Вы исчерпали все варианты " \
                     "решения, нажмите клавишу Я ЗАСТРЯЛ. Для продолжения нажмите ПРОБЕЛ"

# info about experiment and participant
experiment_info = dict(
    Испытуемый="",
    Возраст="",
    Пол=["Женский", "Мужской"],
    Группа=["1", "2"]  # control experiment influence. The names chosen to hide real influence
)

if not TEST:
    dlg = gui.DlgFromDict(dictionary=experiment_info,
                          title="Информация об эксперименте",
                          sortKeys=False)
    if not dlg.OK:
        core.quit()

# decoding of experiment info
if experiment_info["Группа"] == "1":
    experiment_info["feedback.type"] = "control"
else:
    experiment_info["feedback.type"] = "experiment"
del experiment_info["Группа"]

# Components preparation of the experiment
win = visual.Window(size=(1920, 1080),
                    units="pix", color=BACKGROUND_COLOR, fullscr=FULL_SCREEN, monitor="Dell")
kb = keyboard.Keyboard()
katona = Katona(window=win,
                stick_length=40.0,
                stick_width=15.0,
                field_size=9,
                grid_color=GRID_COLOR,
                data_fp="data",
                experiment_info=experiment_info,
                special_event_finder="ObjectiveImpasseFinder",
                solution=SOLUTIONS,
                time_limit=15,
                background_color=BACKGROUND_COLOR,
                screen_cover_color=SCREEN_COVER_COLOR,
                time_to_cover_grid=10,
                feedback="phrases",
                )
katona.create_movable_sticks(grid_indexes=MOVABLE_STICKS_INDEXES,
                             movable_stick_color=MOVABLE_STICK_COLOR)

training_session = TrainingOnGrid(window=win,
                                  stick_length=40.0,
                                  stick_width=15.0,
                                  field_size=5,
                                  grid_color=GRID_COLOR,
                                  )

instruction_text = visual.TextStim(win=win,
                                   color=MOVABLE_STICK_COLOR,
                                   text="",
                                   height=40,
                                   wrapWidth=win.size[0] * 0.6)

# First instruction
show_instruction(first_instruction)

# Training tasks
while not SKIP_TRAINING:
    quit_key = kb.getKeys(keyList=["escape"])

    if quit_key:
        core.quit()

    if training_session.training_finished:
        training_stop = kb.getKeys(keyList=["space"])

        if training_stop:
            break

    training_session.run()
    training_session.draw()

    win.flip()

# Second instruction
show_instruction(second_instruction)

# Main Katona problem
katona.start_time()

win.recordFrameIntervals = True
while True:
    quit_key = kb.getKeys(keyList=["escape"])

    if quit_key:
        core.quit()

    katona.run()
    katona.draw()

    win.flip()

    if katona.solved is not None:
        break

# Конец решения
if katona.solved:
    image_path = "images/problem solved.jpg"
    feedback_text = "Отлично! Вы справились с решением!\nСпасибо за участие в эксперименте"
else:
    image_path = "images/problem not solved.jpg"
    feedback_text = "К сожалению время вышло!\nСпасибо за участие в эксперименте"
image = visual.ImageStim(win=win,
                         image=image_path)
image_y_bound = abs(image.verticesPix[0][1])

text = visual.TextStim(win=win,
                       text=feedback_text,
                       pos=(0, (win.size[1] / 2 + image_y_bound) / 2),
                       color="black",
                       height=30,
                       wrapWidth=win.size[1],
                       )
feedback_clock = core.CountdownTimer(start=3)
while feedback_clock.getTime() >= 0:
    image.draw()
    text.draw()
    win.flip()
