from itertools import cycle
from typing import List, NamedTuple, Tuple, Union

from psychopy import visual
import numpy as np

from katona.logic import grid


def rectangle(size):
    pixels = np.full(shape=(size, size), fill_value=-1)
    quarter = size // 4 + 2
    pixels[:, quarter:pixels.shape[1] - quarter] = 1
    return pixels


class ColorPicker:
    def __init__(self,
                 color_palette: Union[List[str], str],
                 color_positions: str = "all"):
        self._colors = color_palette
        self._all_central_indexes = [6, 7, 9, 8]
        self._in_between_indexes = (0, 2, 3, 5, 10, 12, 13, 15)
        self._all_distant_indexes = [1, 4, 11, 14]

        if color_positions == "all":
            self._central_indexes = self._all_central_indexes
            self._distant_indexes = self._all_distant_indexes
        else:
            colors_groups = dict(up=1, left=0, down=3, right=2)

            if color_positions not in colors_groups.keys():
                raise ValueError(f"Supported only (up, down, left, right) groups. Asked of {colors_groups}")
            colors_to_use = colors_groups[color_positions]

            central_index = self._all_central_indexes[colors_to_use]
            distant_index = self._all_distant_indexes[colors_to_use]

            self._all_central_indexes.remove(central_index)
            self._all_distant_indexes.remove(distant_index)

            self._central_indexes = [central_index]
            self._distant_indexes = [distant_index]
            self._in_between_indexes += tuple(self._all_central_indexes) + tuple(self._all_distant_indexes)

    def get_color(self, stick_index):
        if isinstance(self._colors, str):
            return self._colors
        else:
            if stick_index in self._central_indexes:
                return self._colors[0]
            elif stick_index in self._in_between_indexes:
                return self._colors[1]
            elif stick_index in self._distant_indexes:
                return self._colors[2]
            else:
                raise ValueError(f"There is no matchstick with index {stick_index}")


class VisualGridElement(NamedTuple):
    grid_idx: Tuple[int, int]
    visual_element: visual.BaseVisualStim


class VisualGrid:
    def __init__(self,
                 window: visual.Window,
                 grid_color: str,
                 field_size: int,
                 stick_length: float,
                 stick_width: float):
        self._window = window
        self.stick_length = stick_length
        self.stick_width = stick_width
        self.field_size = field_size

        grid_info = grid.Grid(field_size=self.field_size,
                              grid_unit=stick_length,
                              grid_thickness=stick_width)

        self._grid_info = [element_info
                           for element_info in grid_info.grid_elements]
        self.grid_elements = [self._create_stick(element_info, grid_color)
                              for element_info in self._grid_info]

        xys = []
        orientations = []
        for element_info in self._grid_info:
            xys.append(element_info.position)
            orientations.append(element_info.orientation)
        xys.sort()
        rect = rectangle(32)

        self._visible_grid_elements = visual.ElementArrayStim(win=window,
                                                              units=window.units,
                                                              fieldSize=window.size,
                                                              nElements=len(self.grid_elements),
                                                              sizes=stick_length,
                                                              elementTex=None,
                                                              elementMask=rect,
                                                              xys=xys,
                                                              oris=orientations,
                                                              colors=grid_color,
                                                              contrs=1,
                                                              )
        self.movable_elements = []
        self.default_movable_stick_positions = []

    @property
    def outer_border(self):
        x, y = self.grid_elements[-1].visual_element.pos
        farthest = max(abs(x), abs(y)) + self.stick_width
        return farthest

    def set_grid_color(self, color):
        self._visible_grid_elements.colors = color

    def create_movable_sticks(self, grid_indexes: Tuple[Tuple[int, int], ...],
                              movable_stick_color: Union[str, List[str]],
                              color_positions: str = "all"):

        color_picker = ColorPicker(movable_stick_color,
                                   color_positions)
        # TODO: настроить для любого количества квадратов
        for stick_idx, grid_idx in enumerate(grid_indexes):
            color = color_picker.get_color(stick_idx)
            grid_element_info = self.extract_grid_element_by_grid_idx(grid_idx)
            self.default_movable_stick_positions.append((grid_element_info.position, grid_element_info.orientation))
            movable_stick = self._create_stick(grid_element_info, color)
            self.movable_elements.append(movable_stick)

    def _create_stick(self, element_info, color):
        grid_element = visual.Rect(self._window,
                                   width=self.stick_length,
                                   height=self.stick_width,
                                   pos=element_info.position,
                                   lineColor=color,
                                   fillColor=color,
                                   ori=element_info.orientation,
                                   lineWidth=0)

        return VisualGridElement(grid_idx=element_info.grid_idx,
                                 visual_element=grid_element)

    def extract_grid_element_by_grid_idx(self, grid_idx: Tuple[int, int]):
        row_shift = self.field_size + self.field_size % 2
        col_shift = self.field_size // 2 + 1
        sticks_in_row = cycle((self.field_size, self.field_size + 1))
        row_idx, col_idx = grid_idx
        row_idx += row_shift
        col_idx += col_shift
        sticks_before = sum(next(sticks_in_row) for _ in range(row_idx - 1))

        element_idx = sticks_before + (col_idx - 1)
        return self._grid_info[element_idx]

    def return_to_default_positions(self):
        for stick, default_place in zip(self.movable_elements, self.default_movable_stick_positions):
            position, orientation = default_place
            stick.visual_element.pos = position
            stick.visual_element.ori = orientation

    def draw(self):
        self._visible_grid_elements.draw()

        for stick in self.movable_elements:
            stick.visual_element.draw()
