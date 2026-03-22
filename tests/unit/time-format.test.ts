import { describe, it, expect } from 'vitest'
import { formatTime, parseTime, formatFileSize } from '../../src/utils/time-format'

describe('formatTime', () => {
  it('formats zero seconds as 0:00', () => {
    expect(formatTime(0)).toBe('0:00')
  })

  it('formats seconds less than a minute', () => {
    expect(formatTime(5)).toBe('0:05')
    expect(formatTime(30)).toBe('0:30')
    expect(formatTime(59)).toBe('0:59')
  })

  it('formats exact minutes', () => {
    expect(formatTime(60)).toBe('1:00')
    expect(formatTime(120)).toBe('2:00')
    expect(formatTime(600)).toBe('10:00')
  })

  it('formats minutes and seconds', () => {
    expect(formatTime(63)).toBe('1:03')
    expect(formatTime(125)).toBe('2:05')
    expect(formatTime(3661)).toBe('61:01')
  })

  it('truncates fractional seconds (floors)', () => {
    expect(formatTime(63.5)).toBe('1:03')
    expect(formatTime(63.999)).toBe('1:03')
    expect(formatTime(0.9)).toBe('0:00')
  })

  it('clamps negative values to 0:00', () => {
    expect(formatTime(-1)).toBe('0:00')
    expect(formatTime(-100)).toBe('0:00')
  })

  it('handles NaN as 0:00', () => {
    expect(formatTime(NaN)).toBe('0:00')
  })

  it('handles Infinity as 0:00', () => {
    expect(formatTime(Infinity)).toBe('0:00')
    expect(formatTime(-Infinity)).toBe('0:00')
  })
})

describe('parseTime', () => {
  it('parses m:ss format', () => {
    expect(parseTime('0:00')).toBe(0)
    expect(parseTime('1:03')).toBe(63)
    expect(parseTime('2:30')).toBe(150)
  })

  it('parses mm:ss format', () => {
    expect(parseTime('10:00')).toBe(600)
    expect(parseTime('61:01')).toBe(3661)
  })

  it('parses h:mm:ss format', () => {
    expect(parseTime('1:01:01')).toBe(3661)
    expect(parseTime('2:00:00')).toBe(7200)
  })

  it('handles whitespace', () => {
    expect(parseTime('  1:03  ')).toBe(63)
  })

  it('throws on empty string', () => {
    expect(() => parseTime('')).toThrow('Cannot parse empty time string')
  })

  it('throws on invalid format (no colon)', () => {
    expect(() => parseTime('123')).toThrow('Invalid time format')
  })

  it('throws on too many colons', () => {
    expect(() => parseTime('1:2:3:4')).toThrow('Invalid time format')
  })

  it('throws on non-numeric parts', () => {
    expect(() => parseTime('a:bc')).toThrow('Invalid time part')
  })

  it('roundtrips with formatTime', () => {
    const testValues = [0, 5, 30, 60, 63, 125, 600, 3661]
    for (const val of testValues) {
      expect(parseTime(formatTime(val))).toBe(val)
    }
  })
})

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(500)).toBe('500 B')
    expect(formatFileSize(1023)).toBe('1023 B')
  })

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
  })

  it('formats megabytes', () => {
    expect(formatFileSize(1048576)).toBe('1.0 MB')
    expect(formatFileSize(2621440)).toBe('2.5 MB')
  })

  it('formats gigabytes', () => {
    expect(formatFileSize(1073741824)).toBe('1.0 GB')
  })

  it('handles negative values', () => {
    expect(formatFileSize(-1)).toBe('0 B')
  })

  it('handles NaN', () => {
    expect(formatFileSize(NaN)).toBe('0 B')
  })

  it('handles Infinity', () => {
    expect(formatFileSize(Infinity)).toBe('0 B')
  })
})
