from django.contrib import admin
from django.utils import timezone

from .models import MOSCOW, ClosedDate, Event, ScheduleInterval


def is_editable_closed_date(obj):
    return obj is None or obj.date >= timezone.localtime(timezone.now(), MOSCOW).date()


@admin.register(ScheduleInterval)
class ScheduleIntervalAdmin(admin.ModelAdmin):
    list_display = ("weekday", "start", "end")


@admin.register(ClosedDate)
class ClosedDateAdmin(admin.ModelAdmin):
    list_display = ("date",)

    actions = None  # Prevent bulk deletion from bypassing per-date permissions.

    def has_change_permission(self, request, obj=None):
        return super().has_change_permission(request, obj) and is_editable_closed_date(obj)

    def has_delete_permission(self, request, obj=None):
        return super().has_delete_permission(request, obj) and is_editable_closed_date(obj)


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "start_at", "end_at", "created_at")
    ordering = ("-start_at",)
    readonly_fields = ("name", "email", "start_at", "end_at", "created_at")

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
