import { load } from 'cheerio'

import { createServer } from '#/server/server.js'
import { statusCodes } from '#/server/common/constants/status-codes.js'
import { createAgent } from '#/test-helpers/admin-agent.js'

const current = ($) =>
  $('[data-testid="current-service-message"]').text().trim()

describe('#bannerMessage', () => {
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

  test('Should show the current message and an empty form', async () => {
    const { result, statusCode } = await agent.get('/banner-message')
    const $ = load(result)

    expect(statusCode).toBe(statusCodes.ok)
    expect($('[aria-current="page"]').first().text()).toBe('Banner message')
    expect(current($)).toContain('may be slower than usual')
    expect($('#service-message').val()).toBe('')
    expect($('[data-testid="app-success-banner"]')).toHaveLength(0)
  })

  test('Should save a new message, confirm it once and keep it in the form', async () => {
    const { statusCode, headers } = await agent.post('/banner-message', {
      'service-message': '  Planned downtime on Sunday.  '
    })
    const $ = load((await agent.get('/banner-message')).result)
    const again = load((await agent.get('/banner-message')).result)

    expect(statusCode).toBe(statusCodes.found)
    expect(headers.location).toBe('/banner-message')
    expect($('[data-testid="app-success-banner"]').text()).toContain(
      'Service message updated'
    )
    expect(current($)).toBe('Planned downtime on Sunday.')
    expect($('#service-message').val()).toBe('Planned downtime on Sunday.')
    expect(again('[data-testid="app-success-banner"]')).toHaveLength(0)
  })

  test('Should keep the current message when an empty message is saved', async () => {
    await agent.post('/banner-message', { 'service-message': '   ' })
    const $ = load((await agent.get('/banner-message')).result)

    expect(current($)).toContain('may be slower than usual')
    expect($('[data-testid="app-success-banner"]')).toHaveLength(0)
  })
})
