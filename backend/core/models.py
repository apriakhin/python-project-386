import uuid
from datetime import timedelta
from zoneinfo import ZoneInfo

from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

MOSCOW = ZoneInfo("Europe/Moscow")
DURATION = timedelta(minutes=30)


class ScheduleInterval(models.Model):
    weekday = models.IntegerField(choices=[(day, day) for day in range(7)])
    start = models.TimeField()
    end = models.TimeField()

    def clean(self):
        super().clean()
        if self.start is None or self.end is None or self.weekday is None:
            return
        if self.end <= self.start:
            raise ValidationError({"end": "End must be after start on the same day."})
        if (
            ScheduleInterval.objects.filter(
                weekday=self.weekday, start__lt=self.end, end__gt=self.start
            )
            .exclude(pk=self.pk)
            .exists()
        ):
            raise ValidationError("Intervals on the same day cannot overlap.")

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)


class ClosedDate(models.Model):
    date = models.DateField(unique=True)

    def clean(self):
        super().clean()
        if self.date and self.date < timezone.localtime(timezone.now(), MOSCOW).date():
            raise ValidationError({"date": "Past closed dates cannot be changed."})

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)


class Event(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField(max_length=254)
    start_at = models.DateTimeField(db_index=True)
    end_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.end_at != self.start_at + DURATION:
            raise ValidationError("Events must last 30 minutes.")
        return super().save(*args, **kwargs)


class CalendarLock(models.Model):
    """Single shared row used to serialize bookings across workers and databases."""

    key = models.IntegerField(primary_key=True, default=1)
    version = models.IntegerField(default=0)
