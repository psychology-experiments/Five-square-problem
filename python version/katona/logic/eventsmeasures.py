from abc import ABCMeta, abstractmethod
from collections import defaultdict
import statistics
from typing import Dict, DefaultDict, List, NamedTuple, Optional


class TimeEventFinderStorageRepresentation(NamedTuple):
    stored_data: defaultdict
    current_thresholds: dict


class TimeEventFinder(metaclass=ABCMeta):
    @abstractmethod
    def __init__(self, minimum_data_to_identify: int):
        self._minimum_data_to_identify: int = minimum_data_to_identify

    @abstractmethod
    def add_new_data(self, event_name: str, new_time: float) -> None:
        pass

    @abstractmethod
    def is_event(self, time: float, event_name: str) -> bool:
        pass

    @abstractmethod
    def _adjust_threshold(self, event_name: str) -> None:
        pass


class ObjectiveImpasseFinder(TimeEventFinder):
    def __init__(self, minimum_data_to_identify: int):
        super().__init__(minimum_data_to_identify)
        self._data: DefaultDict[str, List[float, ...], ...] = defaultdict(list)
        self._impasse_thresholds: Dict[str, float, ...] = {}

    def add_new_data(self, event_name: str, new_time: float) -> None:
        if not self.is_event(time=new_time, event_name=event_name):
            # TODO: проверить, что не косячит оценщик и добавляет время хода, а не время от начала решения
            self._data[event_name].append(new_time)

        if len(self._data[event_name]) >= self._minimum_data_to_identify:
            self._adjust_threshold(event_name)

    def _adjust_threshold(self, event_name: str):
        event_data: list = self._data[event_name]
        mean: float = statistics.mean(event_data)
        std: float = statistics.stdev(data=event_data, xbar=mean)
        self._impasse_thresholds[event_name] = mean + std * 2

    def is_event(self, time: float, event_name: str) -> Optional[bool]:
        if len(self._data[event_name]) >= self._minimum_data_to_identify:
            impasse_threshold: float = self._impasse_thresholds[event_name]
            return time > impasse_threshold
        return None

    def get_stored_data(self) -> TimeEventFinderStorageRepresentation:
        return TimeEventFinderStorageRepresentation(self._data,
                                                    self._impasse_thresholds)
