from typing import NamedTuple, List, Optional, Tuple

from psychopy import event, visual

from katona.visual.grid import VisualGridElement

MOUSE_PRESS_INFORMATION = Optional[Tuple[str, float]]
STICK_LIST = List[VisualGridElement]


class MousePressEvent(NamedTuple):
    event: str
    stick: Optional[Tuple[int, int]]
    place: Tuple[int, int]
    press_time: float


class StickMover:
    def __init__(self, window: visual.Window):
        self._mouse: event.Mouse = event.Mouse(win=window)
        self._mouse_pressed: bool = False
        self._last_valid_press: MOUSE_PRESS_INFORMATION = None
        self._grid_position: Optional[Tuple] = None
        self._new_event: bool = False
        self._move_made = False

        self.chosen_stick: Optional[VisualGridElement] = None
        self._chosen_stick_idx: Optional[int] = None
        self._chosen_from_idx: Optional[Tuple[int, int]] = None

    def check_and_execute_moves(self,
                                movable_sticks: STICK_LIST,
                                grid_elements: STICK_LIST
                                ):
        if self._check_single_click():
            if self.chosen_stick is None:
                self._choose_stick(movable_sticks)
                self._taken_from(grid_elements)
            else:
                self._place_stick(grid_elements, movable_sticks)

        if self.chosen_stick is not None:
            self.chosen_stick.visual_element.pos = self._mouse.getPos()
            self._check_and_change_stick_orientation()

    def _choose_stick(self, movable_sticks):
        for idx, stick in enumerate(movable_sticks):
            if self._mouse.isPressedIn(shape=stick.visual_element, buttons=[0]):
                self.chosen_stick = stick
                self._chosen_stick_idx = stick.grid_idx
                break

    def _check_and_change_stick_orientation(self):
        if self._mouse.getWheelRel()[1]:
            if self.chosen_stick.visual_element.ori == 90:
                self.chosen_stick.visual_element.ori = 0
            else:
                self.chosen_stick.visual_element.ori = 90

    def _taken_from(self, grid_elements):
        for grid_element in grid_elements:
            if self._mouse.isPressedIn(shape=grid_element.visual_element, buttons=[0]):
                self._chosen_from_idx = grid_element.grid_idx
                self._save_last_press(mouse_event="stick chosen", grid_position=self._chosen_from_idx)
                break

    def _place_stick(self, grid_elements, movable_sticks):
        chosen_stick_visual = self.chosen_stick.visual_element
        chosen_stick_orientation = chosen_stick_visual.ori

        equal_orientation = (grid_element
                             for grid_element in grid_elements
                             if grid_element.visual_element.ori == chosen_stick_orientation)

        current_mouse_position = self._mouse.getPos()
        for grid_element in equal_orientation:
            visual_grid_element = grid_element.visual_element

            if visual_grid_element.contains(current_mouse_position) and \
                    self._check_grid_is_available(visual_grid_element, movable_sticks):
                chosen_stick_visual.pos = visual_grid_element.pos

                # TODO: переписать так, чтобы сохранялся идентификатор палочки, место откуда и место куда
                self._save_last_press(mouse_event="stick placed",
                                      grid_position=grid_element.grid_idx,
                                      )

                if grid_element.grid_idx != self._chosen_from_idx:
                    self._move_made = True
                    self._chosen_from_idx = None

                self.chosen_stick = None
                self._chosen_stick_idx = None
                break

    def release_stick(self):
        self.chosen_stick = None
        self._chosen_stick_idx = None

    def _check_single_click(self):
        now_mouse_pressed = bool(self._mouse.getPressed()[0])
        if self._mouse_pressed != now_mouse_pressed:
            self._mouse_pressed = now_mouse_pressed
            if now_mouse_pressed:
                return True

    def _check_grid_is_available(self,
                                 grid_element,
                                 movable_sticks):
        grid_pos_x: float
        grid_pos_y: float
        grid_pos_x, grid_pos_y = grid_element.pos
        for stick in movable_sticks:
            if self.chosen_stick is stick:
                continue

            stick_pos_x: float
            stick_pos_y: float
            stick_pos_x, stick_pos_y = stick.visual_element.pos
            if stick_pos_x == grid_pos_x and stick_pos_y == grid_pos_y:
                return False

        return True

    def _save_last_press(self, mouse_event: str,
                         grid_position=None):
        left_button_press_time = self._mouse.getPressed(getTime=True)[1][0]
        self._last_valid_press = (mouse_event, left_button_press_time)
        self._grid_position = grid_position
        self._new_event = True

    def reset_time(self):
        self._mouse.clickReset()

    @property
    def last_click(self):
        if self._new_event:
            mouse_event, left_button_press_time = self._last_valid_press
            grid_pos = self._grid_position
            self._last_valid_press = None
            self._grid_position = None
            self._new_event = False

            click = MousePressEvent(mouse_event, self._chosen_stick_idx, grid_pos, left_button_press_time)
            return click

    @property
    def move_made(self):
        if self._move_made:
            self._move_made = False
            return True
