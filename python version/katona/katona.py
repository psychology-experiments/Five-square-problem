from typing import Optional

from psychopy import core, visual

from katona.logic import eventsmeasures
from katona.logic.datasaver import DataSaver
from katona.logic.movement import StickMover
from katona.logic import eventhandler
from katona.logic import essential
from katona.visual import optional
from katona.visual.grid import VisualGrid


class Katona:
    def __init__(self,
                 window: visual.Window,
                 stick_length: float,
                 stick_width: float,
                 field_size: int,
                 grid_color: str,
                 data_fp: str,
                 experiment_info: dict,
                 special_event_finder: str,
                 event_threshold: int = 30,
                 solution=None,
                 time_limit: int = 15,
                 background_color="white",
                 screen_cover_color="white",
                 time_to_cover_grid=None,
                 feedback=None,
                 ):
        self._window = window
        self._clock = core.Clock()
        self._feedback_type = feedback
        self._stop_questioning_stick_color = False
        self._time_limit = time_limit * 60
        self._moves_made = 0
        self._correct_answers = 0
        self.solved: Optional[bool] = None
        self.grid_color = grid_color
        self.grid = VisualGrid(window=window,
                               stick_length=stick_length,
                               stick_width=stick_width,
                               field_size=field_size,
                               grid_color=self.grid_color,
                               )

        self.stick_mover = StickMover(window=window)

        if special_event_finder == "ObjectiveImpasseFinder":
            self._special_event_finder = eventsmeasures.ObjectiveImpasseFinder(
                minimum_data_to_identify=event_threshold)

        self.data_saver = DataSaver(save_folder=data_fp,
                                    experiment_info=experiment_info,
                                    special_event_finder=self._special_event_finder,
                                    )

        button_x_pos = (self.grid.outer_border + window.size[0] / 2) / 2
        self._reset_button = optional.Button(win=window,
                                             event_name="default place",
                                             label_size=40,
                                             label_text="Обновить",
                                             pos=(button_x_pos, 0),
                                             button_enabled=True,
                                             button_color=background_color,
                                             )

        self._impasse_button = optional.Button(win=window,
                                               event_name="impasse",
                                               label_size=40,
                                               label_text="Я застрял",
                                               pos=(-button_x_pos, 0),
                                               button_enabled=True,
                                               button_color=background_color,
                                               )

        self._scree_cover = optional.ScreenCover(window=window,
                                                 start_position=(0, self.grid.outer_border),
                                                 size=self.grid.outer_border,
                                                 cover_color=screen_cover_color,
                                                 grow_rate=0.5,
                                                 time_to_cover=time_to_cover_grid)

        solution_absolute_idx = {}
        for solution_name in solution:
            solution_absolute_idx[solution_name] = {}
            for solution_info_name, solution_info in solution[solution_name].items():
                solution_absolute_idx[solution_name][solution_info_name] = \
                    tuple([self.grid.extract_grid_element_by_grid_idx(grid_idx).grid_idx
                           for grid_idx in solution_info])

        self._answer_checker = essential.AnswerChecker(solution_absolute_idx)

        if feedback == "sound":
            sound_path = f"sounds/{experiment_info['feedback.type']}.wav"

            if experiment_info['feedback.type'] == "positive":
                self._event_feedback = eventhandler.PositiveSoundFeedback(sound_path)
            else:
                self._event_feedback = eventhandler.NegativeSoundFeedback(sound_path)
        elif feedback == "image":
            image_path = f"images/{experiment_info['feedback.type']}.jpg"

            if experiment_info['feedback.type'] == "positive":
                self._event_feedback = eventhandler.PositiveImageFeedback(window, image_path)
            else:
                self._event_feedback = eventhandler.NegativeImageFeedback(window, image_path)
        elif feedback == "phrases":
            import csv
            phrases_fp = "text/phrases.csv"
            column = experiment_info['feedback.type']

            phrases = []
            with open(file=phrases_fp, mode="r", encoding="utf-8") as csv_file:
                phrases_file = csv.DictReader(f=csv_file)
                for row in phrases_file:
                    phrases.append(row[column])

            max_width = window.size[0] / 2 - self.grid.outer_border
            self._event_feedback = eventhandler.TextTimeHandler(window,
                                                                phrases_list=phrases,
                                                                phrase_time_showed=10,
                                                                time_between_phrases=60,
                                                                position=(-button_x_pos, 0),
                                                                width=max_width * 0.8)

            self._impasse_button = optional.FakeButton()
        elif feedback is None:
            self._event_feedback = eventhandler.ZeroHandler()
            self._color_group = experiment_info['feedback.type']
            self._chosen_colors = {}

    def create_movable_sticks(self,
                              grid_indexes,
                              movable_stick_color,
                              color_positions: str = "all"):

        # сохранить информацию о цветах палочек, если условие с окрашиванием палочек
        if isinstance(self._event_feedback, eventhandler.ZeroHandler):
            self._chosen_colors[movable_stick_color[1]] = f"neutral.{movable_stick_color[1]}"

            if self._color_group == "important likable":
                self._chosen_colors[movable_stick_color[0]] = f"like.{movable_stick_color[0]}"
                self._chosen_colors[movable_stick_color[2]] = f"dislike.{movable_stick_color[2]}"
            elif self._color_group == "unimportant likable":
                self._chosen_colors[movable_stick_color[2]] = f"like.{movable_stick_color[2]}"
                self._chosen_colors[movable_stick_color[0]] = f"dislike.{movable_stick_color[0]}"
            elif self._color_group == "control":
                self._chosen_colors[movable_stick_color[0]] = f"like.{movable_stick_color[0]}"
                self._chosen_colors[movable_stick_color[2]] = f"dislike.{movable_stick_color[2]}"
                movable_stick_color = movable_stick_color[1]

        self.grid.create_movable_sticks(grid_indexes=grid_indexes,
                                        movable_stick_color=movable_stick_color,
                                        color_positions=color_positions)

    def run(self):
        if self._clock.getTime() >= self._time_limit:
            self.solved = False
            self.data_saver.save_failure_to_solve(9999)
            return

        if self._event_feedback.is_in_progress():
            return

        if self._moves_made != 3:
            self.stick_mover.check_and_execute_moves(movable_sticks=self.grid.movable_elements,
                                                     grid_elements=self.grid.grid_elements)
            if not self._stop_questioning_stick_color and \
                    self.stick_mover.chosen_stick is not None:
                stick_color_hex = getattr(self.stick_mover.chosen_stick.visual_element, "fillColor")
                stick_color_like = self._chosen_colors[stick_color_hex]
                self.data_saver.get_stick_color(stick_color_like)
                self._stop_questioning_stick_color = True

        mouse_last_click = self.stick_mover.last_click

        solving = self._answer_checker.is_approach_solution(mouse_last_click)

        if self._feedback_type == "phrases":
            self._event_feedback.on_event(solving)

        if not self.stick_mover.move_made:
            self.data_saver.get_click(mouse_last_click)
        else:
            self._correct_answers += solving
            self._event_feedback.on_event(solving)
            self.data_saver.get_event_feedback(self._event_feedback.is_new_event())
            self.data_saver.get_click(mouse_last_click)
            self._moves_made += 1
            if self._correct_answers == 3:
                self.solved = True
            self._stop_questioning_stick_color = False

        if self.stick_mover.chosen_stick is None and self._reset_button.button_pressed():
            self.data_saver.get_click(self._reset_button.last_click)
            self.stick_mover.release_stick()
            self.return_to_default()
            self._answer_checker.reset()
            self._scree_cover.resize()

        if self._impasse_button.button_pressed():
            self.data_saver.get_click(self._impasse_button.last_click)

    def get_moves_made(self):
        return self._moves_made

    def return_to_default(self):
        self._moves_made = 0
        self._correct_answers = 0
        self.grid.return_to_default_positions()

    def start_time(self):
        self.stick_mover.reset_time()
        self._reset_button.reset_time()
        self._impasse_button.reset_time()
        self._clock.reset()
        self._event_feedback.reset_time()

    def draw(self):
        self._reset_button.draw()
        self._impasse_button.draw()
        self.grid.draw()

        if self._moves_made == 3 and not self.solved and not self._event_feedback.is_in_progress():
            self._scree_cover.draw()


