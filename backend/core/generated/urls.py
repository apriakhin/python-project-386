"""Generated Django URL patterns relative to /api/."""

from django.urls import path

from core.generated import views

urlpatterns = [
    path("availability/", views.get_availability, name="getAvailability"),
    path("bookings/", views.create_booking, name="createBooking"),
    path("events/", views.list_events, name="listEvents"),
]
