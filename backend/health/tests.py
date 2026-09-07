import requests


def test_health_endpoint(live_server):
    response = requests.get(f"{live_server.url}/api/health/", timeout=5)

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
