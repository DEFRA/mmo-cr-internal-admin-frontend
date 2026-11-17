import {
  loadTrip,
  tripPath
} from '#/server/common/helpers/trips/trip-request.js'

export const versionsController = {
  handler(request, h) {
    const { trip } = loadTrip(request)
    const latest = trip.amendments.at(-1)

    const versions = [
      ...trip.amendments
        .map((amendment) => ({
          label: `Amendment ${amendment.number}${amendment === latest ? ' (current)' : ''}`,
          href: tripPath(
            trip.tripId,
            amendment === latest
              ? '?version=current'
              : `?version=amendment-${amendment.number}`
          ),
          dateTime: amendment.dateTime,
          by: amendment.amendedBy,
          reason: amendment.reason
        }))
        .reverse(),
      {
        label: 'Original record',
        href: tripPath(trip.tripId, '?version=original'),
        dateTime: trip.createdOn,
        by: trip.createdBy,
        reason: 'Not applicable'
      }
    ]

    return h.view('fishing-trips/versions/index', {
      pageTitle: `Version history for trip ${trip.tripId}`,
      backLink: { text: 'Back to trip details', href: tripPath(trip.tripId) },
      trip,
      versions
    })
  }
}
