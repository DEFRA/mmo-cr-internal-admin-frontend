import { load } from 'cheerio'

import { createServer } from '#/server/server.js'
import { statusCodes } from '#/server/common/constants/status-codes.js'
import { createAgent } from '#/test-helpers/admin-agent.js'

describe('#placeholder', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should show a not-yet-available page for later sections with the nav item active', async () => {
    const agent = await createAgent(server).signIn()
    const { result, statusCode } = await agent.get(
      '/fishing-trips/A45352202606151201/amend'
    )
    const $ = load(result)

    expect(statusCode).toBe(statusCodes.ok)
    expect($('h1').text()).toBe('Amend catch recording')
    expect($('[aria-current="page"]').text()).toBe('Fishing trips')
    expect(result).toContain('not available yet')
  })
})
