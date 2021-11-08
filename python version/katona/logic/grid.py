from typing import List, NamedTuple, Tuple

GridPosInfo = List[Tuple[int, int]]


class Side(NamedTuple):
    position: tuple
    orientation: int


class GridElement(NamedTuple):
    position: tuple
    orientation: int
    grid_idx: Tuple[int, int]


class SquareUnit:
    _positions: tuple = ((0, -0.5), (0, 0.5), (0.5, 0), (-0.5, 0))

    def __init__(self,
                 side_length: float,
                 side_width: float,
                 center_position: Tuple[float, float], ):

        if side_length <= 0:
            raise ValueError(f"Длина стороны не может быть равна 0 или меньше. Сейчас: {side_length}")

        if side_width < 0:
            raise ValueError(f"Длина стороны не может быть меньше 0. Сейчас: {side_width}")

        self.sides: List[Side, ...] = []
        self._create_sides(side_length, side_width, center_position)

    def _create_sides(self, side_length, side_width, center_position):
        side_length_shift: float = side_length + side_width

        x: float
        y: float
        for x, y in self._positions:
            orientation: int = 0 if x == 0 else 90
            position: Tuple[float, float] = (x * side_length_shift + center_position[0],
                                             y * side_length_shift + center_position[1])
            self.sides.append(Side(position, orientation))


class Grid:

    def __init__(self,
                 field_size: int,
                 grid_unit: float,
                 grid_thickness: float):
        if field_size <= 1:
            raise ValueError(f"Размер поля не может быть равен 1 или меньше. Сейчас: {field_size}")

        self.field_size: int = field_size
        self.grid_elements: List[GridElement, ...] = []
        self.grid_construct_elements: List[Side, ...] = []
        self.grid_elements_pos: GridPosInfo = []

        self._create_grid(grid_unit, grid_thickness)

    def _create_grid(self, grid_unit, grid_thickness):
        grid: List[Side, ...] = []
        step: float = grid_unit + grid_thickness
        center_position: int = self.field_size // 2
        # TODO: Чётные значения создают неверную форму (нечётную, на 1 больше)
        y: int
        x: int
        for y in range(-center_position, center_position + 1):
            for x in range(-center_position, center_position + 1):
                square_unit = SquareUnit(side_length=grid_unit,
                                         side_width=grid_thickness,
                                         center_position=(x * step, y * step),
                                         )
                grid.extend(square_unit.sides)

        self._remove_redundant_grid_elements(redundant_grid=grid)

        self.grid_construct_elements.sort(key=lambda side: (side.position[1], -side.position[0]),
                                          reverse=True)
        self._create_grid_positions()

        for grid_idx, element_info in zip(self.grid_elements_pos, self.grid_construct_elements):
            position, orientation = element_info
            grid_element = GridElement(position, orientation, grid_idx)
            self.grid_elements.append(grid_element)

    def _remove_redundant_grid_elements(self, redundant_grid):
        unique_grid_elements = set()

        for grid_element in redundant_grid:
            side_position = grid_element.position
            if side_position not in unique_grid_elements:
                unique_grid_elements.add(side_position)
                self.grid_construct_elements.append(grid_element)

    def _create_grid_positions(self):
        steps = [self.field_size, self.field_size + 1] * self.field_size + [self.field_size]

        for row_idx, cols in enumerate(steps, 1):
            for col_idx in range(1, cols + 1):
                grid_position = (row_idx, col_idx)
                self.grid_elements_pos.append(grid_position)
