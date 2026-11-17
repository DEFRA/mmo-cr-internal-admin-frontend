import { load } from 'cheerio'

import { createServer } from '#/server/server.js'
import { statusCodes } from '#/server/common/constants/status-codes.js'
import { createAgent } from '#/test-helpers/admin-agent.js'

const rows = ($, testId) =>
  $(`[data-testid="${testId}"] tbody tr`)
    .map((_i, el) => $(el).text().replace(/\s+/g, ' ').trim())
    .get()

describe('#vesselProfile', () => {
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

  test('Should show vessel details, linked users and tabs', async () => {
    const { result, statusCode } = await agent.get('/vessels/lady-jane')
    const $ = load(result)

    expect(statusCode).toBe(statusCodes.ok)
    expect($('h1').text()).toBe('Lady Jane')
    expect(
      $('.govuk-summary-list__key')
        .map((_i, el) => $(el).text().trim())
        .get()
    ).toEqual([
      'Vessel name',
      'PLN',
      'RSS',
      'Administration',
      'CFR number',
      'Admin port',
      'Port code',
      'Vessel type',
      'Status'
    ])
    expect(rows($, 'vessel-users')).toEqual([
      'John Smith 1234 Owner (Nominee) 1 June 2026'
    ])
    expect(
      $('.govuk-tabs__tab')
        .map((_i, el) => $(el).text().trim())
        .get()
    ).toEqual(['Users', 'Fishing trips', 'History', 'Notes'])
  })

  test('Should filter fishing trips by trip end date and status', async () => {
    const byDate = load(
      (
        await agent.get(
          '/vessels/northern-star?trip-end-date-day=20&trip-end-date-month=8&trip-end-date-year=2026'
        )
      ).result
    )
    const byStatus = load(
      (await agent.get('/vessels/lady-jane?status=amended')).result
    )

    expect(rows(byDate, 'vessel-trips')).toEqual([
      '20 August 2026 E45352202608201402 Alice Wilson Submitted'
    ])
    expect(rows(byStatus, 'vessel-trips')).toEqual([
      '14 June 2026 A12345202606151302 John Smith Amended'
    ])
    expect(byDate('#trip-trip-end-date-day').val()).toBe('20')
  })

  test('Should page the history 5 rows at a time', async () => {
    const first = load((await agent.get('/vessels/lady-jane')).result)
    const third = load(
      (await agent.get('/vessels/lady-jane?history-page=3')).result
    )

    expect(rows(first, 'vessel-history')).toHaveLength(5)
    expect(
      first('a[href="/vessels/lady-jane?history-page=2#history"]').length
    ).toBeGreaterThan(0)
    expect(rows(third, 'vessel-history')).toEqual([
      '1 June 2026, 09:15 Vessel added to user Maia Bates',
      '28 May 2026, 09:00 Vessel imported System'
    ])
  })

  test('Should show empty states for a vessel with no users or trips', async () => {
    const $ = load((await agent.get('/vessels/bubbles')).result)

    expect(rows($, 'vessel-users')).toEqual([
      'No users are linked to this vessel.'
    ])
    expect(rows($, 'vessel-trips')).toEqual([
      'No fishing trips recorded for Bubbles.'
    ])
    expect($('[data-testid="app-notes"]').text()).toContain(
      'No notes recorded for Bubbles.'
    )
  })

  test('Should number notes and show the newest note first', async () => {
    await agent.post('/vessels/quatro/notes', { note: 'Checked ownership.' })
    const $ = load((await agent.get('/vessels/quatro')).result)
    const notes = $('.app-notes__item')
      .map((_i, el) => $(el).text().replace(/\s+/g, ' ').trim())
      .get()

    expect(notes[0]).toContain('Note 2 · Sam Smith (Service Manager)')
    expect(notes[0]).toContain('Checked ownership.')
    expect(notes[1]).toContain('Note 1 · Maia Bates (Fishing Vessel Licensing)')
    expect(rows($, 'vessel-history')[0]).toContain('Note added')
  })

  test('Should return not found for an unknown vessel', async () => {
    const { statusCode } = await agent.get('/vessels/not-a-vessel')

    expect(statusCode).toBe(statusCodes.notFound)
  })
})
