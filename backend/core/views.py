from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.http import Http404, HttpResponse, JsonResponse
from django.utils import timezone

from .calendar import availability, book, public_event
from .models import Event


def health(request):
    return JsonResponse({"status": "ok"})


def spa(request):
    index = Path(settings.FRONTEND_DIST) / "index.html"
    if not index.is_file():
        raise Http404("Frontend build not found")
    return HttpResponse(index.read_bytes(), content_type="text/html")


def get_availability(request):
    return JsonResponse(availability())


def create_booking(request):
    data = request.validated_body
    event = book(datetime.fromisoformat(data.startAt.root), data.name, data.email)
    if event is None:
        return JsonResponse({"code": "SLOT_UNAVAILABLE", "message": "Slot unavailable"}, status=409)
    return JsonResponse(public_event(event), status=201)


def list_events(request):
    page = int(request.GET.get("page", 1))
    upcoming = Event.objects.filter(start_at__gt=timezone.now()).order_by("start_at", "pk")
    total = upcoming.count()
    items = upcoming[(page - 1) * 20 : page * 20]
    return JsonResponse(
        {
            "items": [public_event(event) for event in items],
            "page": page,
            "pageSize": 20,
            "total": total,
            "nextPage": page + 1 if page * 20 < total else None,
        }
    )
