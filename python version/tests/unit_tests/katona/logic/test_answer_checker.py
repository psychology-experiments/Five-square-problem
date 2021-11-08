import random

import pytest

from katona.logic.essential import AnswerChecker
from katona.logic.movement import MousePressEvent


class ClickEventFactory:
    start_event = "stick chosen"
    finish_event = "stick placed"

    def __init__(self, solutions: dict, grid, movable_elements):
        self._solutions = solutions
        self._grid = grid
        self._movable_elements = movable_elements

        self._useless_grid = self._find_useless_positions()
        self._useless_movables = self._find_useless_movable_elements()

        self._not_used_solutions = self._create_not_used_solutions()
        self._not_used_useless_grid = list(self._useless_grid)
        self._not_used_movables = list(self._useless_movables)

    def _create_not_used_solutions(self):
        not_used_solutions = {key: {} for key in self._solutions.keys()}

        for solution in self._solutions:
            for part in self._solutions[solution]:
                not_used_solutions[solution][part] = list(self._solutions[solution][part])

        # print(self._solutions)
        # print(not_used_solutions)
        return not_used_solutions

    def _find_useless_movable_elements(self):
        start_solutions = []
        for solution in self._solutions.values():
            start_solutions.extend(solution["sticks"])

        solution_elements = set(start_solutions)

        return tuple(set(self._movable_elements) - solution_elements)

    def _find_useless_positions(self):
        useful_grid_elements = []
        for positions_groups in self._solutions.values():
            for position_type in positions_groups:
                useful_grid_elements.extend(position_type)

        return tuple(set(DEFAULT_GRID) - set(useful_grid_elements))

    def generate_events(self,
                        correctness,
                        solution_types=None):
        start_time = 0.1

        generated_events = {"start": [],
                            "finish": [],
                            }

        if solution_types is None:
            solution_types = [None] * len(correctness)

        for (correct_start, correct_finish), solution_type in zip(correctness, solution_types):
            chosen_stick, placed_to = self._generate_start_event(correct_start, solution_type)
            current_time = random.uniform(start_time, start_time + random.uniform(1, 5))
            start_time = current_time
            generated_start_event = MousePressEvent(self.start_event, chosen_stick, placed_to, current_time)

            placed_to = self._generate_finish_event(correct_start, solution_type)
            current_time = random.uniform(start_time, start_time + random.uniform(1, 5))
            start_time = current_time
            generated_finish_event = MousePressEvent(self.finish_event, chosen_stick, placed_to, current_time)

            generated_events["start"].append(generated_start_event)
            generated_events["finish"].append(generated_finish_event)

        self._reset_to_default()
        return generated_events["start"], generated_events["finish"]

    def _reset_to_default(self):
        self._not_used_solutions = self._create_not_used_solutions()
        self._not_used_useless_grid = list(self._useless_grid)
        self._not_used_movables = list(self._useless_movables)
        random.shuffle(self._not_used_movables)

    def _generate_start_event(self, correct, solution_type):
        if correct:
            if solution_type is not None:
                stick = self._not_used_solutions[solution_type]["sticks"].pop()
            else:
                solution_type_start = random.choice(list(self._solutions.keys()))
                stick = self._not_used_solutions[solution_type_start]["sticks"].pop()
            chosen_stick = stick
        else:
            chosen_stick = self._not_used_movables.pop()

        placed_to = chosen_stick

        return chosen_stick, placed_to

    def _generate_finish_event(self, correct, solution_type):
        if correct:
            if solution_type is not None:
                placed_to = self._not_used_solutions[solution_type]["positions"].pop()
            else:
                solution_type_finish = random.choice(list(self._solutions.keys()))
                placed_to = self._not_used_solutions[solution_type_finish]["positions"].pop()
        else:
            placed_to = self._not_used_useless_grid.pop()

        return placed_to


