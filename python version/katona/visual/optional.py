from psychopy import event, visual


class Button(visual.ButtonStim):
    def __init__(self,
                 win,
                 event_name,
                 border_thickness=.003,
                 label_size=0.03,
                 pos=(0, 0),
                 label_text="text for button",
                 text_color='blue',
                 border_color='blue',
                 button_color='white',
                 button_enabled=False,
                 ):
        # local variables
        super(Button, self).__init__(win)

        self.win = win
        self._event = event_name
        self.borderThickness = border_thickness
        self.labelSize = label_size
        self.pos = pos
        self.labelText = label_text
        self.textColor = text_color
        self.borderColor = border_color
        self.buttonColor = button_color
        self.buttonEnabled = button_enabled

        self._dragging = False
        self.mouse = event.Mouse()
        self.buttonSelected = False
        self._mouse_pressed = False
        self._last_valid_press = None
        self._new_event = False
        self.buttonItems = []

        self.buttonInnerText = visual.TextStim(self.win, text=self.labelText, color=self.textColor, pos=self.pos,
                                               height=self.labelSize)

        button_x_inner_margin = self.buttonInnerText.boundingBox[0]
        button_x_outer_margin = button_x_inner_margin + border_thickness
        button_y_inner_margin = self.buttonInnerText.boundingBox[1]
        button_y_outer_margin = label_size + border_thickness

        self.buttonInner = visual.Rect(win=win,
                                       width=button_x_inner_margin,
                                       height=button_y_inner_margin,
                                       fillColor=button_color,
                                       pos=self.pos)
        self.buttonBorder = visual.Rect(win=win,
                                        width=button_x_outer_margin,
                                        height=button_y_outer_margin,
                                        fillColor=border_color,
                                        pos=self.pos)

        # self.buttonItems.append(self.buttonBorder)
        self.buttonItems.append(self.buttonInner)
        self.buttonItems.append(self.buttonInnerText)

    def _check_single_click(self):
        now_mouse_pressed = bool(self.mouse.getPressed()[0])
        if self._mouse_pressed != now_mouse_pressed:
            self._mouse_pressed = now_mouse_pressed
            if now_mouse_pressed:
                return True

    def button_pressed(self):
        if self.buttonSelected and self._check_single_click():
            self._save_last_press(mouse_event=self._event)
            return True

    def _save_last_press(self, mouse_event: str):
        left_button_press_time = self.mouse.getPressed(getTime=True)[1][0]
        self._last_valid_press = (mouse_event, left_button_press_time)
        self._new_event = True

    def reset_time(self):
        self.mouse.clickReset()

    @property
    def last_click(self):
        if self._new_event:
            mouse_event, left_button_press_time = self._last_valid_press
            self._last_valid_press = None
            self._new_event = False
            return mouse_event, left_button_press_time, self._event


class FakeButton:
    def button_pressed(self):
        pass

    def reset_time(self):
        pass

    def draw(self):
        pass

    def last_click(self):
        pass


class ScreenCover:
    def __init__(self,
                 window: visual.Window,
                 start_position,
                 size,
                 cover_color="white",
                 text_color="black",
                 grow_rate=1,
                 time_to_cover=None):
        self._message = visual.TextStim(win=window,
                                        text='Данное решение неверное. Пожалуйста нажмите на кнопку "Обновить"',
                                        height=30,
                                        color=text_color,
                                        pos=start_position,
                                        )

        self._start_position = (start_position[0], start_position[1] - self._message.boundingBox[1] / 2)
        self._message.pos = self._start_position
        self._cover = visual.Rect(win=window,
                                  height=self._message.boundingBox[1],
                                  width=size * 2,
                                  fillColor=cover_color,
                                  pos=self._start_position,
                                  )

        self._size = size
        self._max_size = size * 2

        self._grow_rate = grow_rate
        if time_to_cover is not None:
            self._grow_rate = self._max_size / window.fps()

        self._position_shift = self._grow_rate / 2
        self._is_covered_everything = False

    def _grow(self):
        self._cover.height += self._grow_rate
        self._message.pos -= (0, self._position_shift)
        self._cover.pos -= (0, self._position_shift)

        if self._cover.height >= self._max_size:
            self._is_covered_everything = True

    def resize(self):
        self._cover.height = self._message.boundingBox[1]
        self._cover.pos = self._start_position
        self._message.pos = self._start_position
        self._is_covered_everything = False

    def draw(self):
        self._cover.draw()
        self._message.draw()

        if not self._is_covered_everything:
            self._grow()
