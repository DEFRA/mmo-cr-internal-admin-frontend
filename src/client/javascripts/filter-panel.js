/**
 * Shows the "x" close button on the Filters panel (a <details> element that
 * already opens and closes without JavaScript).
 */
export function initFilterPanels(root = document) {
  root.querySelectorAll('[data-module="app-filter"]').forEach((details) => {
    const closeButton = details.querySelector('[data-filter-close]')
    if (!closeButton) return

    closeButton.hidden = false
    closeButton.addEventListener('click', () => {
      details.open = false
      details.querySelector('summary')?.focus()
    })
  })
}
