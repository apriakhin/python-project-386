import json

from django.test import Client


def test_booking_route_validates_required_fields_and_moscow_timestamp():
    client = Client(enforce_csrf_checks=True)
    url = "/api/bookings/"
    missing = client.post(
        url, json.dumps({"name": " ", "email": "bad"}), content_type="application/json"
    )
    assert missing.status_code == 400
    assert missing.json()["code"] == "INVALID_REQUEST"
    assert set(missing.json()["fieldErrors"]) == {"name", "email", "startAt"}

    impossible = client.post(
        url,
        json.dumps({"startAt": "2026-99-99T10:00:00+03:00", "name": "Guest", "email": "g@e.io"}),
        content_type="application/json",
    )
    assert impossible.status_code == 400
    assert "startAt" in impossible.json()["fieldErrors"]

    valid = client.post(
        url,
        json.dumps({"startAt": "2026-09-23T10:00:00+03:00", "name": "Guest", "email": "g@e.io"}),
        content_type="application/json",
    )
    assert valid.status_code == 501  # Stub: no booking is created before implementation.


def test_events_route_validates_page():
    client = Client()
    for page in ("0", "nope", "2147483648"):
        response = client.get("/api/events/", {"page": page})
        assert response.status_code == 400
        assert response.json()["code"] == "INVALID_REQUEST"
    assert client.get("/api/events/").status_code == 501
    assert client.get("/api/availability/").status_code == 501
