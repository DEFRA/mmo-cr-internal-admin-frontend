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
      '/fishing-trips/C34245202608171402?gear-example=pots-trammel'
    )
    expect(
      $('#catch-breakdown h3')
        .map((_i, el) => $(el).text().trim())
        .get()
    ).toEqual(['Gear 1: Pots', 'Gear 2: Trammel net'])
    expect($('[data-testid="catch-table"]')).toHaveLength(2)
  })

  test('Should open Option 2 with all the trip information in one list', async () => {
    const agent = await createAgent(server).signIn()
    const { headers } = await agent.get('/trip-layouts/option-2')
    const $ = load((await agent.get(headers.location)).result)
    const keys = $('[data-testid="trip-information"] .govuk-summary-list__key')
      .map((_i, el) => $(el).text().trim())
      .get()

    expect(headers.location).toBe(
      '/fishing-trips/C34245202608171402?gear-example=pots-trammel&information=all'
    )
    expect(keys).toHaveLength(16)
    expect(keys.slice(-2)).toEqual(['Late submission', 'Submission method'])
    expect($('.govuk-details')).toHaveLength(0)
    expect($('[data-testid="catch-table"]')).toHaveLength(2)
  })
})
