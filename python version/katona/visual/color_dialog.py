from functools import partial
from random import shuffle
from typing import List, Tuple

import tkinter
from tkinter import colorchooser


class ColorDialog:
    def __init__(self, color_info: List[Tuple[str, str]], return_order: List[str]):
        self._root = tkinter.Tk()

        shuffle(color_info)
        self._color_type_order = {color_type: idx for idx, (_, color_type) in enumerate(color_info)}
        self._return_order = return_order
        color_questions = [question for question, _ in color_info]

        self._color_questions = color_questions

        self._chosen_colors = []
        self._current_button = 0
        self._buttons = []

        self._prepare_buttons()

        self._root.title("Выбор цветов")
        self._root.geometry("300x200+650+300")
        self._activate_next_button()
        self._root.mainloop()

    def call_color_chooser(self, name):
        _, hex_name = colorchooser.askcolor(color=(23, 77, 75), title=name)
        self._chosen_colors.append((name, hex_name))

        if self._current_button < len(self._buttons):
            self._activate_next_button()
        else:
            self._root.destroy()

    def _prepare_buttons(self):
        for question in self._color_questions:
            button = tkinter.Button(self._root,
                                    text=question,
                                    height=4,
                                    command=partial(self.call_color_chooser, question),
                                    state=tkinter.DISABLED)
            button.pack(side="top")
            self._buttons.append(button)

    def _activate_next_button(self):
        if self._current_button != 0:
            self._buttons[self._current_button - 1].configure(state=tkinter.DISABLED)
            self._buttons[self._current_button].configure(state=tkinter.NORMAL)
        else:
            self._buttons[self._current_button].configure(state=tkinter.NORMAL)

        self._current_button += 1

    @property
    def chosen_colors(self):
        return [self._chosen_colors[self._color_type_order[color_type]]
                for color_type in self._return_order]