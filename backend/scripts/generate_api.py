"""Generate Django route stubs from the TypeSpec-emitted OpenAPI document.

Usage (from backend/): uv run python scripts/generate_api.py
"""

import re
from pathlib import Path
from pprint import pformat

import yaml

ROOT = Path(__file__).resolve().parents[2]
DOCUMENT = ROOT / "api/generated/@typespec/openapi3/openapi.yaml"
OUTPUT = ROOT / "backend/core/generated"


def python_name(operation_id):
    return re.sub(r"(?<!^)(?=[A-Z])", "_", operation_id).lower()


def generate():
    document = yaml.safe_load(DOCUMENT.read_text())
    paths = document["paths"]
    views = [
        '"""Generated Django route stubs. Edit TypeSpec and regenerate, not this file."""',
        "",
        "from django.http import JsonResponse",
        "from django.views.decorators.csrf import csrf_exempt",
        "",
        "from core.api_validation import validate_request",
        "from core.generated import models",
        "",
    ]
    urls = [
        '"""Generated Django URL patterns relative to /api/."""',
        "",
        "from django.urls import path",
        "",
        "from core.generated import views",
        "",
        "urlpatterns = [",
    ]
    for route, operations in paths.items():
        if not route.startswith("/api/") or not route.endswith("/"):
            raise ValueError(f"Expected an API path ending in /: {route}")
        for method, operation in operations.items():
            if method not in {"get", "post"}:
                raise ValueError(f"Unsupported method: {method}")
            name = python_name(operation["operationId"])
            body = operation.get("requestBody", {}).get("content", {}).get("application/json")
            schema = body["schema"] if body else None
            if schema and "$ref" not in schema:
                raise ValueError(f"Expected a named request model for {name}")
            model = f"models.{schema['$ref'].split('/')[-1]}" if schema else "None"
            parameters = [
                {"name": param["name"], "required": param["required"], "schema": param["schema"]}
                for param in operation.get("parameters", [])
                if param["in"] == "query"
            ]
            if len(parameters) != len(operation.get("parameters", [])):
                raise ValueError(f"Unsupported parameter location for {name}")
            formatted_parameters = pformat(parameters, width=75, sort_dicts=False).replace(
                "\n", "\n        "
            )
            views.extend(
                [
                    "@csrf_exempt" if method == "post" else "",
                    f"def {name}(request):",
                    f'    if request.method != "{method.upper()}":',
                    '        return JsonResponse({"message": "Method not allowed"}, status=405)',
                    "    error = validate_request(",
                    "        request,",
                    f"        body_model={model},",
                    f"        query_parameters={formatted_parameters},",
                    "    )",
                    "    if error is not None:",
                    "        return error",
                    '    return JsonResponse({"message": "Not implemented"}, status=501)',
                    "",
                ]
            )
            local_path = route.removeprefix("/api/")
            operation_id = operation["operationId"]
            urls.append(f'    path("{local_path}", views.{name}, name="{operation_id}"),')
    urls.append("]")
    (OUTPUT / "views.py").write_text("\n".join(views) + "\n")
    (OUTPUT / "urls.py").write_text("\n".join(urls) + "\n")


if __name__ == "__main__":
    generate()
