import { load } from 'cheerio'

import { createServer } from '#/server/server.js'
import { createAgent } from '#/test-helpers/admin-agent.js'

describe('#userVessels', () => {
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

  test('Should require a vessel to be selected', async () => {
    const { result } = await agent.post('/users/1235/vessels/add', {
      vessel: '',
      role: 'Owner (Nominee)'
    })
    const $ = load(result)

    expect($('.govuk-error-summary__list').text()).toContain('Select a vessel')
  })

  test('Should link a vessel, then remove it', async () => {
    const added = await agent.post('/users/1235/vessels/add', {
      vessel: 'lady-jane',
      role: 'Skipper (Master)'
    })
    const profile = load((await agent.get(added.headers.location)).result)

    expect(profile('[data-testid="app-success-banner"]').text()).toContain(
      'Vessel added'
    )
    expect(profile('[data-testid="user-vessels"] tbody').text()).toContain(
      'Skipper (Master)'
    )

    const addForm = load((await agent.get('/users/1235/vessels/add')).result)
    expect(addForm('#vessel option[value="lady-jane"]')).toHaveLength(0)

    const removed = await agent.post('/users/1235/vessels/remove', {
      vessel: 'lady-jane'
    })
    const after = load((await agent.get(removed.headers.location)).result)

    expect(after('[data-testid="app-success-banner"]').text()).toContain(
      'Vessel removed'
    )
    expect(after('[data-testid="user-vessels"]')).toHaveLength(0)
  })

  test('Should explain when there are no vessels to remove', async () => {
    const $ = load((await agent.get('/users/1236/vessels/remove')).result)

    expect($('[data-testid="no-vessels-to-remove"]').text()).toBe(
      'No eligible vessels are available to remove.'
    )
    expect($('form[action="/users/1236/vessels/remove"]')).toHaveLength(0)
  })
})
