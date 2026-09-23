"""Django adapter for request shapes emitted from the public OpenAPI contract."""

import json
from datetime import datetime

from django.http import JsonResponse
from pydantic import ValidationError


def _invalid(field_errors):
    return JsonResponse(
        {"code": "INVALID_REQUEST", "message": "Invalid request", "fieldErrors": field_errors},
        status=400,
    )


def validate_request(request, *, body_model=None, query_parameters=()):
    """Return a 400 response on invalid input, or None on success.

    Generated routes supply the model and parameter constraints from OpenAPI.
    Business rules (slot availability, conflict handling) belong in the eventual views.
    """
    if body_model is not None:
        if request.content_type != "application/json":
            return _invalid({"body": ["Expected application/json"]})
        try:
            body = json.loads(request.body)
        except ValueError, UnicodeDecodeError:
            return _invalid({"body": ["Invalid JSON"]})
        if not isinstance(body, dict):
            return _invalid({"body": ["Expected an object"]})
        # Domain normalization precedes the schema's non-empty/max-length checks.
        if body_model.__name__ == "BookingRequest" and isinstance(body.get("name"), str):
            body["name"] = body["name"].strip()
        try:
            body_model.model_validate(body)
        except ValidationError as exc:
            errors = {}
            for detail in exc.errors():
                field = str(detail["loc"][0]) if detail["loc"] else "body"
                errors.setdefault(field, []).append(detail["msg"])
            return _invalid(errors)
        if body_model.__name__ == "BookingRequest":
            try:
                datetime.fromisoformat(body["startAt"])
            except ValueError:
                return _invalid({"startAt": ["Invalid timestamp"]})
        # EmailStr normalizes addresses; the wire contract limits the original value.
        if body_model.__name__ == "BookingRequest" and len(body["email"]) > 254:
            return _invalid({"email": ["Must be at most 254 characters"]})

    for parameter in query_parameters:
        name = parameter["name"]
        values = request.GET.getlist(name)
        if not values:
            if parameter["required"]:
                return _invalid({name: ["Required parameter"]})
            continue
        schema = parameter["schema"]
        value = values[0]
        if len(values) != 1 or (schema["type"] == "integer" and not value.isascii()):
            return _invalid({name: ["Invalid parameter"]})
        if schema["type"] == "integer":
            try:
                number = int(value)
            except ValueError:
                return _invalid({name: ["Expected an integer"]})
            if "minimum" in schema and number < schema["minimum"]:
                return _invalid({name: ["Below minimum"]})
            if "maximum" in schema and number > schema["maximum"]:
                return _invalid({name: ["Above maximum"]})
            if schema.get("format") == "int32" and not -(2**31) <= number < 2**31:
                return _invalid({name: ["Outside int32 range"]})
    return None
