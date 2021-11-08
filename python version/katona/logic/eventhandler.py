"""Special actions for particular events"""
from abc import ABCMeta, abstractmethod
import random

from psychopy import core, visual


class EventHandler(metaclass=ABCMeta):
    @abstractmethod
    def on_event(self, is_event: bool) -> None:
        pass

    @abstractmethod
    def is_in_progress(self) -> bool:
        pass

    @property
    @abstractmethod
    def is_new_event(self):
        pass

    @abstractmethod
    def reset_time(self):
        pass


class SoundFeedback(EventHandler):
    def __init__(self, sound_path: str):
        import psychopy
        psychopy.prefs.hardware['audioLatencyMode'] = 0
        from psychopy.sound.backend_ptb import SoundPTB

        self.sounds_played: int = 0
        self._new_feedback: bool = False
        self._sound: SoundPTB = SoundPTB(value=sound_path)

    def _play(self):
        if not self.is_in_progress():
            self._sound.play()
            self._new_feedback = True
            self.sounds_played += 1

    def is_in_progress(self):
        return self._sound.status == 1

    @property
    def is_new_event(self):
        if self._new_feedback:
            self._new_feedback = False
            return True
        return False

    def on_event(self, is_event):
        raise NotImplementedError("Children (PositiveSoundFeedback, NegativeSoundFeedback) "
                                  "of this class should be used")

    def reset_time(self):
        pass


class PositiveSoundFeedback(SoundFeedback):
    def on_event(self, is_event):
        if is_event:
            self._play()


class NegativeSoundFeedback(SoundFeedback):
    def on_event(self, is_event):
        if not is_event:
            self._play()


class ImageFeedback(EventHandler):
    def __init__(self, window, image_path: str):
        self.image_showed: int = 0
        self._new_feedback: bool = False
        self._image: visual.ImageStim = visual.ImageStim(win=window, image=image_path)
        self._countdown = core.CountdownTimer()

    def _show(self):
        if not self._new_feedback:
            self._countdown.reset(t=1)
            self._new_feedback = True
            self.image_showed += 1
            self._image.autoDraw = True

    def is_in_progress(self):
        to_show = self._countdown.getTime() >= 0
        if not to_show:
            self._image.autoDraw = False

        return to_show

    @property
    def is_new_event(self):
        if self._new_feedback:
            self._new_feedback = False
            return True
        return False

    def on_event(self, is_event):
        raise NotImplementedError("Children of this class (PositiveImageFeedback, NegativeImageFeedback)"
                                  " should be used")

    def reset_time(self):
        pass


class PositiveImageFeedback(ImageFeedback):
    def on_event(self, is_event):
        if is_event:
            self._show()


class NegativeImageFeedback(ImageFeedback):
    def on_event(self, is_event):
        if not is_event:
            self._show()


class TextTimeHandler(EventHandler):
    def __init__(self, window,
                 phrases_list,
                 phrase_time_showed,
                 time_between_phrases,
                 position,
                 width,
                 ):
        self.phrases_showed: int = 0
        self._phrase_time_showed: int = phrase_time_showed
        self._time_between_phrases: int = time_between_phrases
        self._new_feedback: bool = False
        self._text_stimulus: visual.TextStim = visual.TextStim(win=window,
                                                               height=window.size[1] * 0.03,
                                                               color="black",
                                                               pos=position,
                                                               wrapWidth=width)
        self._cover = visual.Rect(win=window,
                                  height=self._text_stimulus.boundingBox[1] * 1.2,
                                  width=self._text_stimulus.boundingBox[0] * 1.2,
                                  fillColor="white",
                                  pos=position,
                                  )

        self._all_phrases = phrases_list
        self._current_phrases = self._reset_phrases()

        self._show_countdown = core.CountdownTimer()
        self._between_countdown = core.CountdownTimer()

    def _reset_phrases(self):
        return random.sample(population=self._all_phrases, k=len(self._all_phrases))

    def _next_phrase(self):
        if not self._current_phrases:
            self._current_phrases = self._reset_phrases()

        self._text_stimulus.text = self._current_phrases.pop()
        self._cover.height = self._text_stimulus.boundingBox[1] * 1.2
        self._cover.width = self._text_stimulus.boundingBox[0] * 1.2

    def _show(self):
        if not self._new_feedback:
            self._next_phrase()
            self._new_feedback = True
            self.phrases_showed += 1
            self._cover.autoDraw = True
            self._text_stimulus.autoDraw = True
            self._show_countdown.reset(t=self._phrase_time_showed)

    def is_in_progress(self) -> bool:
        to_show = self._show_countdown.getTime() >= 0
        if not to_show:
            self._cover.autoDraw = False
            self._text_stimulus.autoDraw = False

        return False

    def on_event(self, is_event: bool) -> None:
        if self._between_countdown.getTime() <= 0:
            self._new_feedback = False
            self._between_countdown.reset(t=self._time_between_phrases)
            self._show()

    @property
    def is_new_event(self):
        return self.phrases_showed

    def reset_time(self):
        self._between_countdown.reset(t=0)


class ZeroHandler(EventHandler):
    def on_event(self, is_event: bool) -> str:
        return ""

    def is_in_progress(self) -> str:
        return ""

    def is_new_event(self):
        return False

    def reset_time(self):
        pass
