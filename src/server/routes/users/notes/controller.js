import { validateForm } from '#/server/common/helpers/forms/validation.js'
import { addNote } from '#/server/common/helpers/users/users-service.js'
import {
  commitStore,
  loadUser,
  profilePath
} from '#/server/common/helpers/users/user-request.js'
import { noteSchema } from '#/server/common/helpers/users/schemas.js'

// An empty note is ignored, matching the prototype (validation is TBC)
export const notesPostController = {
  handler(request, h) {
    const { store, user, actor } = loadUser(request)
    const { values, errors } = validateForm(noteSchema, request.payload)

    if (!errors && values.note) {
      addNote(user, values.note, actor)
      commitStore(request, store)
    }

    return h.redirect(profilePath(user.id, '#notes'))
  }
}
