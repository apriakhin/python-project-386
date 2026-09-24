from datetime import UTC, datetime, timedelta
from time import monotonic, sleep

from django.db import OperationalError, connection, transaction
from django.db.models import F
from django.utils import timezone

from .models import DURATION, MOSCOW, CalendarLock, ClosedDate, Event, ScheduleInterval

BOOKING_WINDOW_DAYS = 14


def moscow_timestamp(value):
    return value.astimezone(MOSCOW).isoformat(timespec="seconds")


def public_event(event):
    return {
        "id": str(event.pk),
        "name": event.name,
        "email": event.email,
        "startAt": moscow_timestamp(event.start_at),
        "endAt": moscow_timestamp(event.end_at),
        "createdAt": moscow_timestamp(event.created_at),
    }


def slots_for(day, now):
    if ClosedDate.objects.filter(date=day).exists():
        return []
    slots = []
    for interval in ScheduleInterval.objects.filter(weekday=day.weekday()).order_by("start"):
        candidate = datetime.combine(day, interval.start)
        limit = datetime.combine(day, interval.end)
        while candidate + DURATION <= limit:
            start = candidate.replace(tzinfo=MOSCOW)
            # A wall-clock time must round-trip and identify exactly one instant.
            if (
                start.astimezone(UTC).astimezone(MOSCOW).replace(tzinfo=None) == candidate
                and start.replace(fold=1).utcoffset() == start.utcoffset()
                and start > now
            ):
                end = start + DURATION
                busy = Event.objects.filter(start_at__lt=end, end_at__gt=start).exists()
                slots.append(
                    {
                        "startAt": moscow_timestamp(start),
                        "endAt": moscow_timestamp(end),
                        "status": "busy" if busy else "available",
                    }
                )
            candidate += DURATION
    return slots


def availability(now=None):
    now = now or timezone.now().astimezone(MOSCOW)
    today = now.astimezone(MOSCOW).date()
    return {
        "timezone": "Europe/Moscow",
        "dates": [
            {
                "date": (today + timedelta(days=offset)).isoformat(),
                "slots": slots_for(today + timedelta(days=offset), now),
            }
            for offset in range(BOOKING_WINDOW_DAYS)
        ],
    }


def book(start_at, name, email):
    deadline = monotonic() + 2
    while True:
        try:
            with transaction.atomic():
                # PostgreSQL takes a row lock; on SQLite the update acquires its writer lock.
                if connection.vendor != "sqlite":
                    CalendarLock.objects.select_for_update().get(pk=1)
                CalendarLock.objects.filter(pk=1).update(version=F("version") + 1)
                now = timezone.now().astimezone(MOSCOW)
                day = start_at.astimezone(MOSCOW).date()
                if not now.date() <= day < now.date() + timedelta(days=BOOKING_WINDOW_DAYS):
                    return None
                if not any(
                    slot["startAt"] == moscow_timestamp(start_at) and slot["status"] == "available"
                    for slot in slots_for(day, now)
                ):
                    return None
                return Event.objects.create(
                    start_at=start_at, end_at=start_at + DURATION, name=name, email=email
                )
        except OperationalError as exc:
            # SQLite may reject a competing writer immediately. Retry from a new
            # transaction so only a rechecked, unavailable Slot becomes a 409.
            if (
                connection.vendor != "sqlite"
                or "locked" not in str(exc).lower()
                or monotonic() >= deadline
            ):
                raise
            sleep(0.025)
