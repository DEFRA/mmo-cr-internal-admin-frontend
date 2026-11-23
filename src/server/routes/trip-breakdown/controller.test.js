import { load } from 'cheerio'

import { createServer } from '#/server/server.js'
import { statusCodes } from '#/server/common/constants/status-codes.js'
import { createAgent } from '#/test-helpers/admin-agent.js'

const species = ($) =>
  $('[data-testid="breakdown-table"] tbody tr td:nth-child(8)')
    .map((_i, el) => $(el).text().trim())
    .get()

describe('#tripBreakdown', () => {
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

  test('Should list catch entries 10 per page and link every trip ID', async () => {
    const { result, statusCode } = await agent.get('/trip-breakdown')
    const $ = load(result)

    expect(statusCode).toBe(statusCodes.ok)
    expect(species($)).toHaveLength(10)
    expect($('[aria-current="page"]').first().text()).toBe('Trip breakdown')
    expect($('a[href="/fishing-trips/J12345202608301410"]')).toHaveLength(2)
    expect(
      species(load((await agent.get('/trip-breakdown?page=5')).result))
    ).toHaveLength(2)

    const other = load(
      (await agent.get('/trip-breakdown?s=A12345202606171701')).result
    )
    expect(
      other('[data-testid="breakdown-table"] tbody a').first().attr('href')
    ).toBe('/fishing-trips/A12345202606171701')
    expect(
      other('[data-testid="breakdown-table"] tbody td:last-child')
        .first()
        .text()
    ).toBe('–')
  })

  test('Should search by trip ID, vessel, PLN, species or FAO code', async () => {
    const bySpecies = load(
      (await agent.get('/trip-breakdown?s=lobster')).result
    )
    const byFao = load((await agent.get('/trip-breakdown?s=QSC')).result)

    expect(species(bySpecies)).toEqual(['European lobster'])
    expect(species(byFao)).toEqual(['Queen scallop', 'Queen scallop'])
  })

  test('Should combine the date, species, gear, port and weight filters', async () => {
    const { result } = await agent.get(
      '/trip-breakdown?trip-end-date-from-day=1&trip-end-date-from-month=8&trip-end-date-from-year=2026' +
        '&species=cod&gear-type=gillnets&port=newlyn&weight-min=10&weight-max=20'
    )
    const $ = load(result)

    expect(species($)).toEqual(['Cod'])
    expect(
      $('[data-testid="breakdown-table"] tbody td:nth-child(2)').text().trim()
    ).toBe('F34245202608221410')
    expect($('input[name="weight-min"]').val()).toBe('10')
    expect($('input[name="trip-end-date-from-month"]').val()).toBe('8')
  })

  test('Should ignore a weight that is not a number and show an empty message when nothing matches', async () => {
    const ignored = load(
      (await agent.get('/trip-breakdown?weight-min=abc')).result
    )
    const none = load(
      (await agent.get('/trip-breakdown?weight-min=1000')).result
    )

    expect(species(ignored)).toHaveLength(10)
    expect(none('[data-testid="breakdown-empty"]').text()).toBe(
      'No catch entries match your search or filters.'
    )
  })

  test('Should export the matching entries with the extra trip details as CSV', async () => {
    const list = load(
      (await agent.get('/trip-breakdown?species=whelk&page=1')).result
    )
    const exportHref = list('a.govuk-button--secondary').attr('href')
    const { result, headers } = await agent.get(exportHref)
    const [header, ...rows] = result.split('\n')

    expect(exportHref).toBe('/trip-breakdown/export?species=whelk')
    expect(headers['content-disposition']).toBe(
      'attachment; filename="trip-breakdown.csv"'
    )
    expect(header.split(',')).toHaveLength(28)
    expect(header).toContain('Weight discarded (kg),Trip notes')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatch(
      /^17 August 2026,C34245202608171402,.*,Whelk,WHE,Pots,26,22,/
    )
  })
})