class TrainingOnGrid:
    def __init__(self,
                 window: visual.Window,
                 stick_length: float,
                 stick_width: float,
                 field_size: int,
                 grid_color: str,
                 movable_stick_color: str,
                 ):
        self.training_finished = False
        self.grid_color = grid_color
        self.movable_stick_color = movable_stick_color
        self._window = window
        target_grid_positions = ((7,), (1, 15), (),)
        self._target_grid_positions = iter(target_grid_positions)
        self._target_grid_marks = []
        self._current_target_grid_positions = None
        self.grid = VisualGrid(window=self._window,
                               stick_length=stick_length,
                               stick_width=stick_width,
                               field_size=field_size,
                               grid_color=self.grid_color,
                               )
        self._training_sticks_position = iter((((0, -1),), ((0, 0),), ((0, 1), (0, 2))))
        self._training_sticks_marks = []
        conditions = (self.first_condition, self.second_condition, lambda _, __: None)
        self._conditions = iter(conditions)
        self._current_condition = None

        training_messages = ("Нажмите на палочку c точкой и поставьте её в ячейку с крестиком",
                             "Палочки можно вращать, для этого возьмите её и покрутите колесо мыши.\n"
                             "Теперь расположите палочки с точками в ячейках с крестиками.",
                             "Кроме уже сделаного на экране могут быть кнопки, на них нужно просто нажимать.\n"
                             "Нажмите на кнопку на экране.")
        self._training_messages = iter(training_messages)

        self.stick_mover = StickMover(window=self._window)
        text_y_pos = (self.grid.outer_border + window.size[1] / 2) / 2
        self._training_instruction = visual.TextStim(win=self._window,
                                                     text="",
                                                     pos=(0, text_y_pos),
                                                     color="black",
                                                     height=39,
                                                     wrapWidth=self._window.size[0],
                                                     )

        button_y_pos = -text_y_pos
        self._training_button = optional.Button(win=self._window,
                                                event_name="training",
                                                label_size=40,
                                                label_text="Нажми меня",
                                                pos=(0, button_y_pos),
                                                button_enabled=False)

        self._last_animation = ((row, col) for col in range(-2, 3)
                                for row in range(-5, 6, 2))
        self._last_animation_created = False

        self._clock = core.Clock()
        self._last_animation_update = 0

        self._next_training_stage()

    @staticmethod
    def first_condition(movable, grid):
        movable_x, movable_y = movable[0].visual_element.pos
        grid_x, grid_y = grid[7].visual_element.pos
        return movable_x == grid_x and movable_y == grid_y

    @staticmethod
    def second_condition(movable, grid):
        wanted_positions = (tuple(grid[1].visual_element.pos), tuple(grid[15].visual_element.pos))
        first_stick_in_place = tuple(movable[0].visual_element.pos) in wanted_positions
        second_stick_in_place = tuple(movable[1].visual_element.pos) in wanted_positions
        return first_stick_in_place and second_stick_in_place

    def _next_training_stage(self):
        self._target_grid_marks = []

        add_sticks = next(self._training_sticks_position)
        self.grid.create_movable_sticks(grid_indexes=add_sticks,
                                        movable_stick_color=self.movable_stick_color)

        for grid_element in self.grid.movable_elements:
            stick_pos = grid_element.visual_element.pos

            circle = visual.Circle(win=self._window,
                                   fillColor="yellow",
                                   pos=stick_pos,
                                   size=7)
            self._training_sticks_marks.append(circle)

        if self._current_target_grid_positions is not None:
            self.grid.set_grid_color(self.grid_color)
            # TODO: remove old way
            # for grid_element_idx in self._current_target_grid_positions:
            #     self.grid.grid_elements[grid_element_idx].visual_element.color = self.grid_color

        self._current_target_grid_positions = next(self._target_grid_positions)
        for grid_element_idx in self._current_target_grid_positions:
            # self.grid.grid_elements[grid_element_idx].visual_element.color = "red"
            target_pos = self.grid.grid_elements[grid_element_idx].visual_element.pos
            cross = visual.ShapeStim(win=self._window,
                                     vertices="cross",
                                     fillColor="yellow",
                                     pos=target_pos,
                                     size=12,
                                     ori=45)
            self._target_grid_marks.append(cross)

        self._training_instruction.text = next(self._training_messages)
        self._current_condition = next(self._conditions)
        if len(self.grid.movable_elements) == 4:
            self._training_button.buttonEnabled = True

        self.grid.return_to_default_positions()

    def _is_training_stage_completed(self):
        if self._training_button.button_pressed():
            self._training_button.buttonEnabled = False
            self.training_finished = True

            self.grid.movable_elements = []

            self._training_sticks_marks = []

            self._training_instruction.text = "Тренировка закончена. Чтобы продолжить нажмите пробел"

        return self._current_condition(self.grid.movable_elements, self.grid.grid_elements)

    def run(self):
        self.stick_mover.check_and_execute_moves(movable_sticks=self.grid.movable_elements,
                                                 grid_elements=self.grid.grid_elements)

        if self._is_training_stage_completed():
            self._next_training_stage()

    def draw(self):
        if not self._last_animation_created and self.training_finished:
            try:
                if self._clock.getTime() - self._last_animation_update >= 0.1:
                    self._last_animation_update = self._clock.getTime()
                    idx_of_grid_for_stick = (next(self._last_animation),)
                    self.grid.create_movable_sticks(grid_indexes=idx_of_grid_for_stick,
                                                    movable_stick_color="brown")
            except StopIteration:
                self._last_animation_created = True

        if self._training_button.buttonEnabled:
            self._training_button.draw()

        # TODO: remove old way
        # for grid_element in self.grid.grid_elements:
        #     grid_element.visual_element.draw()
        self.grid.draw()

        for target_mark in self._target_grid_marks:
            target_mark.draw()

        positions = []
        for movable_element in self.grid.movable_elements:
            movable_element.visual_element.draw()

            pos = movable_element.visual_element.pos
            positions.append(pos)

        for pos, stick_mark in zip(positions, self._training_sticks_marks):
            stick_mark.pos = pos
            stick_mark.draw()

        self._training_instruction.draw()
