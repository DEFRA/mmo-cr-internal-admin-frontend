import accessibleAutocomplete from 'accessible-autocomplete'

/**
 * Enhances <select data-module="app-autocomplete"> into a type-ahead search.
 * Without JavaScript the native select still works (progressive enhancement).
 */
export function initAutocompletes(root = document) {
  root
    .querySelectorAll('select[data-module="app-autocomplete"]')
    .forEach((selectElement) => {
      const noun = selectElement.dataset.resultNoun ?? 'results'

      accessibleAutocomplete.enhanceSelectElement({
        selectElement,
        defaultValue: '',
        showAllValues: false,
        dropdownArrow: () => '',
        tNoResults: () => `No ${noun} found`,
        tStatusResults: (length, contentSelectedOption) =>
          `${length} ${noun} found. ${contentSelectedOption}`
      })
    })
}
