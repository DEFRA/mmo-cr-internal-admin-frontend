import { load } from 'cheerio'

import { createServer } from '#/server/server.js'
import { createAgent } from '#/test-helpers/admin-agent.js'

describe('#userNotes', () => {
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

  test('Should save a note with the author and role', async () => {
    const saved = await agent.post('/users/1235/notes', {
      note: 'Called user to confirm vessel details.'
    })
    const $ = load((await agent.get('/users/1235')).result)

    expect(saved.headers.location).toBe('/users/1235#notes')
    expect($('.app-notes__item').first().text()).toContain('Sam Smith')
    expect($('.app-notes__item').first().text()).toContain(
      'Called user to confirm vessel details.'
    )
  })

  test('Should ignore an empty note', async () => {
    await agent.post('/users/1235/notes', { note: '   ' })
    const $ = load((await agent.get('/users/1235')).result)

    expect($('.app-notes__item')).toHaveLength(0)
    expect($('[data-testid="app-notes"]').text()).toContain(
      'No notes recorded for this user.'
    )
  })
})
