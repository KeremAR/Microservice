.PHONY: help setup test test-unit test-integration test-coverage lint format run docker-up docker-down

help:
	@echo "Available commands:"
	@echo "  make setup          - Install development dependencies"
	@echo "  make test           - Run all tests"
	@echo "  make test-unit      - Run unit tests only"
	@echo "  make test-integration - Run integration tests only"
	@echo "  make test-coverage  - Run tests with coverage report"
	@echo "  make lint           - Check code style with flake8"
	@echo "  make format         - Format code with black"
	@echo "  make run            - Run the service locally"
	@echo "  make docker-up      - Start service with Docker Compose"
	@echo "  make docker-down    - Stop Docker Compose services"

setup:
	pip install -r requirements-dev.txt

test:
	pytest

test-unit:
	pytest tests/unit/

test-integration:
	pytest tests/integration/

test-coverage:
	pytest --cov=./ --cov-report=html --cov-report=xml

lint:
	flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics

format:
	black .

run:
	uvicorn main:app --reload --host 0.0.0.0 --port 8000

docker-up:
	docker-compose up --build -d

docker-down:
	docker-compose down 