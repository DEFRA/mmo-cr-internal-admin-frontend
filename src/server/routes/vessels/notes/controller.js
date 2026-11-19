import { validateForm } from '#/server/common/helpers/forms/validation.js'
import { saveStore } from '#/server/common/helpers/admin-store/admin-store.js'
import { noteSchema } from '#/server/common/helpers/users/schemas.js'
import { addVesselNote } from '#/server/common/helpers/vessels/vessels-service.js'
import {
  loadVessel,
  vesselPath
} from '#/server/common/helpers/vessels/vessel-request.js'

// An empty note is ignored, as on the user profile (validation is TBC)
export const notesPostController = {
  handler(request, h) {
    const { store, vessel, actor } = loadVessel(request)
    const { values, errors } = validateForm(noteSchema, request.payload)

    if (!errors && values.note) {
      addVesselNote(vessel, values.note, actor)
      saveStore(request, store)
    }

    return h.redirect(vesselPath(vessel.id, '#notes'))
  }
}
