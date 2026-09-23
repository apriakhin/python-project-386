# Call Calendar

A service for booking events into fixed, conflict-checked time slots.

## Language

**Calendar owner**:
The single predefined person whose availability is offered for Events.
_Avoid_: administrator, host

**Guest**:
A person who books an Event without creating an account.
_Avoid_: user, attendee

**Event type**:
The single predefined kind of Event offered for Booking, displayed as «Звонок».
_Avoid_: meeting type

**Availability schedule**:
The Calendar owner's recurring weekly periods during which Slots may be offered.
_Avoid_: working hours, opening hours

**Closed date**:
A specific date excluded from the Availability schedule.
_Avoid_: day off, exception

**Slot**:
A fixed time interval that can be booked.
_Avoid_: time block, window, timeslot

**Booking**:
The reservation of a Slot.
_Avoid_: appointment, reservation

**Event**:
A scheduled occurrence created by a Booking. The upcoming section lists Events under the UI label «Предстоящие события».
_Avoid_: call, meeting, appointment

**Landing page**:
The public page that explains the service and links to the Booking page.
_Avoid_: home page, index page

**Booking page**:
The page where a visitor picks a Slot and books an Event.
_Avoid_: reservation page, schedule page
