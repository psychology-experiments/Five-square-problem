import os

import pytest

from katona.logic import datasaver


@pytest.fixture
def experiment_info(tmpdir):
    save_path = tmpdir.join("data")
    info = {"Испытуемый": "тестовый"}
    yield save_path, info


class TestDataSaver:
    def test_file_creation(self, experiment_info):
        save_path, info = experiment_info

    def te
