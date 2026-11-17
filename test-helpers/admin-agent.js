/**
 * Test agent for server.inject that keeps cookies between requests, adds the
 * CSRF crumb to form posts and can sign in with the mock admin sign-in.
 */
export function createAgent(server) {
  const jar = new Map()

  const storeCookies = (response) => {
    const setCookie = [].concat(response.headers['set-cookie'] ?? [])
    for (const cookie of setCookie) {
      const [pair] = cookie.split(';')
      const index = pair.indexOf('=')
      jar.set(pair.slice(0, index), pair.slice(index + 1))
    }
  }

  const cookieHeader = () =>
    [...jar.entries()].map(([name, value]) => `${name}=${value}`).join('; ')

  const request = async (options) => {
    const response = await server.inject({
      ...options,
      headers: { ...options.headers, cookie: cookieHeader() }
    })
    storeCookies(response)
    return response
  }

  const agent = {
    get: (url) => request({ method: 'GET', url }),
    async post(url, payload = {}) {
      if (!jar.has('crumb')) {
        await agent.get('/sign-in')
      }
      return request({
        method: 'POST',
        url,
        payload: { crumb: jar.get('crumb'), ...payload }
      })
    },
    async signIn() {
      await agent.get('/sign-in')
      await agent.post('/sign-in', {
        email: 'preview@example.test',
        password: 'password'
      })
      return agent
    }
  }

  return agent
}
