"""Generated Django route stubs. Edit TypeSpec and regenerate, not this file."""

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from core.api_validation import validate_request
from core.generated import models


def get_availability(request):
    if request.method != "GET":
        return JsonResponse({"message": "Method not allowed"}, status=405)
    error = validate_request(
        request,
        body_model=None,
        query_parameters=[],
    )
    if error is not None:
        return error
    return JsonResponse({"message": "Not implemented"}, status=501)


@csrf_exempt
def create_booking(request):
    if request.method != "POST":
        return JsonResponse({"message": "Method not allowed"}, status=405)
    error = validate_request(
        request,
        body_model=models.BookingRequest,
        query_parameters=[],
    )
    if error is not None:
        return error
    return JsonResponse({"message": "Not implemented"}, status=501)


def list_events(request):
    if request.method != "GET":
        return JsonResponse({"message": "Method not allowed"}, status=405)
    error = validate_request(
        request,
        body_model=None,
        query_parameters=[
            {
                "name": "page",
                "required": False,
                "schema": {"type": "integer", "format": "int32", "minimum": 1},
            }
        ],
    )
    if error is not None:
        return error
    return JsonResponse({"message": "Not implemented"}, status=501)
