import json
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, time, timedelta
from threading import Event as ThreadEvent
from time import sleep
from zoneinfo import ZoneInfo

import pytest
from django.db import transaction
from django.db.models import F
from django.test import Client
from django.utils import timezone

from core.models import CalendarLock, ClosedDate, Event, ScheduleInterval

MOSCOW = ZoneInfo("Europe/Moscow")


@pytest.mark.django_db
def test_fresh_calendar_offers_daily_slots_without_precreating_slot_rows():
    tomorrow = timezone.localtime(timezone.now(), MOSCOW).date() + timedelta(days=1)
    response = Client().get("/api/availability/")
    assert response.status_code == 200
    day = next(item for item in response.json()["dates"] if item["date"] == tomorrow.isoformat())
    assert len(day["slots"]) == 18
    assert day["slots"][0]["startAt"].endswith("T09:00:00+03:00")
    assert day["slots"][-1]["endAt"].endswith("T18:00:00+03:00")

    ScheduleInterval.objects.all().delete()
    assert all(not day["slots"] for day in Client().get("/api/availability/").json()["dates"])


@pytest.mark.django_db
def test_availability_and_booking_through_public_routes():
    ScheduleInterval.objects.all().delete()
    now = timezone.localtime(timezone.now(), MOSCOW)
    day = (now + timedelta(days=1)).date()
    ScheduleInterval.objects.create(weekday=day.weekday(), start=time(10), end=time(11))
    client = Client()
    dates = client.get("/api/availability/").json()["dates"]
    assert len(dates) == 14
    assert dates[0]["date"] == now.date().isoformat()
    slots = next(item["slots"] for item in dates if item["date"] == day.isoformat())
    assert [slot["status"] for slot in slots] == ["available", "available"]
    booking = {"startAt": slots[0]["startAt"], "name": " Guest ", "email": "guest@example.com"}
    response = client.post("/api/bookings/", json.dumps(booking), content_type="application/json")
    assert response.status_code == 201
    assert response.json()["name"] == "Guest"
    assert response.json()["startAt"] == slots[0]["startAt"]
    assert (
        client.post(
            "/api/bookings/", json.dumps(booking), content_type="application/json"
        ).status_code
        == 409
    )
    assert [
        slot["status"]
        for slot in next(
            item["slots"]
            for item in client.get("/api/availability/").json()["dates"]
            if item["date"] == day.isoformat()
        )
    ] == ["busy", "available"]
    booking["startAt"] = slots[1]["startAt"]
    assert (
        client.post(
            "/api/bookings/", json.dumps(booking), content_type="application/json"
        ).status_code
        == 201
    )
    assert client.get("/api/events/").json()["total"] == 2
    ClosedDate.objects.create(date=day)
    assert (
        next(
            item["slots"]
            for item in client.get("/api/availability/").json()["dates"]
            if item["date"] == day.isoformat()
        )
        == []
    )
    assert client.get("/api/events/").json()["total"] == 2


@pytest.mark.django_db
def test_events_include_future_outside_booking_window_and_paginate():
    now = timezone.now()
    for index in range(23):
        start = now + timedelta(days=20, hours=index)
        Event.objects.create(
            start_at=start,
            end_at=start + timedelta(minutes=30),
            name="Guest",
            email="g@example.com",
        )
    past = now - timedelta(hours=1)
    Event.objects.create(
        start_at=past, end_at=past + timedelta(minutes=30), name="Past", email="p@example.com"
    )
    client = Client()
    first = client.get("/api/events/").json()
    assert (first["total"], len(first["items"]), first["nextPage"]) == (23, 20, 2)
    assert datetime.fromisoformat(first["items"][0]["startAt"]) < datetime.fromisoformat(
        first["items"][1]["startAt"]
    )
    assert len(client.get("/api/events/?page=2").json()["items"]) == 3
    assert client.get("/api/events/?page=3").json()["items"] == []


