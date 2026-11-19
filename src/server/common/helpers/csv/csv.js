// Values starting with these characters are run as formulas by spreadsheet apps
const FORMULA_PREFIX = /^[=+\-@]/

export const csvCell = (value) => {
  const raw = String(value ?? '')
  const text = FORMULA_PREFIX.test(raw) ? `'${raw}` : raw
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export const toCsv = (rows) =>
  rows.map((row) => row.map(csvCell).join(',')).join('\n')

/**
 * Link for an "Export ... data" button: the export path plus the current
 * search and filters, without the page number.
 */
export function exportHref(path, query) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (key === 'page') continue
    for (const item of [].concat(value)) {
      if (item !== '') params.append(key, item)
    }
  }
  const search = params.toString()
  return search ? `${path}?${search}` : path
}
