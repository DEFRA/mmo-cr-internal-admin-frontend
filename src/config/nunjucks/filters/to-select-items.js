/**
 * Builds govukSelect items from options (strings or { value, text }).
 * Usage: {{ govukSelect({ items: options | toSelectItems(selected, "Select an option") }) }}
 */
export function toSelectItems(options = [], selected = '', placeholder = null) {
  const items = options.map((option) => {
    const { value, text } =
      typeof option === 'string' ? { value: option, text: option } : option
    return { value, text, selected: value === selected }
  })

  return placeholder === null
    ? items
    : [{ value: '', text: placeholder }, ...items]
}
