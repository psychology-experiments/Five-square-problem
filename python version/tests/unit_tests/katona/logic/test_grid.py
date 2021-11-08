import pytest

from katona.logic import grid


@pytest.fixture()
def side_object():
    return grid.Side(position=(0, 0), orientation=0)


class TestSide:
    def test_position_attribute(self, side_object):
        expected = (0, 0)
        actual = side_object.position
        message = f"Expected position at {expected}, got {actual}"
        assert actual == expected, message

    def test_orientation_attribute(self, side_object):
        expected = 0
        actual = side_object.orientation
        message = f"Expected orientation equal {expected} degree, got {actual}"
        assert actual == expected, message


@pytest.fixture
def simple_square_unit():
    return grid.SquareUnit(side_length=1.0, side_width=1.0, center_position=(0, 0))


class TestSquareUnit:
    def test_square_unit_have_four_side(self, simple_square_unit):
        sides = len(simple_square_unit.sides)
        message = f"SquareUnit should have 4 side, but have {sides}"
        assert sides == 4, message

    def test_square_unit_sides_orientations(self, simple_square_unit):
        orientations = [side.orientation
                        for side in simple_square_unit.sides]
        expected_orientations = [0, 0, 90, 90]
        message = f"SquareUnit should have side orientations: " \
                  f"{expected_orientations}, but have {orientations}"
        assert orientations == expected_orientations, message

    def test_square_unit_sides_positions_at_center(self, simple_square_unit):
        sides_positions = [side.position
                           for side in simple_square_unit.sides]
        expected_positions = [(0.0, -1.0), (0.0, 1.0), (1.0, 0.0), (-1.0, 0.0)]
        message = f"SquareUnit in center should have side positions: " \
                  f"{expected_positions}, but have {sides_positions}"
        assert sides_positions == expected_positions, message

    def test_square_unit_sides_positions_in_first_quarter(self):
        square_unit = grid.SquareUnit(1.0, 1.0, (2, 2))
        sides_positions = [side.position
                           for side in square_unit.sides]
        expected_positions = [(2.0, 1.0), (2.0, 3.0), (3.0, 2.0), (1.0, 2.0)]
        message = f"SquareUnit in FIRST QUARTER should have side positions: " \
                  f"{expected_positions}, but have {sides_positions}"
        assert sides_positions == expected_positions, message

    def test_square_unit_sides_positions_in_third_quarter(self):
        square_unit = grid.SquareUnit(1.0, 1.0, (-3, -1))
        sides_positions = [side.position
                           for side in square_unit.sides]
        expected_positions = [(-3.0, -2.0), (-3.0, 0.0), (-2.0, -1.0), (-4.0, -1.0)]
        message = f"SquareUnit in THIRD QUARTER should have side positions: " \
                  f"{expected_positions}, but have {sides_positions}"
        assert sides_positions == expected_positions, message

    def test_square_unit_with_different_from_single_unit_sides(self):
        square_unit = grid.SquareUnit(5, 3, (0, 0))
        sides_positions = [side.position
                           for side in square_unit.sides]
        expected_positions = [(0.0, -4.0), (0.0, 4.0), (4.0, 0.0), (-4.0, 0.0)]
        message = f"SquareUnit with non-single-unit sides should have side positions: " \
                  f"{expected_positions}, but have {sides_positions}"
        assert sides_positions == expected_positions, message

    def test_incorrectly_small_side_length(self):
        with pytest.raises(ValueError) as err_info:
            grid.SquareUnit(0, 1, (0, 0))
        assert err_info.match("Длина стороны не может быть равна 0 или меньше. Сейчас: 0")

    def test_incorrectly_small_side_width(self):
        with pytest.raises(ValueError) as err_info:
            grid.SquareUnit(1, -1, (0, 0))
        assert err_info.match("Длина стороны не может быть меньше 0. Сейчас: -1")


class TestGrid:
    @staticmethod
    def calculate_qty_grid_elements(qty_squares):
        return 2 * (qty_squares ** 2 + qty_squares)

    @pytest.mark.skip(reason="Известно, что сетка для четных значений создаётся неправильно")
    def test_normal_field_size(self):
        field_size_tested = (3, 4, 5, 6, 7)
        for field_size in field_size_tested:
            grid_unit = grid.Grid(field_size=field_size, grid_unit=1, grid_thickness=1)
            expected_qty_grid_elements = self.calculate_qty_grid_elements(field_size)
            actual_field_size = len(grid_unit.grid_elements)
            message = f"For field {field_size} expected grid elements {expected_qty_grid_elements}, " \
                      f"got {actual_field_size}"
            assert actual_field_size == expected_qty_grid_elements, message

    def test_field_size_lesser_than_two(self):
        with pytest.raises(ValueError) as err_info:
            grid.Grid(field_size=1, grid_unit=1, grid_thickness=1)
        assert err_info.match("Размер поля не может быть равен 1 или меньше. Сейчас: 1")


if __name__ == '__main__':
    pytest.main()
