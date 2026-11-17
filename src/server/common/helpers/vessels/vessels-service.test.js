import { filterVesselTrips, toIsoDate } from './vessels-service.js'

describe('#vesselsService', () => {
  test('Should only accept real dates', () => {
    expect(toIsoDate({ day: '29', month: '2', year: '2026' })).toBeNull()
    expect(toIsoDate({ day: '5', month: '6', year: '2026' })).toBe('2026-06-05')
    expect(toIsoDate({ day: '', month: '6', year: '2026' })).toBeNull()
  })

  test('Should match trip user names case-insensitively', () => {
    const trips = [
      {
        endDate: '2026-06-16T00:00:00.000Z',
        user: 'John Smith',
        status: 'submitted'
      },
      {
        endDate: '2026-06-14T00:00:00.000Z',
        user: 'Alice Wilson',
        status: 'amended'
      }
    ]

    expect(filterVesselTrips(trips, { user: 'alice' })).toEqual([trips[1]])
  })
})
