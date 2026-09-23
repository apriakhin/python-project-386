# Генерация API Call Calendar

Источник контракта — [`frontend/tsp/main.tsp`](../frontend/tsp/main.tsp), составленный по [утверждённой спецификации](spec/call-calendar.md). После `make install` из корня проекта выполните:

```sh
make generate-api
```

Команда последовательно обновляет:

1. `api/generated/@typespec/openapi3/openapi.yaml` — OpenAPI;
2. `frontend/src/api/generated/` — типизированные модели и fetch SDK (`getAvailability`, `createBooking`, `listEvents`);
3. `backend/core/generated/models.py` — Pydantic-модели запросов и ответов;
4. `backend/core/generated/views.py` и `urls.py` — Django-маршруты с проверкой входных данных.

Сгенерированные файлы храните в репозитории; не редактируйте их вручную. После изменения TypeSpec снова запустите `make generate-api`, затем `make check`. SDK можно импортировать из `src/api/generated`; относительные пути `/api/…` работают через Vite proxy. Типизированный вызов и передача собственного fetch-клиента показаны в `frontend/src/api/calendar.test.ts`.

Маршруты подключены в `backend/core/urls.py`. Входящие JSON-запросы и параметр `page` проверяются адаптером `backend/core/api_validation.py`, который возвращает `400 INVALID_REQUEST` с `fieldErrors`. Валидные запросы пока возвращают `501`: слоты, записи, история, проверка доступности и атомарное исключение пересечений требуют отдельной реализации. При добавлении бизнес-логики сохраняйте её вне генерируемых файлов.
