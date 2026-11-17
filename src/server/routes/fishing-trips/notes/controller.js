import { validateForm } from '#/server/common/helpers/forms/validation.js'
import { saveStore } from '#/server/common/helpers/admin-store/admin-store.js'
import { noteSchema } from '#/server/common/helpers/users/schemas.js'
import { addTripNote } from '#/server/common/helpers/trips/trips-service.js'
import {
  loadTrip,
  tripPath
} from '#/server/common/helpers/trips/trip-request.js'

// An empty note is ignored, as on the user and vessel profiles (validation is TBC)
export const notesPostController = {
  handler(request, h) {
    const { store, trip, actor } = loadTrip(request)
    const { values, errors } = validateForm(noteSchema, request.payload)

    if (!errors && values.note) {
      addTripNote(trip, values.note, actor)
      saveStore(request, store)
    }

    return h.redirect(tripPath(trip.tripId, '#notes'))
  }
}
