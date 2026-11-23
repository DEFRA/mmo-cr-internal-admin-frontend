import { load } from 'cheerio'

import { createServer } from '#/server/server.js'
import { statusCodes } from '#/server/common/constants/status-codes.js'
import { createAgent } from '#/test-helpers/admin-agent.js'

const tripIds = ($) =>
  $('[data-testid="trips-table"] tbody tr td:nth-child(2)')
    .map((_i, el) => $(el).text().trim())
    .get()

describe('#fishingTripsList', () => {
  let server
  let agent

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  beforeEach(async () => {
    agent = await createAgent(server).signIn()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should list trips 10 per page and link every trip ID', async () => {
    const { result, statusCode } = await agent.get('/fishing-trips')
    const $ = load(result)

    expect(statusCode).toBe(statusCodes.ok)
    expect(tripIds($)).toHaveLength(10)
    expect($('[aria-current="page"]').first().text()).toBe('Fishing trips')
    expect($('a[href="/fishing-trips/J12345202608301410"]').text().trim()).toBe(
      'J12345202608301410'
    )
    expect(
      $('[data-testid="trips-table"] tbody td:nth-child(2) a')
    ).toHaveLength(10)
    expect(
      tripIds(load((await agent.get('/fishing-trips?page=4')).result))
    ).toHaveLength(2)
  })

  test('Should search by trip ID, vessel, PLN or status', async () => {
    const byId = load((await agent.get('/fishing-trips?s=a45352')).result)
    const byStatus = load((await agent.get('/fishing-trips?s=late')).result)

    expect(tripIds(byId)).toEqual(['A45352202606151201'])
    expect(tripIds(byStatus)).toHaveLength(5)
  })

  test('Should filter by trip end date range and keep the dates entered', async () => {
    const { result } = await agent.get(
      '/fishing-trips?trip-end-date-from-day=1&trip-end-date-from-month=6&trip-end-date-from-year=2026' +
        '&trip-end-date-to-day=3&trip-end-date-to-month=6&trip-end-date-to-year=2026'
    )
    const $ = load(result)

    expect(tripIds($).sort()).toEqual([
      'K10011202606030200',
      'L10012202606020100',
      'M10013202606010000'
    ])
    expect($('input[name="trip-end-date-to-day"]').val()).toBe('3')
  })

  test('Should combine vessel, created by, status and submission method filters', async () => {
    const byVessel = load(
      (await agent.get('/fishing-trips?vessel=sea%20otter&created-by=frank'))
        .result
    )
    const byMethod = load(
      (
        await agent.get(
          '/fishing-trips?status=amended&submission-method=automated'
        )
      ).result
    )

    expect(tripIds(byVessel)).toEqual(['C34245202608171402'])
    expect(tripIds(byMethod)).toEqual([
      'A12345202606151302',
      'H10008202606060500'
    ])
    expect(
      byMethod('input[name="submission-method"][value="automated"]').attr(
        'checked'
      )
    ).toBeDefined()
  })

  test('Should show an empty message when nothing matches', async () => {
    const $ = load((await agent.get('/fishing-trips?s=nothing-here')).result)

    expect($('[data-testid="trips-empty"]').text()).toBe(
      'No fishing trips match your filters.'
    )
  })

  test('Should filter by admin port and RSS number', async () => {
    const $ = load(
      (await agent.get('/fishing-trips?admin-port=hastings&rss=X10010')).result
    )

    expect(tripIds($).sort()).toEqual([
      'C34245202608171402',
      'I10009202606050400'
    ])
    expect($('input[name="admin-port"]').val()).toBe('hastings')
  })

  test('Should export the filtered trips with admin port, RSS and user role', async () => {
    const { result, headers } = await agent.get(
      '/fishing-trips/export?admin-port=hastings&rss=X10010'
    )
    const [header, ...rows] = result.trim().split(/\r?\n/)

    expect(headers['content-type']).toContain('text/csv')
    expect(header).toContain('RSS,Admin port,Created by,User role')
    expect(rows).toHaveLength(2)
    expect(result).toContain('X10010,Hastings,Frank Castle,Owner (Nominee)')
  })

  test('Should keep the search for the back link from a trip', async () => {
    await agent.get('/fishing-trips?admin-port=hastings&page=1')
    const $ = load(
      (await agent.get('/fishing-trips/C34245202608171402')).result
    )

    expect($('.govuk-back-link').attr('href')).toBe(
      '/fishing-trips?admin-port=hastings&page=1'
    )
  })
})
