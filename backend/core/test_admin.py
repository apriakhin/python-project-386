from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

from core.models import MOSCOW, ClosedDate, Event, ScheduleInterval


@pytest.mark.django_db
def test_calendar_owner_manages_schedule_and_closed_dates_in_admin():
    ScheduleInterval.objects.all().delete()
    client = Client()
    url = "/admin/core/scheduleinterval/add/"
    assert client.get(url).status_code == 302
    owner = get_user_model().objects.create_superuser("owner", "owner@example.com", "password")
    client.force_login(owner)
    assert client.get(url).status_code == 200
    form = {"weekday": "0", "start": "10:00", "end": "11:00", "_save": "Save"}
    assert client.post(url, form).status_code == 302
    assert ScheduleInterval.objects.count() == 1
    assert client.post(url, {**form, "start": "10:30", "end": "11:30"}).status_code == 200
    assert client.post(url, {**form, "start": "11:00", "end": "11:30"}).status_code == 302
    assert client.post(url, {**form, "start": "23:30", "end": "00:30"}).status_code == 200
    assert ScheduleInterval.objects.count() == 2

    tomorrow = timezone.localtime(timezone.now(), MOSCOW).date() + timedelta(days=1)
    closed_url = "/admin/core/closeddate/add/"
    assert (
        client.post(closed_url, {"date": tomorrow.isoformat(), "_save": "Save"}).status_code == 302
    )
    assert ClosedDate.objects.filter(date=tomorrow).exists()
    old = ClosedDate.objects.create(date=tomorrow + timedelta(days=2))
    ClosedDate.objects.filter(pk=old.pk).update(date=tomorrow - timedelta(days=2))
    assert (
        client.post(
            f"/admin/core/closeddate/{old.pk}/change/",
            {"date": tomorrow.isoformat(), "_save": "Save"},
        ).status_code
        == 403
    )
    assert (
        client.post(f"/admin/core/closeddate/{old.pk}/delete/", {"post": "yes"}).status_code == 403
    )


@pytest.mark.django_db
def test_admin_shows_past_events_without_public_admin_access():
    past = timezone.now() - timedelta(days=2)
    Event.objects.create(
        start_at=past,
        end_at=past + timedelta(minutes=30),
        name="Past Guest",
        email="past@example.com",
    )
    client = Client()
    url = "/admin/core/event/"
    assert client.get(url).status_code == 302
    owner = get_user_model().objects.create_superuser("owner", "owner@example.com", "password")
    client.force_login(owner)
    assert b"Past Guest" in client.get(url).content
