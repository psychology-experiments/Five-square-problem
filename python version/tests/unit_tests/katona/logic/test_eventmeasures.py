from collections import defaultdict
import random

import pytest

from katona.logic import eventsmeasures


@pytest.fixture()
def empty_impasse_finder_threshold_3():
    return eventsmeasures.ObjectiveImpasseFinder(minimum_data_to_identify=3)


class TestObjectiveImpasseFinder:
    def test_data_of_single_data_addition(self, empty_impasse_finder_threshold_3):
        name, data = "test", 1.25

        storage = defaultdict(list)
        storage[name].append(data)
        expect = storage

        empty_impasse_finder_threshold_3.add_new_data(event_name=name, new_time=data)

        actual = empty_impasse_finder_threshold_3.get_stored_data().stored_data
        message = f"Expect single key-value pair {expect}, got {actual}"
        assert actual == expect, message

    def test_data_of_double_key_data_addition(self, empty_impasse_finder_threshold_3):
        name_1, data_1 = "test_1", 1.33
        name_2, data_2 = "test_2", 0.66

        storage = defaultdict(list)
        storage[name_1].append(data_1)
        storage[name_2].append(data_2)
        expect = storage

        empty_impasse_finder_threshold_3.add_new_data(event_name=name_1, new_time=data_1)
        empty_impasse_finder_threshold_3.add_new_data(event_name=name_2, new_time=data_2)

        actual = empty_impasse_finder_threshold_3.get_stored_data().stored_data
        message = f"Expect two key-value pair {expect}, got {actual}"
        assert actual == expect, message

    def test_data_of_bunch_of_data_addition_without_impasse(self, empty_impasse_finder_threshold_3):
        names = ("first", "second", "third")

        max_value = 100
        data = [[random.uniform(0.1, max_value) for _ in range(random.randint(10, 50))]
                for _ in names]

        for name_data in data:
            name_data.insert(0, max_value * 3)

        storage = defaultdict(list)
        for name, data_list in zip(names, data):
            for data_point in data_list:
                storage[name].append(data_point)
                empty_impasse_finder_threshold_3.add_new_data(event_name=name, new_time=data_point)
        expect = storage

        actual = empty_impasse_finder_threshold_3.get_stored_data().stored_data
        message = f"Expect keys {expect.keys()}, got {actual.keys()}\n"

        for name in names:
            message += f"expect for {name} quantity of values " \
                       f"{len(expect[name])}, got {len(actual[name])}\n"

        assert actual == expect, message

    def test_data_of_bunch_of_data_addition_with_impasse(self, empty_impasse_finder_threshold_3):
        names = ("first", "second", "third")

        data_with_impasse = [[4.64, 4.62, 8.77, 5.42, 0.15, 6.25, 11.11, 13.33, 2.86, 22.22],
                             [32.42, 36.04, 54.23, 78.81, 60.98, 69.27, 56.07],
                             [2.32, 2.93, 1.09, 1.25, 0.70, 6.12, 2.88, 0.25, 0.94, 8.82,
                              9.56, 0.48, 5.32, 1.69, 2.62],
                             ]
        for name, data_list in zip(names, data_with_impasse):
            for data_point in data_list:
                empty_impasse_finder_threshold_3.add_new_data(event_name=name, new_time=data_point)

        data_without_impasse = [[4.64, 4.62, 8.77, 5.42, 0.15, 6.25, 2.86],
                                [32.42, 36.04, 54.23, 60.98, 69.27, 56.07],
                                [2.32, 2.93, 1.09, 1.25, 0.70, 2.88, 0.25, 0.94,
                                 0.48, 1.69, 2.62],
                                ]

        storage = defaultdict(list)
        for name, data_list in zip(names, data_without_impasse):
            for data_point in data_list:
                storage[name].append(data_point)
        expect = storage

        actual = empty_impasse_finder_threshold_3.get_stored_data().stored_data
        message = f"Expect keys {expect.keys()}, got {actual.keys()}\n"

        for name in names:
            message += f"expect for {name} quantity of values " \
                       f"{len(expect[name])}, got {len(actual[name])}\n"

        assert actual == expect, message

    def test_threshold_3_storage_empty(self, empty_impasse_finder_threshold_3):
        name, data = "test", [1.25, 5]

        for data_point in data:
            empty_impasse_finder_threshold_3.add_new_data(event_name=name, new_time=data_point)

        with pytest.raises(KeyError):
            _ = empty_impasse_finder_threshold_3.get_stored_data().current_thresholds[name]

    def test_threshold_8_storage_empty(self):
        name, data = "test", [random.uniform(0.1, 100) for _ in range(7)]

        threshold_8 = eventsmeasures.ObjectiveImpasseFinder(minimum_data_to_identify=8)

        for data_point in data:
            threshold_8.add_new_data(event_name=name, new_time=data_point)

        with pytest.raises(KeyError):
            _ = threshold_8.get_stored_data().current_thresholds[name]

    def test_threshold_value(self, empty_impasse_finder_threshold_3):
        name, data = "test", [1.74, 6.122, 12]

        for data_point in data:
            empty_impasse_finder_threshold_3.add_new_data(event_name=name, new_time=data_point)

        expect = pytest.approx(16.916957519849348)  # mean(data) + stdev(data) * 2
        actual = empty_impasse_finder_threshold_3.get_stored_data().current_thresholds[name]
        message = f"Calculations are not correct: expect {expect}, got {actual:.2f}"

        assert expect == actual, message

    def test_threshold_value_change(self, empty_impasse_finder_threshold_3):
        name, data = "test", [12.2, 1.2, 65.2]

        for data_point in data:
            empty_impasse_finder_threshold_3.add_new_data(event_name=name, new_time=data_point)

        first_expect = pytest.approx(94.6397545290747)  # mean(data) + stdev(data) * 2
        first_actual = empty_impasse_finder_threshold_3.get_stored_data().current_thresholds[name]

        empty_impasse_finder_threshold_3.add_new_data(event_name=name, new_time=31.2)
        second_expect = pytest.approx(83.5540699652589)  # mean(data) + stdev(data) * 2
        second_actual = empty_impasse_finder_threshold_3.get_stored_data().current_thresholds[name]

        expect = [first_expect, second_expect]
        actual = [first_actual, second_actual]
        message = f"Calculations are not correct: expect {expect}, got {actual}"

        assert expect == actual, message

    def test_is_event_true(self, empty_impasse_finder_threshold_3):
        name, data = "test", [12.2, 1.2, 13.2]

        for data_point in data:
            empty_impasse_finder_threshold_3.add_new_data(event_name=name, new_time=data_point)

        expect = True
        actual = empty_impasse_finder_threshold_3.is_event(time=22.19, event_name=name)
        message = "For time 22.19 is_event should be True, but it is False"
        assert expect == actual, message

    def test_is_event_false(self, empty_impasse_finder_threshold_3):
        name, data = "test", [12.2, 1.2, 13.2]

        for data_point in data:
            empty_impasse_finder_threshold_3.add_new_data(event_name=name, new_time=data_point)

        expect = False
        actual = empty_impasse_finder_threshold_3.is_event(time=22.17, event_name=name)
        message = "For time 22.17 is_event should be False, but it is True"
        assert expect == actual, message


if __name__ == '__main__':
    pytest.main(args=["-v"])
