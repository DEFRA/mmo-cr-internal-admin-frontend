import { vi } from 'vitest'

import { statusCodes } from '#/server/common/constants/status-codes.js'

describe('#serveStaticFiles', () => {
  let server
  let startServer

  beforeAll(async () => {
    // Listen on a dedicated port so a running dev server (port 3000) does not clash
    vi.stubEnv('PORT', '3098')
    ;({ startServer } = await import('#/server/common/helpers/start-server.js'))
  })

  afterAll(() => {
    vi.unstubAllEnvs()
  })

  describe('When secure context is disabled', () => {
    beforeEach(async () => {
      server = await startServer()
    })

    afterEach(async () => {
      await server?.stop({ timeout: 0 })
    })

    test('Should serve favicon as expected', async () => {
      const { statusCode } = await server.inject({
        method: 'GET',
        url: '/favicon.ico'
      })

      expect(statusCode).toBe(statusCodes.noContent)
    })
  })
})