DEFAULT_SOLUTION = {'left': {'sticks': ((10, 5), (9, 4), (11, 4)),
                             'positions': ((10, 3), (9, 3), (11, 3))},
                    'right': {'sticks': ((10, 6), (9, 6), (11, 6)),
                              'positions': ((10, 8), (9, 7), (11, 7))},
                    'up': {'sticks': ((9, 5), (8, 5), (8, 6)),
                           'positions': ((6, 5), (5, 5), (6, 6))},
                    'down': {'sticks': ((11, 5), (12, 5), (12, 6)),
                             'positions': ((14, 5), (15, 5), (14, 6))}}

grid_horizontal_idx = [(row, col)
                       for col in range(1, 10)
                       for row in range(1, 20, 2)
                       ]
grid_vertical_idx = [(row, col)
                     for col in range(1, 11)
                     for row in range(2, 19, 2)
                     ]

DEFAULT_GRID = grid_horizontal_idx + grid_vertical_idx
DEFAULT_GRID.sort()

MOVABLE_ELEMENTS = ((9, 4), (10, 4), (11, 4), (8, 5), (7, 5),
                    (8, 6), (10, 5), (9, 5), (11, 5), (10, 6),
                    (9, 6), (10, 7), (11, 6), (12, 5), (13, 5),
                    (12, 6))

click_factory = ClickEventFactory(solutions=DEFAULT_SOLUTION,
                                  grid=DEFAULT_GRID,
                                  movable_elements=MOVABLE_ELEMENTS)


@pytest.fixture()
def default_answer_checker():
    yield AnswerChecker(DEFAULT_SOLUTION)


