#!/bin/bash
set -euo pipefail

: "${MONGO_INITDB_ROOT_USERNAME:?MONGO_INITDB_ROOT_USERNAME is required}"
: "${MONGO_INITDB_ROOT_PASSWORD:?MONGO_INITDB_ROOT_PASSWORD is required}"
: "${MONGO_APP_USERNAME:?MONGO_APP_USERNAME is required}"
: "${MONGO_APP_PASSWORD:?MONGO_APP_PASSWORD is required}"
: "${MONGO_APP_DATABASE:=react_vite_app}"

mongosh \
  --quiet \
  -u "${MONGO_INITDB_ROOT_USERNAME}" \
  -p "${MONGO_INITDB_ROOT_PASSWORD}" \
  --authenticationDatabase admin \
  <<EOF
const database = '${MONGO_APP_DATABASE}'
const appDb = db.getSiblingDB(database)

appDb.createUser({
  user: '${MONGO_APP_USERNAME}',
  pwd: '${MONGO_APP_PASSWORD}',
  roles: [{ role: 'readWrite', db: database }],
})

appDb.events.replaceOne(
  { event_id: 1 },
  {
    event_id: 1,
    event_name: 'Quarterly Security Review',
    event_description:
      'Review of reported activity across production systems during Q2.',
    event_type: 'Both',
    incidents: [
      {
        username: 'jsmith',
        comment: 'Unusual login pattern detected from a new device.',
      },
      {
        username: 'alee',
        comment: 'Confirmed as legitimate after follow-up.',
      },
    ],
  },
  { upsert: true },
)
EOF
