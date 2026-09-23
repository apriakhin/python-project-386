import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

@service(#{ title: "Call Calendar" })
@info(#{ version: "1.0.0" })
namespace CallCalendar;

/** Moscow calendar date (YYYY-MM-DD). */
@format("date")
scalar MoscowDate extends string;

/** ISO 8601 instant with the fixed Moscow offset. */
@pattern("^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?\\+03:00$")
scalar MoscowInstant extends string;

model Slot {
  startAt: MoscowInstant;
  endAt: MoscowInstant;
  status: "available" | "busy";
}

model AvailabilityDate {
  date: MoscowDate;
  slots: Slot[];
}

model Availability {
  timezone: "Europe/Moscow";
  /** Exactly 14 dates, from today in Moscow through the following 13 days. */
  @minItems(14)
  @maxItems(14)
  dates: AvailabilityDate[];
}

model Event {
  id: string;
  name: string;
  email: string;
  startAt: MoscowInstant;
  endAt: MoscowInstant;
  createdAt: MoscowInstant;
}

model BookingRequest {
  startAt: MoscowInstant;
  /** Trimmed before validation; whitespace-only names are invalid. */
  @minLength(1)
  @maxLength(255)
  name: string;
  @format("email")
  @maxLength(254)
  email: string;
}

model EventsPage {
  items: Event[];
  page: int32;
  pageSize: 20;
  total: int32;
  nextPage: int32 | null;
}

model ErrorDetail {
  message: string;
  fieldErrors?: Record<string[]>;
}

model InvalidRequestBody extends ErrorDetail {
  code: "INVALID_REQUEST";
}

model SlotUnavailableBody extends ErrorDetail {
  code: "SLOT_UNAVAILABLE";
}

model InvalidRequest {
  @statusCode statusCode: 400;
  @body body: InvalidRequestBody;
}

model SlotUnavailable {
  @statusCode statusCode: 409;
  @body body: SlotUnavailableBody;
}

model BookingCreated {
  @statusCode statusCode: 201;
  @body body: Event;
}

/** All 14 calendar dates, including dates without slots and occupied slots. */
@route("/api/availability/")
@get
op getAvailability(): Availability;

/** Recheck the selected slot atomically; an unavailable slot returns 409. */
@route("/api/bookings/")
@post
op createBooking(@body booking: BookingRequest): BookingCreated | InvalidRequest | SlotUnavailable;

/** Future events, earliest first; pages contain at most 20 events. */
@route("/api/events/")
@get
op listEvents(@query @minValue(1) page?: int32): EventsPage | InvalidRequest;