@pytest.mark.django_db
def test_moscow_window_and_interval_boundaries(monkeypatch):
    ScheduleInterval.objects.all().delete()
    fixed = datetime(2026, 9, 23, 23, 45, tzinfo=MOSCOW)
    monkeypatch.setattr(timezone, "now", lambda: fixed)
    ScheduleInterval.objects.create(weekday=fixed.weekday(), start=time(23, 30), end=time(23, 59))
    tomorrow = fixed.date() + timedelta(days=1)
    ScheduleInterval.objects.create(
        weekday=tomorrow.weekday(), start=time(10, 15), end=time(11, 15)
    )
    client = Client()
    dates = client.get("/api/availability/").json()["dates"]
    assert dates[0] == {"date": "2026-09-23", "slots": []}
    assert dates[-1]["date"] == "2026-10-06"
    assert [slot["startAt"] for slot in dates[1]["slots"]] == [
        "2026-09-24T10:15:00+03:00",
        "2026-09-24T10:45:00+03:00",
    ]
    request = {"startAt": "2026-09-24T10:30:00+03:00", "name": "Guest", "email": "g@example.com"}
    assert (
        client.post(
            "/api/bookings/", json.dumps(request), content_type="application/json"
        ).status_code
        == 409
    )
    request["startAt"] = dates[1]["slots"][0]["startAt"]
    assert (
        client.post(
            "/api/bookings/", json.dumps(request), content_type="application/json"
        ).status_code
        == 201
    )


@pytest.mark.django_db(transaction=True)
def test_simultaneous_booking_creates_one_event():
    ScheduleInterval.objects.all().delete()
    tomorrow = timezone.localtime(timezone.now(), MOSCOW).date() + timedelta(days=1)
    ScheduleInterval.objects.create(weekday=tomorrow.weekday(), start=time(10), end=time(11))
    start = datetime.combine(tomorrow, time(10), tzinfo=MOSCOW).isoformat()
    request = json.dumps({"startAt": start, "name": "Guest", "email": "g@example.com"})

    def submit(_):
        return Client().post("/api/bookings/", request, content_type="application/json").status_code

    with ThreadPoolExecutor(max_workers=2) as pool:
        statuses = sorted(pool.map(submit, range(2)))
    assert statuses == [201, 409]
    assert Event.objects.count() == 1


@pytest.mark.django_db(transaction=True)
def test_simultaneous_adjacent_bookings_both_succeed():
    ScheduleInterval.objects.all().delete()
    tomorrow = timezone.localtime(timezone.now(), MOSCOW).date() + timedelta(days=1)
    ScheduleInterval.objects.create(weekday=tomorrow.weekday(), start=time(10), end=time(11))

    def book_slot(minute):
        request = json.dumps(
            {
                "startAt": datetime.combine(tomorrow, time(10, minute), tzinfo=MOSCOW).isoformat(),
                "name": "Guest",
                "email": "guest@example.com",
            }
        )
        return Client().post("/api/bookings/", request, content_type="application/json").status_code

    with ThreadPoolExecutor(max_workers=2) as pool:
        statuses = sorted(pool.map(book_slot, (0, 30)))
    assert statuses == [201, 201]
    assert Event.objects.count() == 2


@pytest.mark.django_db(transaction=True)
def test_unrelated_sqlite_writer_does_not_make_free_slot_unavailable():
    ScheduleInterval.objects.all().delete()
    tomorrow = timezone.localtime(timezone.now(), MOSCOW).date() + timedelta(days=1)
    ScheduleInterval.objects.create(weekday=tomorrow.weekday(), start=time(10), end=time(11))
    request = json.dumps(
        {
            "startAt": datetime.combine(tomorrow, time(10), tzinfo=MOSCOW).isoformat(),
            "name": "Guest",
            "email": "guest@example.com",
        }
    )
    locked = ThreadEvent()
    release = ThreadEvent()

    def hold_write_lock():
        with transaction.atomic():
            CalendarLock.objects.filter(pk=1).update(version=F("version") + 1)
            locked.set()
            assert release.wait(5)

    with ThreadPoolExecutor(max_workers=2) as pool:
        writer = pool.submit(hold_write_lock)
        assert locked.wait(5)
        try:
            booking = pool.submit(
                lambda: Client().post("/api/bookings/", request, content_type="application/json")
            )
            sleep(0.05)
        finally:
            release.set()
        writer.result()
        response = booking.result()

    assert response.status_code == 201
    assert Event.objects.count() == 1


@pytest.mark.django_db
def test_booking_returns_and_saves_validated_email():
    ScheduleInterval.objects.all().delete()
    tomorrow = timezone.localtime(timezone.now(), MOSCOW).date() + timedelta(days=1)
    ScheduleInterval.objects.create(weekday=tomorrow.weekday(), start=time(10), end=time(10, 30))
    request = {
        "startAt": datetime.combine(tomorrow, time(10), tzinfo=MOSCOW).isoformat(),
        "name": "Guest",
        "email": "Guest@EXAMPLE.COM",
    }
    response = Client().post("/api/bookings/", json.dumps(request), content_type="application/json")
    assert response.status_code == 201
    assert response.json()["email"] == "Guest@example.com"
    assert Event.objects.get().email == "Guest@example.com"
