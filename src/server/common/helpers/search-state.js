const SEARCHES_KEY = 'listSearches'

export const LIST_PATHS = [
  '/users',
  '/vessels',
  '/fishing-trips',
  '/trip-breakdown',
  '/audit-log'
]

/**
 * Remembers the search, filters and page last used on a list page so that
 * "Back to ..." links from a record return to the same results.
 */
export function rememberSearch(request) {
  if (request.method !== 'get' || !LIST_PATHS.includes(request.path)) return
  const searches = request.yar.get(SEARCHES_KEY) ?? {}
  searches[request.path] = request.url.search.replace(/^\?/, '')
  request.yar.set(SEARCHES_KEY, searches)
}

export function listHref(request, path) {
  const search = request.yar?.get(SEARCHES_KEY)?.[path]
  return search ? `${path}?${search}` : path
}
