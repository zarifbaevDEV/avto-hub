#!/bin/sh
set -e

if [ "$DB_ENGINE" = "postgresql" ]; then
    echo "Waiting for PostgreSQL at $DB_HOST:$DB_PORT..."
    while ! nc -z "$DB_HOST" "$DB_PORT"; do
        sleep 0.5
    done
    echo "PostgreSQL is up and running."
fi

echo "Applying database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput --clear || true

exec "$@"
