import { toCsv } from './csv.js'

describe('#toCsv', () => {
  test('Should quote values that need it and neutralise spreadsheet formulas', () => {
    expect(toCsv([['a,b', 'say "hi"', '=SUM(A1)', '-1', 'plain']])).toBe(
      `"a,b","say ""hi""",'=SUM(A1),'-1,plain`
    )
  })
})
