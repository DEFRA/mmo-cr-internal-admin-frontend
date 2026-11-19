/**
 * Builds govukPagination params, preserving the current query string.
 */
export function buildPagination({
  basePath,
  query = {},
  page,
  totalPages,
  pageParam = 'page',
  hash = ''
}) {
  if (totalPages <= 1) {
    return null
  }

  const hrefFor = (pageNumber) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      if (key === pageParam) continue
      for (const item of [].concat(value ?? [])) {
        if (item !== '') params.append(key, item)
      }
    }
    if (pageNumber > 1) params.set(pageParam, String(pageNumber))
    const search = params.toString()
    return `${search ? `${basePath}?${search}` : basePath}${hash}`
  }

  return {
    previous: page > 1 ? { href: hrefFor(page - 1) } : null,
    next: page < totalPages ? { href: hrefFor(page + 1) } : null,
    items: Array.from({ length: totalPages }, (_, index) => ({
      number: index + 1,
      href: hrefFor(index + 1),
      current: index + 1 === page
    }))
  }
}

export function paginate(items, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPages)
  const start = (currentPage - 1) * pageSize

  return {
    items: items.slice(start, start + pageSize),
    page: currentPage,
    totalPages
  }
}
