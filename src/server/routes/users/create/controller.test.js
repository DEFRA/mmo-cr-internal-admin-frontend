import { load } from 'cheerio'

import { createServer } from '#/server/server.js'
import { statusCodes } from '#/server/common/constants/status-codes.js'
import { createAgent } from '#/test-helpers/admin-agent.js'

const validUser = {
  'full-name': 'Test User',
  'email-address': 'test.user@example.com',
  'assisted-digital': 'no',
  'telephone-number': '',
  'address-line-1': '1 Harbour Road',
  'address-line-2': '',
  'address-town-city': 'Hastings',
  'address-postcode': 'TN34 3AA',
  administration: 'England'
}

const summaryErrors = ($) =>
  $('.govuk-error-summary__list a')
    .map((_i, el) => $(el).text())
    .get()

describe('#createUser', () => {
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

  test('Should show every error in the designed order when submitted empty', async () => {
    const { result, statusCode } = await agent.post('/users/create')
    const $ = load(result)

    expect(statusCode).toBe(statusCodes.ok)
    expect(summaryErrors($)).toEqual([
      'Enter a full name or company name',
      'Select whether the user needs assisted digital support',
      'Enter the first line of the address',
      'Enter a town or city',
      'Enter a postcode',
      'Enter an email address',
      'Select an administration'
    ])
  })

  test('Should not require an email address for assisted digital users', async () => {
    const { result } = await agent.post('/users/create', {
      'assisted-digital': 'yes'
    })
    const $ = load(result)

    expect(summaryErrors($)).not.toContain('Enter an email address')
    expect($('#assisted-digital').attr('checked')).toBeDefined()
  })

  test('Should keep entered values when re-showing the form', async () => {
    const { result } = await agent.post('/users/create', {
      ...validUser,
      'address-postcode': ''
    })
    const $ = load(result)

    expect(summaryErrors($)).toEqual(['Enter a postcode'])
    expect($('#full-name').val()).toBe('Test User')
    expect($('#administration option[selected]').val()).toBe('England')
  })

  test('Should create an invited user and show the confirmation', async () => {
    const created = await agent.post('/users/create', validUser)
    expect(created.headers.location).toBe('/users/create/confirmation/1432')

    const confirmation = load(
      (await agent.get(created.headers.location)).result
    )
    expect(confirmation('.govuk-panel__title').text().trim()).toBe(
      'User created'
    )
    expect(confirmation('.govuk-panel__body').text()).toContain(
      'test.user@example.com'
    )
    expect(confirmation('a[href="/users/1432"]').text()).toBe(
      'View user account'
    )

    const list = load((await agent.get('/users')).result)
    expect(
      list('[data-testid="users-table"] tbody tr').first().text()
    ).toContain('Invited')
  })
})
