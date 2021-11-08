from os import path
from typing import Optional

from psychopy import data

from katona.logic import eventsmeasures
from katona.logic import movement

POSSIBLE_EVENTS = {"stick chosen": "move.start",
                   "stick placed": "move.end",
                   "default place": "reset.problem",
                   "impasse": "s.impasse"}
END_OF_MOVE = ("move.end", "reset.problem")
FINDER_SPECIAL_EVENT = ("move.start", "move.end")


class DataSaver:
    def __init__(self,
                 save_folder: str,
                 experiment_info: dict,
                 special_event_finder: Optional[eventsmeasures.ObjectiveImpasseFinder]):

        file_path = path.join(save_folder, f"{experiment_info['Испытуемый']}_{data.getDateStr()}")
        self._data_saver = data.ExperimentHandler(dataFileName=file_path,
                                                  savePickle=False,
                                                  extraInfo=experiment_info,
                                                  )
        self._data_saver.dataNames = ["move.start", "move.end", "reset.problem",
                                      "o.impasse.move.start", "o.impasse.move.end",
                                      "s.impasse", "feedback", "feedback.type",
                                      "stick.idx", "move.start.place", "move.end.place",
                                      "stick.color"
                                      ]

        self._special_event_finder = special_event_finder

    def get_saved_file_name(self):
        return self._data_saver.dataFileName

    def save_failure_to_solve(self, time):
        self._data_saver.addData(name=f"move.end", value=time)

    def get_click(self, click):
        if click is not None:
            if isinstance(click, movement.MousePressEvent):
                event, stick, place, time = click
                self.save_event(event, time, place, stick)
            else:
                event, time, place = click
                self.save_event(event, time, place)

    def get_stick_color(self, stick_color: str):
        self._data_saver.addData(name="stick.color", value=stick_color)

    def get_event_feedback(self, feedback):
        self._data_saver.addData("feedback", int(feedback))

    def save_event(self, event, time, place, stick=None):
        csv_event = POSSIBLE_EVENTS[event]

        if self._special_event_finder is not None and csv_event in FINDER_SPECIAL_EVENT:
            is_special_event = self._special_event_finder.is_event(time, csv_event)
            self._special_event_finder.add_new_data(event_name=csv_event, new_time=time)
            if is_special_event is not None:
                self._data_saver.addData(name=f"o.impasse.{csv_event}", value=int(is_special_event))

        self._data_saver.addData(name=csv_event, value=time)

        if csv_event in ("move.start", "move.end"):
            if stick is not None:
                self._data_saver.addData(name="stick.idx", value=stick)
            self._data_saver.addData(name=f"{csv_event}.place", value=place)

        if csv_event in END_OF_MOVE:
            self._data_saver.nextEntry()
