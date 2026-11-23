import { load } from 'cheerio'

import { createServer } from '#/server/server.js'
import { statusCodes } from '#/server/common/constants/status-codes.js'
import { createAgent } from '#/test-helpers/admin-agent.js'

const column = ($, index) =>
  $(`[data-testid="audit-log-table"] tbody tr td:nth-child(${index})`)
    .map((_i, el) => $(el).text().trim())
    .get()

describe('#auditLog', () => {
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

  test('Should list entries newest first, 10 per page, with the Audit log nav item current', async () => {
    const { result, statusCode } = await agent.get('/audit-log')
    const $ = load(result)

    expect(statusCode).toBe(statusCodes.ok)
    expect(column($, 1)).toHaveLength(10)
    expect(column($, 1)[0]).toBe('30 August 2026, 14:18')
    expect($('[aria-current="page"]').first().text()).toBe('Audit log')
    expect(
      column(load((await agent.get('/audit-log?page=6')).result), 1)
    ).toHaveLength(10)
  })

  test('Should link references and user IDs to records in the portal', async () => {
    const $ = load((await agent.get('/audit-log?s=C34245202608171402')).result)
    const vessels = load(
      (await agent.get('/audit-log?record-type=vessel')).result
    )
    const users = load((await agent.get('/audit-log?s=ethan')).result)

    expect($('a[href="/fishing-trips/C34245202608171402#notes"]')).toHaveLength(
      2
    )
    expect($('a[href="/users/1237"]').first().text()).toBe('1237')
    expect(vessels('a[href="/vessels/lady-jane"]').first().text()).toBe('PZ1')
    expect(users('a[href="/users/1431"]').first().text()).toBe('Ethan Adams')
    expect(column(users, 5)).toEqual(['–'])
  })

  test('Should show an unknown vessel reference as plain text', async () => {
    const $ = load((await agent.get('/audit-log?s=B34561')).result)

    expect(column($, 3)).toEqual(['B34561'])
    expect($('[data-testid="audit-log-table"] td:nth-child(3) a')).toHaveLength(
      0
    )
  })

  test('Should combine the date, performed by and record type filters', async () => {
    const { result } = await agent.get(
      '/audit-log?date-from-day=15&date-from-month=6&date-from-year=2026' +
        '&date-to-day=16&date-to-month=6&date-to-year=2026' +
        '&performed-by=lucy&record-type=trip'
    )
    const $ = load(result)

    expect(column($, 4)).toEqual([
      'Amendment 3: Added 3 kg retained weight omitted from the original submission',
      'Amendment 2: Updated the weight to 16 kg following a call with Peter',
      'Amendment 1: Corrected catch weight for lemon sole',
      'Amendment 1: Corrected the reported weight to 15 kg',
      'Note added'
    ])
    expect(
      $('input[name="record-type"][value="trip"]').attr('checked')
    ).toBeDefined()
    expect($('details.app-filter').attr('open')).toBeUndefined()
  })

  test('Should keep the filters closed for a search and show an empty message when nothing matches', async () => {
    const $ = load((await agent.get('/audit-log?s=nothing-here')).result)

    expect($('details.app-filter').attr('open')).toBeUndefined()
    expect($('[data-testid="audit-log-empty"]').text()).toBe(
      'No audit log entries match your search or filters.'
    )
  })
})
