import { buildNavigation } from './build-navigation.js'

describe('#buildNavigation', () => {
  test('Should list the admin sections with none current on other paths', () => {
    const navigation = buildNavigation({ path: '/' })

    expect(navigation.map((item) => item.text)).toEqual([
      'Users',
      'Vessels',
      'Fishing trips',
      'Trip breakdown',
      'Audit log',
      'Banner message'
    ])
    expect(navigation.some((item) => item.current)).toBe(false)
  })

  test('Should mark the section current for its child pages', () => {
    const navigation = buildNavigation({ path: '/users/1235/amend' })

    expect(navigation.find((item) => item.current)).toEqual({
      text: 'Users',
      href: '/users',
      current: true
    })
  })

  test('Should mark Fishing trips current for the trip layout pages', () => {
    const navigation = buildNavigation({ path: '/trip-layouts/archive' })

    expect(navigation.filter((item) => item.current)).toEqual([
      { text: 'Fishing trips', href: '/fishing-trips', current: true }
    ])
  })

  test('Should not treat a path prefix as the same section', () => {
    const navigation = buildNavigation({ path: '/usersettings' })

    expect(navigation.some((item) => item.current)).toBe(false)
  })
})