class TestAnswerChecker:
    def test_three_utterly_wrong_moves_return_false(self, default_answer_checker):
        start_clicks, finish_clicks = click_factory.generate_events(correctness=[[False, False],
                                                                                 [False, False],
                                                                                 [False, False],
                                                                                 ])

        result = []
        for start_click, finish_click in zip(start_clicks, finish_clicks):
            default_answer_checker.is_approach_solution(start_click)
            result.append(default_answer_checker.
                          is_approach_solution(finish_click))

        message = f"Three utterly wrong moves should return 3 False, but got {result} instead"
        assert not any(result), message

    def test_three_start_right_placed_wrong_moves_return_false(self, default_answer_checker):
        start_clicks, finish_clicks = click_factory.generate_events(correctness=[[True, False],
                                                                                 [True, False],
                                                                                 [True, False],
                                                                                 ],
                                                                    solution_types=["up", "up", "up"])

        result = []
        for start_click, finish_click in zip(start_clicks, finish_clicks):
            default_answer_checker.is_approach_solution(start_click)
            result.append(default_answer_checker.
                          is_approach_solution(finish_click))

        message = f"Three start right placed wrong moves should return 3 False," \
                  f" but got {result} instead"
        assert not any(result), message

    def test_three_start_wrong_placed_right_moves_return_false(self, default_answer_checker):
        start_clicks, finish_clicks = click_factory.generate_events(correctness=[[False, True],
                                                                                 [False, True],
                                                                                 [False, True],
                                                                                 ],
                                                                    solution_types=["up", "up", "up"])

        result = []
        for start_click, finish_click in zip(start_clicks, finish_clicks):
            default_answer_checker.is_approach_solution(start_click)
            result.append(default_answer_checker.
                          is_approach_solution(finish_click))

        message = f"Three start right placed wrong moves should return 3 False," \
                  f" but got {result} instead"
        assert not any(result), message

    def test_right_return_right_from_other_solution_sequence_of_moves(self, default_answer_checker):
        start_clicks = (("stick chosen", 1.28, DEFAULT_SOLUTION["down"]["sticks"][0]),
                        ("stick chosen", 5.87, DEFAULT_SOLUTION["down"]["positions"][0]),
                        ("stick chosen", 9.87, DEFAULT_SOLUTION["right"]["sticks"][0]),
                        )
        finish_clicks = (("stick placed", 2.28, DEFAULT_SOLUTION["down"]["positions"][0]),
                         ("stick placed", 6.87, DEFAULT_SOLUTION["down"]["sticks"][0]),
                         ("stick placed", 10.87, DEFAULT_SOLUTION["right"]["positions"][0]),
                         )

        result = []
        for start_click, finish_click in zip(start_clicks, finish_clicks):
            default_answer_checker.is_approach_solution(start_click)
            result.append(default_answer_checker.
                          is_approach_solution(finish_click))

        expect = [True, False, False]
        actual = result
        message = f"Second solution should not be accepted as correct third move" \
                  f" stick return also is wrong thus results should be {expect}," \
                  f" but got {result} instead"
        assert expect == actual, message

    def test_right_wrong_wrong_sequence_of_moves(self, default_answer_checker):
        start_clicks = (("stick chosen", 1.28, DEFAULT_SOLUTION["down"]["sticks"][0]),
                        ("stick chosen", 4.28, DEFAULT_SOLUTION["down"]["sticks"][1]),
                        ("stick chosen", 8.28, DEFAULT_SOLUTION["down"]["sticks"][2]),
                        )
        finish_clicks = (("stick placed", 2.28, DEFAULT_SOLUTION["down"]["positions"][0]),
                         ("stick placed", 6.87, DEFAULT_SOLUTION["left"]["positions"][0]),
                         ("stick placed", 10.87, DEFAULT_SOLUTION["right"]["positions"][0]),
                         )

        result = []
        for start_click, finish_click in zip(start_clicks, finish_clicks):
            default_answer_checker.is_approach_solution(start_click)
            result.append(default_answer_checker.
                          is_approach_solution(finish_click))

        expect = [True, False, False]
        actual = result
        message = f"Right, wrong, wrong moves should return {expect}, but return {actual}"
        assert expect == actual, message

    def test_wrong_right_wrong_sequence_of_moves(self, default_answer_checker):
        start_clicks = (("stick chosen", 1.28, DEFAULT_SOLUTION["up"]["sticks"][0]),
                        ("stick chosen", 4.28, DEFAULT_SOLUTION["up"]["sticks"][1]),
                        ("stick chosen", 8.28, DEFAULT_SOLUTION["up"]["sticks"][2]),
                        )
        finish_clicks = (("stick placed", 2.28, DEFAULT_SOLUTION["down"]["positions"][0]),
                         ("stick placed", 6.87, DEFAULT_SOLUTION["up"]["positions"][0]),
                         ("stick placed", 10.87, DEFAULT_SOLUTION["right"]["positions"][0]),
                         )

        result = []
        for start_click, finish_click in zip(start_clicks, finish_clicks):
            default_answer_checker.is_approach_solution(start_click)
            result.append(default_answer_checker.
                          is_approach_solution(finish_click))

        expect = [False, True, False]
        actual = result
        message = f"Wrong, right, wrong moves should return {expect}, but return {actual}"
        assert expect == actual, message

    def test_wrong_wrong_right_sequence_of_moves(self, default_answer_checker):
        start_clicks = (("stick chosen", 1.28, DEFAULT_SOLUTION["left"]["sticks"][0]),
                        ("stick chosen", 4.28, DEFAULT_SOLUTION["left"]["sticks"][1]),
                        ("stick chosen", 8.28, DEFAULT_SOLUTION["left"]["sticks"][2]),
                        )
        finish_clicks = (("stick placed", 2.28, DEFAULT_SOLUTION["down"]["positions"][0]),
                         ("stick placed", 6.87, DEFAULT_SOLUTION["up"]["positions"][0]),
                         ("stick placed", 10.87, DEFAULT_SOLUTION["left"]["positions"][0]),
                         )

        result = []
        for start_click, finish_click in zip(start_clicks, finish_clicks):
            default_answer_checker.is_approach_solution(start_click)
            result.append(default_answer_checker.
                          is_approach_solution(finish_click))

        expect = [False, False, True]
        actual = result
        message = f"Right, wrong, wrong moves should return {expect}, but return {actual}"
        assert expect == actual, message

    def test_wrong_right_right_sequence_of_moves(self, default_answer_checker):
        start_clicks = (("stick chosen", 1.28, DEFAULT_SOLUTION["left"]["sticks"][0]),
                        ("stick chosen", 4.28, DEFAULT_SOLUTION["right"]["sticks"][1]),
                        ("stick chosen", 8.28, DEFAULT_SOLUTION["right"]["sticks"][2]),
                        )
        finish_clicks = (("stick placed", 2.28, DEFAULT_SOLUTION["down"]["positions"][0]),
                         ("stick placed", 6.87, DEFAULT_SOLUTION["right"]["positions"][0]),
                         ("stick placed", 10.87, DEFAULT_SOLUTION["right"]["positions"][1]),
                         )

        result = []
        for start_click, finish_click in zip(start_clicks, finish_clicks):
            default_answer_checker.is_approach_solution(start_click)
            result.append(default_answer_checker.
                          is_approach_solution(finish_click))

        expect = [False, True, True]
        actual = result
        message = f"Wrong, right, right moves should return {expect}, but return {actual}"
        assert expect == actual, message

    def test_right_wrong_right_sequence_of_moves(self, default_answer_checker):
        start_clicks = (("stick chosen", 1.28, DEFAULT_SOLUTION["left"]["sticks"][0]),
                        ("stick chosen", 4.28, DEFAULT_SOLUTION["right"]["sticks"][1]),
                        ("stick chosen", 8.28, DEFAULT_SOLUTION["left"]["sticks"][2]),
                        )
        finish_clicks = (("stick placed", 2.28, DEFAULT_SOLUTION["left"]["positions"][0]),
                         ("stick placed", 6.87, DEFAULT_SOLUTION["up"]["positions"][0]),
                         ("stick placed", 10.87, DEFAULT_SOLUTION["left"]["positions"][1]),
                         )

        result = []
        for start_click, finish_click in zip(start_clicks, finish_clicks):
            default_answer_checker.is_approach_solution(start_click)
            result.append(default_answer_checker.
                          is_approach_solution(finish_click))

        expect = [True, False, True]
        actual = result
        message = f"Right, wrong, right moves should return {expect}, but return {actual}"
        assert expect == actual, message

    def test_right_right_wrong_sequence_of_moves(self, default_answer_checker):
        start_clicks = (("stick chosen", 1.28, DEFAULT_SOLUTION["up"]["sticks"][0]),
                        ("stick chosen", 4.28, DEFAULT_SOLUTION["up"]["sticks"][1]),
                        ("stick chosen", 8.28, DEFAULT_SOLUTION["down"]["sticks"][2]),
                        )
        finish_clicks = (("stick placed", 2.28, DEFAULT_SOLUTION["up"]["positions"][0]),
                         ("stick placed", 6.87, DEFAULT_SOLUTION["up"]["positions"][2]),
                         ("stick placed", 10.87, DEFAULT_SOLUTION["right"]["positions"][1]),
                         )

        result = []
        for start_click, finish_click in zip(start_clicks, finish_clicks):
            default_answer_checker.is_approach_solution(start_click)
            result.append(default_answer_checker.
                          is_approach_solution(finish_click))

        expect = [True, True, False]
        actual = result
        message = f"Right, wrong, right moves should return {expect}, but return {actual}"
        assert expect == actual, message

    def test_impossibility_of_switching_solution_type_after_first_right_move(self, default_answer_checker):
        start_clicks = (("stick chosen", 1.28, DEFAULT_SOLUTION["up"]["sticks"][0]),
                        ("stick chosen", 4.28, DEFAULT_SOLUTION["left"]["sticks"][1]),
                        )
        finish_clicks = (("stick placed", 2.28, DEFAULT_SOLUTION["up"]["positions"][0]),
                         ("stick placed", 6.87, DEFAULT_SOLUTION["left"]["positions"][2]),
                         )

        result = []
        for start_click, finish_click in zip(start_clicks, finish_clicks):
            default_answer_checker.is_approach_solution(start_click)
            result.append(default_answer_checker.
                          is_approach_solution(finish_click))

        expect = False
        actual = result[1]
        message = f"Solution type cannot be changed after first correct move ({expect})" \
                  f", but checker allowed ({actual})"
        assert expect == actual, message

    def test_impossibility_of_switching_solution_type_after_two_right_moves(self, default_answer_checker):
        start_clicks, finish_clicks = click_factory.generate_events(correctness=[[True, True]] * 3,
                                                                    solution_types=["up", "up", "down"])
        answers = []
        for start_click, finish_click in zip(start_clicks, finish_clicks):
            default_answer_checker.is_approach_solution(start_click)
            result = default_answer_checker.is_approach_solution(finish_click)
            answers.append(result)

        expect = False
        actual = answers[2]
        message = f"Solution type cannot be changed after two consecutive correct moves ({expect})" \
                  f", but checker allowed ({actual})"
        assert expect == actual, message

    def test_up_solution(self, default_answer_checker):
        start_clicks, finish_clicks = click_factory.generate_events(correctness=[[True, True]] * 3,
                                                                    solution_types=["up"] * 3)
        answers = []
        for start_click, finish_click in zip(start_clicks, finish_clicks):
            default_answer_checker.is_approach_solution(start_click)
            result = default_answer_checker.is_approach_solution(finish_click)
            answers.append(result)

        message = f"Correct up solutions do not work, got {answers}"
        assert all(answers), message

    def test_down_solution(self, default_answer_checker):
        start_clicks, finish_clicks = click_factory.generate_events(correctness=[[True, True]] * 3,
                                                                    solution_types=["down"] * 3)
        answers = []
        for start_click, finish_click in zip(start_clicks, finish_clicks):
            default_answer_checker.is_approach_solution(start_click)
            result = default_answer_checker.is_approach_solution(finish_click)
            answers.append(result)

        message = f"Correct down solutions do not work, got {answers}"
        assert all(answers), message

    def test_left_solution(self, default_answer_checker):
        start_clicks, finish_clicks = click_factory.generate_events(correctness=[[True, True]] * 3,
                                                                    solution_types=["left"] * 3)
        answers = []
        for start_click, finish_click in zip(start_clicks, finish_clicks):
            default_answer_checker.is_approach_solution(start_click)
            result = default_answer_checker.is_approach_solution(finish_click)
            answers.append(result)

        message = f"Correct left solutions do not work, got {answers}"
        assert all(answers), message

    def test_right_solution(self, default_answer_checker):
        start_clicks, finish_clicks = click_factory.generate_events(correctness=[[True, True]] * 3,
                                                                    solution_types=["right"] * 3)
        answers = []
        for start_click, finish_click in zip(start_clicks, finish_clicks):
            default_answer_checker.is_approach_solution(start_click)
            result = default_answer_checker.is_approach_solution(finish_click)
            answers.append(result)

        message = f"Correct right solutions do not work, got {answers}"
        assert all(answers), message

    def test_can_switch_and_accept_new_solution(self, default_answer_checker):
        # two right sets of moves generation
        start_clicks, finish_clicks = click_factory.generate_events(correctness=[[True, True]] * 6,
                                                                    solution_types=["up"] * 3 + ["down"] * 3)

        answers = []
        for start_click, finish_click in zip(start_clicks, finish_clicks):
            default_answer_checker.is_approach_solution(start_click)
            result = default_answer_checker.is_approach_solution(finish_click)
            answers.append(result)

        message = f"Should accept all moves as correct, but got {answers}"
        assert all(answers), message


if __name__ == '__main__':
    pytest.main()
