import pytest
import prometheus_client
from unittest.mock import patch, MagicMock


@pytest.fixture(autouse=True, scope="function")
def reset_prometheus_registry():
    """Reset Prometheus metrics registry to avoid duplication."""
    # Clear registry before test
    collectors = list(prometheus_client.REGISTRY._collector_to_names.keys())
    for collector in collectors:
        prometheus_client.REGISTRY.unregister(collector)
    
    yield
    
    # Clean up after test
    collectors = list(prometheus_client.REGISTRY._collector_to_names.keys())
    for collector in collectors:
        prometheus_client.REGISTRY.unregister(collector)


@pytest.fixture(autouse=True)
def mock_redis():
    """Mock Redis cache service globally."""
    with patch("main.redis_client") as mock_redis:
        # Setup common Redis operations
        mock_redis.get.return_value = None  # Default no cache hit
        mock_redis.setex.return_value = True
        mock_redis.delete.return_value = 0
        mock_redis.keys.return_value = []
        yield mock_redis 