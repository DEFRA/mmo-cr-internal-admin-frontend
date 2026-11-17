import { buildPagination, paginate } from './pagination.js'

describe('#pagination', () => {
  test('Should clamp the page to the available range', () => {
    const items = Array.from({ length: 15 }, (_, index) => index)

    expect(paginate(items, 9, 10)).toEqual({
      items: [10, 11, 12, 13, 14],
      page: 2,
      totalPages: 2
    })
  })

  test('Should keep search and filters in page links', () => {
    const pagination = buildPagination({
      basePath: '/users',
      query: { s: 'smith', status: ['invited', 'accepted'], page: 1 },
      page: 1,
      totalPages: 2
    })

    expect(pagination.previous).toBeNull()
    expect(pagination.next.href).toBe(
      '/users?s=smith&status=invited&status=accepted&page=2'
    )
    expect(pagination.items[0]).toEqual({
      number: 1,
      href: '/users?s=smith&status=invited&status=accepted',
      current: true
    })
  })

  test('Should not paginate a single page', () => {
    expect(
      buildPagination({ basePath: '/users', page: 1, totalPages: 1 })
    ).toBeNull()
  })
})
