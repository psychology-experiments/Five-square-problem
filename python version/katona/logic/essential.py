from typing import Dict, Optional, Tuple

SOLUTION_PATTERN = Dict[str, Dict[str, Tuple[Tuple[int, int], ...]]]


class AnswerChecker:
    def __init__(self, solution: SOLUTION_PATTERN, reset_after=3):
        self.right_positions = solution
        self.current_solution_name: Optional[str] = None
        self.correct_sticks: Optional[list] = None
        self.correct_position: Optional[list] = None

        self.current_stick = None
        self.placed_idx = None

        self._checked_solution_type: bool = False
        self._evaluation_counter: int = 0
        self._reset_after: int = reset_after

    def _is_move_end(self, click):
        mouse_event = self._extract_click_info(click)
        return mouse_event == "stick placed"

    def _extract_click_info(self, click):
        mouse_event = click.event
        grid_pos = click.place

        if mouse_event == "stick chosen":
            self.current_stick = grid_pos
        elif mouse_event == "stick placed":
            self.placed_idx = grid_pos
        return mouse_event

    def _is_first_solution_move_stick_chosen(self):
        for solution_name, solution_info in self.right_positions.items():
            for stick in solution_info["sticks"]:

                if stick == self.current_stick:
                    self.current_solution_name = solution_name
                    self.correct_sticks = frozenset(
                        self.right_positions[solution_name]["sticks"])
                    self.correct_position = frozenset(
                        self.right_positions[solution_name]["positions"])
                    return

    def _reset_state(self, move_correctness):
        self._reset_move_info()

        if self._checked_solution_type and not move_correctness:
            self._reset_solution_type_info()
        self._checked_solution_type = False

        if self._evaluation_counter == self._reset_after:
            self._reset_attempt_info()

    def _reset_move_info(self):
        self.current_stick = None
        self.placed_idx = None

    def _reset_solution_type_info(self):
        self._checked_solution_type = False
        self.current_solution_name = None
        self.correct_sticks: Optional[list] = None
        self.correct_position: Optional[list] = None

    def _reset_attempt_info(self):
        self._evaluation_counter = 0
        self._reset_solution_type_info()

    def _is_placed_correctly(self):
        if self.current_solution_name is None:
            return False

        correct_stick_chosen = self.current_stick in self.correct_sticks
        correct_position_chosen = self.placed_idx in self.correct_position

        return correct_stick_chosen and correct_position_chosen

    def reset(self):
        self._reset_move_info()
        self._reset_attempt_info()

    def is_approach_solution(self, click):
        if click is None or not self._is_move_end(click):
            return

        self._evaluation_counter += 1

        if self.current_solution_name is None:
            self._checked_solution_type = True
            self._is_first_solution_move_stick_chosen()

        move_correctness = self._is_placed_correctly()
        self._reset_state(move_correctness)
        return move_correctness
