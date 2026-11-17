import {
  createAll,
  Button,
  Checkboxes,
  ErrorSummary,
  NotificationBanner,
  Radios,
  SkipLink,
  Tabs
} from 'govuk-frontend'
import cookies from './cookies.js'
import { initAutocompletes } from './autocomplete.js'
import { initFilterPanels } from './filter-panel.js'

cookies.init()

createAll(Button)
createAll(Checkboxes)
createAll(ErrorSummary)
createAll(NotificationBanner)
createAll(Radios)
createAll(SkipLink)
createAll(Tabs)

initAutocompletes()
initFilterPanels()
