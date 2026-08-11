import { describe, expect, it } from 'vitest'

import { createCsvContent } from '@/utils/csv'
import {
  currencyFormatter,
  numberFormatter,
  percentFormatter,
  timeFormatter,
} from '@/utils/formatters'

describe('formatters', () => {
  it('formats dashboard values consistently', () => {
    expect(currencyFormatter.format(1234.5)).toBe('£1,235')
    expect(numberFormatter.format(1234)).toBe('1,234')
    expect(percentFormatter.format(0.123)).toBe('12.3%')
    expect(timeFormatter.format(new Date(2026, 0, 1, 9, 5))).toBe('09:05')
  })
})

describe('createCsvContent', () => {
  it('quotes values and escapes embedded quotes', () => {
    expect(
      createCsvContent([
        ['Name', 'Revenue'],
        ['North "Enterprise"', 1250],
        [null, undefined],
      ]),
    ).toBe('"Name","Revenue"\n"North ""Enterprise""","1250"\n"",""')
  })
})
