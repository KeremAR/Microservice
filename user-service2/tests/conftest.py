import pytest


# Sadece test konfigürasyonu - dış servisler mock edilmeden
@pytest.fixture
def test_app():
    from main import app

    return app
