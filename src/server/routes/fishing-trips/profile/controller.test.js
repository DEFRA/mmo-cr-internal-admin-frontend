import { load } from 'cheerio'

import { createServer } from '#/server/server.js'
import { statusCodes } from '#/server/common/constants/status-codes.js'
import { createAgent } from '#/test-helpers/admin-agent.js'

const AMENDED = '/fishing-trips/A45352202606151201'

const clean = (text) => text.replace(/\s+/g, ' ').trim()
const rows = ($, testId) =>
  $(`[data-testid="${testId}"] tbody tr`)
    .map((_i, row) =>
      clean(
        $(row)
          .children()
          .map((_j, cell) => $(cell).text())
          .get()
          .join(' ')
      )
    )
    .get()
const notice = ($) => clean($('[data-testid="trip-version-notice"]').text())

describe('#fishingTripProfile', () => {
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

  test('Should show the latest amendment with trip information and catch', async () => {
    const { result, statusCode } = await agent.get(AMENDED)
    const $ = load(result)

    expect(statusCode).toBe(statusCodes.ok)
    expect(clean($('h1').text())).toContain('Trip A45352202606151201')
    expect(notice($)).toBe(
      'You are viewing Amendment 3 (current). View amended records'
    )
    expect($('a[href="/vessels/quatro"]').text()).toBe('Quatro')
    expect(rows($, 'catch-table')).toEqual([
      'Spinous spider crab SCR 16.00 3.00'
    ])
    expect(rows($, 'trip-history')[0]).toContain('Amendment 3')
    expect(clean($('[data-testid="trip-actions"]').text())).toBe(
      'View original record View amended records Download PDF'
    )
  })

  test('Should show the original record and older amendments', async () => {
    const original = load(
      (await agent.get(`${AMENDED}?version=original`)).result
    )
    const older = load(
      (await agent.get(`${AMENDED}?version=amendment-1`)).result
    )
    const current = load((await agent.get(`${AMENDED}?version=current`)).result)

    expect(
      clean(original('[data-testid="app-page-heading-caption"]').text())
    ).toBe('Original submitted record')
    expect(notice(original)).toBe(
      'Original record submitted by Peter Petrelli on 15 June 2026, 12:01.'
    )
    expect(rows(original, 'catch-table')).toEqual([
      'Spinous spider crab SCR 14.00'
    ])
    expect(original('[data-testid="trip-actions"]').text()).not.toContain(
      'View original record'
    )
    expect(notice(older)).toBe(
      'You are viewing Amendment 1. Return to amended records'
    )
    expect(rows(older, 'catch-table')).toEqual([
      'Spinous spider crab SCR 15.00'
    ])
    expect(notice(current)).toBe(
      'You are viewing Amendment 3 (current). Return to trip details'
    )
  })

  test('Should return not found for unknown trips, trips without a profile and missing amendments', async () => {
    const statuses = await Promise.all(
      [
        '/fishing-trips/Z99999',
        '/fishing-trips/A12345202606171701',
        `${AMENDED}?version=amendment-9`
      ].map(async (url) => (await agent.get(url)).statusCode)
    )

    expect(statuses).toEqual([
      statusCodes.notFound,
      statusCodes.notFound,
      statusCodes.notFound
    ])
  })

  test('Should add a numbered note at the top and record it in the history', async () => {
    const { statusCode, headers } = await agent.post(`${AMENDED}/notes`, {
      note: 'Called the skipper.'
    })
    const $ = load((await agent.get(AMENDED)).result)
    const notes = $('.app-notes__item')
      .map((_i, el) => clean($(el).text()))
      .get()

    expect(statusCode).toBe(statusCodes.found)
    expect(headers.location).toBe(`${AMENDED}#notes`)
    expect(notes).toHaveLength(4)
    expect(notes[0]).toContain('Note 4 · Sam Smith')
    expect(notes[0]).toContain('Called the skipper.')
    expect(rows($, 'trip-history')[0]).toContain('Note added')
  })

  test('Should list every version with download links', async () => {
    const $ = load((await agent.get(`${AMENDED}/versions`)).result)
    const versions = rows($, 'trip-versions')

    expect(clean($('h1').text())).toContain('Version history')
    expect(versions).toHaveLength(4)
    expect(versions.join('|')).toContain('Original')
    expect(versions.join('|')).toContain('Amendment 3')
  })
})
