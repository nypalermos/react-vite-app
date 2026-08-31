const database = 'react_vite_app'

db = db.getSiblingDB(database)

db.createUser({
  user: 'app_user',
  pwd: 'app_password',
  roles: [{ role: 'readWrite', db: database }],
})

db.events.replaceOne(
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
