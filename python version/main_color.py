from psychopy import core, gui, visual
from psychopy.hardware import keyboard

from katona.katona import Katona, TrainingOnGrid
from katona.visual.color_dialog import ColorDialog


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
TEST = False
SKIP_TRAINING = False
FULL_SCREEN = True

# Global variables
BACKGROUND_COLOR = "#E0FFFF"
SCREEN_COVER_COLOR = "#D8BFD8"
GRID_COLOR = "#E6E6FA"
MOVABLE_STICK_COLOR = "#9b9b9b"
TEXT_COLOR = "black"

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

if not TEST:
    color_questions = [("Выберите цвет, который Вам нравится", "like"),
                       ("Выберите цвет, который Вам не нравится", "dislike")]
    color_dialog = ColorDialog(color_questions, return_order=["like", "dislike"])
    like_color, dislike_color = color_dialog.chosen_colors
else:
    like_color, dislike_color = [(None, "#FF0000"), (None, "#00FF00")]

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
    Группа=["1", "2", "3"]  # control experiment influence. The names chosen to hide real influence
)

if not TEST:
    dlg = gui.DlgFromDict(dictionary=experiment_info,
                          title="Информация об эксперименте",
                          sortKeys=False)
    if not dlg.OK:
        core.quit()

# decoding of experiment info
if experiment_info["Группа"] == "1":
    experiment_info["feedback.type"] = "important likable"
    colors_order = [like_color[1], MOVABLE_STICK_COLOR, dislike_color[1]]
elif experiment_info["Группа"] == "2":
    experiment_info["feedback.type"] = "unimportant likable"
    colors_order = [dislike_color[1], MOVABLE_STICK_COLOR, like_color[1]]
elif experiment_info["Группа"] == "3":
    experiment_info["feedback.type"] = "control"
    colors_order = [like_color[1], MOVABLE_STICK_COLOR, dislike_color[1]]
else:
    raise ValueError(f"Группа должна быть 1, 2 или 3. А была {experiment_info['Группа']}")
del experiment_info["Группа"]

# Components preparation of the experiment
win = visual.Window(size=(1920, 1080),
                    units="pix",
                    color=BACKGROUND_COLOR,
                    fullscr=FULL_SCREEN,
                    monitor="Dell")

# KATONA
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
                feedback=None,
                )

katona.create_movable_sticks(grid_indexes=MOVABLE_STICKS_INDEXES,
                             movable_stick_color=colors_order,
                             color_positions="right")

training_session = TrainingOnGrid(window=win,
                                  stick_length=40.0,
                                  stick_width=15.0,
                                  field_size=5,
                                  grid_color=GRID_COLOR,
                                  movable_stick_color=MOVABLE_STICK_COLOR,
                                  )

instruction_text = visual.TextStim(win=win,
                                   color=TEXT_COLOR,
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

# win.recordFrameIntervals = True
saved_katona_image = None
while True:
    quit_key = kb.getKeys(keyList=["escape"])

    if quit_key:
        core.quit()

    katona.run()
    katona.draw()

    if saved_katona_image is None:
        saved_katona_image = win.getMovieFrame(buffer="back")

    win.flip()

    if katona.solved is not None:
        kb.clearEvents()
        break

# Опрос о цвете палочек
saved_katona_image = saved_katona_image.crop(box=(640, 240, 1240, 840))
katona_image = visual.ImageStim(win=win, image=saved_katona_image)
color_questions = visual.TextStim(win,
                                  text="Ответьте на вопросы экспериментатора",
                                  pos=(0, win.size[1] / 2 * 0.8),
                                  color="black",
                                  height=40)

while True:
    katona_image.draw()
    color_questions.draw()
    win.flip()

    if kb.getKeys(["space"]):
        break

    quit_key = kb.getKeys(keyList=["escape"])

    if quit_key:
        core.quit()

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
