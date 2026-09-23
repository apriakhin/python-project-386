from django.urls import path

from .generated.urls import urlpatterns as generated_urlpatterns
from .views import health

urlpatterns = [
    path("health/", health, name="health"),
] + generated_urlpatterns
