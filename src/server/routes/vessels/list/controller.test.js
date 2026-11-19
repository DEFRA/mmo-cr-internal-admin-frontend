import { load } from 'cheerio'

import { createServer } from '#/server/server.js'
import { statusCodes } from '#/server/common/constants/status-codes.js'
import { createAgent } from '#/test-helpers/admin-agent.js'

const names = ($) =>
  $('[data-testid="vessels-table"] tbody tr td:first-child')
    .map((_i, el) => $(el).text().trim())
    .get()

describe('#vesselsList', () => {
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

  test('Should list vessels 10 per page with the Vessels nav item current', async () => {
    const { result, statusCode } = await agent.get('/vessels')
    const $ = load(result)

    expect(statusCode).toBe(statusCodes.ok)
    expect(names($)).toHaveLength(10)
    expect(names($)[0]).toBe('Lady Jane')
    expect($('[aria-current="page"]').first().text()).toBe('Vessels')
    expect(
      names(load((await agent.get('/vessels?page=3')).result))
    ).toHaveLength(7)
  })

  test('Should search by name, PLN, RSS or CFR number', async () => {
    const byPln = load((await agent.get('/vessels?s=wy43')).result)
    const byCfr = load((await agent.get('/vessels?s=GBR000100021')).result)

    expect(names(byPln)).toEqual(['Quatro'])
    expect(names(byCfr)).toEqual(['Bubbles'])
  })

  test('Should combine filters and keep them selected', async () => {
    const { result } = await agent.get(
      '/vessels?status=inactive&administration=England&admin-port=grim'
    )
    const $ = load(result)

    expect(names($)).toEqual(['Kingfisher', 'Ocean Drifter'])
    expect(
      $('input[name="status"][value="inactive"]').attr('checked')
    ).toBeDefined()
    expect($('input[name="admin-port"]').val()).toBe('grim')
  })

  test('Should show a message when nothing matches', async () => {
    const $ = load((await agent.get('/vessels?s=zzzz')).result)

    expect($('[data-testid="vessels-empty"]').text()).toBe(
      'No vessels match your search or filters.'
    )
  })

  test('Should export the matching vessels as CSV', async () => {
    const list = load((await agent.get('/vessels?status=inactive')).result)
    const exportHref = list('a.govuk-button--secondary').attr('href')
    const response = await agent.get(exportHref)

    expect(exportHref).toBe('/vessels/export?status=inactive')
    expect(response.headers['content-type']).toContain('text/csv')
    expect(response.headers['content-disposition']).toContain('vessels.csv')
    expect(response.payload.split('\n')).toEqual([
      'Vessel,PLN,RSS,Administration,Admin port,Port code,CFR number,Status',
      'Ocean Pearl,MH12,RSS567,Wales,Milford Haven,MH,GBR000567890,Inactive',
      'Kingfisher,GY67,X10004,England,Grimsby,GY,GBR000100003,Inactive',
      'Harvest Moon,PZ56,X10009,England,Newlyn,GBNLY,GBR000100008,Inactive',
      'Ocean Drifter,GY12,X10017,England,Grimsby,GY,GBR000100016,Inactive'
    ])
  })
})
