import { load } from 'cheerio'

import { createServer } from '#/server/server.js'
import { statusCodes } from '#/server/common/constants/status-codes.js'
import { createAgent } from '#/test-helpers/admin-agent.js'

describe('#tripLayoutsArchive', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should list the archived layouts, each opening the example trip in a new tab', async () => {
    const agent = await createAgent(server).signIn()
    const { result, statusCode } = await agent.get('/trip-layouts/archive')
    const $ = load(result)
    const links = $('[data-testid="archived-layouts"] a')

    expect(statusCode).toBe(statusCodes.ok)
    expect($('h1').text()).toBe('Archived layouts')
    expect($('.govuk-back-link').attr('href')).toBe('/')
    expect($('[aria-current="page"]').first().text()).toBe('Fishing trips')
    expect(links).toHaveLength(9)
    expect(links.map((_i, el) => $(el).text().split(/[ :]/)[0]).get()).toEqual([
      'A',
      'A2',
      'B',
      'B2',
      'C',
      'E',
      'E2',
      'F',
      'F2'
    ])
    expect(links.first().text()).toBe('A (as-is) (opens in new tab)')
    expect(links.map((_i, el) => $(el).attr('href')).get()).toEqual(
      Array(9).fill('/fishing-trips/C34245202608171402')
    )
    expect(links.first().attr('target')).toBe('_blank')
  })

  test('Should open Option 1 as the example trip with its Pots and Trammel net gears only', async () => {
    const agent = await createAgent(server).signIn()
    const { statusCode, headers } = await agent.get('/trip-layouts/option-1')
    const $ = load((await agent.get(headers.location)).result)

    expect(statusCode).toBe(statusCodes.found)
    expect(headers.location).toBe(
      '/fishing-trips/C34245202608171402?gear-example=pots-trammel&layout=a'
    )
    expect(
      $('#catch-breakdown h3')
        .map((_i, el) => $(el).text().trim())
        .get()
    ).toEqual(['Gear 1: Pots', 'Gear 2: Trammel net'])
    expect($('[data-testid="catch-table"]')).toHaveLength(2)
  })

  test('Should open Option 2 with trip details and status in two columns', async () => {
    const agent = await createAgent(server).signIn()
    const { headers } = await agent.get('/trip-layouts/option-2')
    const $ = load((await agent.get(headers.location)).result)
    const columns = $(
      '[data-testid="trip-information"] .govuk-grid-column-one-half'
    )
      .map((_i, el) =>
        $(el)
          .find('.govuk-summary-list__key')
          .map((_j, key) => $(key).text().trim())
          .get()
          .join('|')
      )
      .get()

    expect(headers.location).toBe(
      '/fishing-trips/C34245202608171402?layout=two-column'
    )
    expect($('h1').text()).toBe('Trip details')
    expect($('h1').hasClass('govuk-visually-hidden')).toBe(true)
    expect(columns).toEqual([
      'Trip ID|Vessel name|PLN|Created by|User role|Departure date|Departure port|Return date|Return port',
      'Status|Created on|Received on|Submission method|Amended|Retained catch|Admin port|Admin port code'
    ])
    expect($('[data-testid="catch-table"]')).toHaveLength(3)
  })
})
