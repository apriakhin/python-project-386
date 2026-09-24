from datetime import time

from django.db import migrations


def seed_schedule(apps, schema_editor):
    schedule = apps.get_model("core", "ScheduleInterval")
    database = schema_editor.connection.alias
    if not schedule.objects.using(database).exists():
        schedule.objects.using(database).bulk_create(
            [schedule(weekday=weekday, start=time(9), end=time(18)) for weekday in range(7)]
        )


class Migration(migrations.Migration):
    dependencies = [("core", "0001_initial")]

    operations = [migrations.RunPython(seed_schedule, migrations.RunPython.noop)]
