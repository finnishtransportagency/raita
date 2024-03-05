import format from 'date-fns/format';
import {
  parsePrimitive,
  parsePrimitiveWithSubstitution,
} from '../parsePrimitives';

jest.mock('../../../../utils/logger', () => {
  return {
    log: {
      warn: jest.fn(),
      info: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    },
    logParsingException: {
      warn: jest.fn(),
      info: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    },
  };
});

describe('parsePrimitive', () => {
  test('success: integer', () => {
    const data = '123';
    const result = parsePrimitive('test', data, 'integer');
    expect(result).toEqual({
      key: 'test',
      value: 123,
    });
  });
  test('fail: integer', () => {
    const data = 'invalid';
    const result = parsePrimitive('test', data, 'integer');
    expect(result).toEqual({
      key: 'test',
      value: NaN, // TODO: should show error?
    });
  });
  test('success: float', () => {
    const data = '123.123';
    const result = parsePrimitive('test', data, 'float');
    expect(result).toEqual({
      key: 'test',
      value: 123.123,
    });
  });
  test('fail: float', () => {
    const data = 'invalid';
    const result = parsePrimitive('test', data, 'float');
    expect(result).toEqual({
      key: 'test',
      value: NaN, // TODO: should show error?
    });
  });
  test('success: date format d/M/y h:m:s a', () => {
    // note: dates interpreted in local (fi) time
    // winter time
    const morning = '02/01/2023 8:00:00 am';
    const morningResult = parsePrimitive('test', morning, 'date');
    expect(morningResult).toEqual({
      key: 'test',
      value: '2023-01-02T06:00:00.000Z',
    });
    const evening = '02/01/2023 8:00:00 pm';
    const eveningResult = parsePrimitive('test', evening, 'date');
    expect(eveningResult).toEqual({
      key: 'test',
      value: '2023-01-02T18:00:00.000Z',
    });
    // summer time
    const summerMorning = '02/06/2023 8:00:00 am';
    const summerMorningResult = parsePrimitive('test', summerMorning, 'date');
    expect(summerMorningResult).toEqual({
      key: 'test',
      value: '2023-06-02T05:00:00.000Z',
    });
  });
  test('success: date format yyyyMMdd_HHmmss', () => {
    // winter time
    const morning = '20230102_080000';
    const morningResult = parsePrimitive('test', morning, 'date');
    expect(morningResult).toEqual({
      key: 'test',
      value: '2023-01-02T06:00:00.000Z',
    });
    const evening = '20230102_200000';
    const eveningResult = parsePrimitive('test', evening, 'date');
    expect(eveningResult).toEqual({
      key: 'test',
      value: '2023-01-02T18:00:00.000Z',
    });
    // summer time
    const summerMorning = '20230602_080000';
    const summerMorningResult = parsePrimitive('test', summerMorning, 'date');
    expect(summerMorningResult).toEqual({
      key: 'test',
      value: '2023-06-02T05:00:00.000Z',
    });
  });
  test('success: date format yyyyMMdd', () => {
    // winter time
    const date = format(new Date('2023-01-02'), 'yyyyMMdd');
    const result = parsePrimitive('test', date, 'date');
    expect(result).toEqual({
      key: 'test',
      value: '2023-01-02T00:00:00.000Z',
    });
    // summer date
    const summerDate = format(new Date('2023-06-02'), 'yyyyMMdd');
    const summerResult = parsePrimitive('test', summerDate, 'date');
    expect(summerResult).toEqual({
      key: 'test',
      value: '2023-06-02T00:00:00.000Z',
    });
  });
  test('success: multiple dates in format d/M/y h:m:s a', () => {
    const date1 = '02/01/2023 8:00:00 am';
    const date2 = '03/01/2023 8:00:00 am';
    const result = parsePrimitive('test', `${date1} ${date2}`, 'date');
    expect(result).toEqual({
      key: 'test',
      value: '2023-01-02T06:00:00.000Z',
    });
    const date3 = '04/01/2023 8:00:00 am';
    const result2 = parsePrimitive(
      'test',
      `${date1} ${date2} ${date3}`,
      'date',
    );
    expect(result2).toEqual({
      key: 'test',
      value: '2023-01-02T06:00:00.000Z',
    });
  });
  test('fail: date in format d/M/y h:m:s a followed by invalid date', () => {
    const date1 = '02/01/2023 8:00:00 am';
    const date2 = '123/01/2023 8:00:00 am';
    const result = parsePrimitive('test', `${date1} ${date2}`, 'date');
    expect(result).toEqual({
      key: 'nonparsed_test',
      value: `${date1} ${date2}`,
    });
  });
  test('fail: date in format d/M/y h:m:s a followed by non date', () => {
    const date1 = '02/01/2023 8:00:00 am';
    const date2 = 'other data goes here';
    const result = parsePrimitive('test', `${date1} ${date2}`, 'date');
    expect(result).toEqual({
      key: 'nonparsed_test',
      value: `${date1} ${date2}`,
    });
  });
});
describe('parsePrimitiveWithSubstitution', () => {
  test('success: string with no substitution match', () => {
    const key = 'test';
    const data = 'TESTVAL';
    const keyMatchResult = parsePrimitiveWithSubstitution(
      key,
      data,
      undefined,
      [{ key, oldValue: 'OTHERVAL', newValue: 'NEWVAL' }],
    );
    expect(keyMatchResult).toEqual({
      key,
      value: data,
    });
    const valMatchResult = parsePrimitiveWithSubstitution(
      key,
      data,
      undefined,
      [{ key: 'OTHERKEY', oldValue: 'TESTVAL', newValue: 'NEWVAL' }],
    );
    expect(valMatchResult).toEqual({
      key,
      value: data,
    });
  });
  test('success: integer with no substitution match', () => {
    const key = 'test';
    const data = '123';
    const result = parsePrimitiveWithSubstitution(key, data, 'integer', [
      { key, oldValue: '1234', newValue: '12345' },
    ]);
    expect(result).toEqual({
      key,
      value: 123,
    });
  });
  test('success: string with substitution match', () => {
    const key = 'test';
    const data = 'TESTVAL';
    const result = parsePrimitiveWithSubstitution(key, data, undefined, [
      { key, oldValue: 'TESTVAL', newValue: 'NEWVAL' },
    ]);
    expect(result).toEqual({
      key,
      value: 'NEWVAL',
    });
  });
  test('success: integer with substitution match', () => {
    const key = 'test';
    const data = '123';
    const result = parsePrimitiveWithSubstitution(key, data, 'integer', [
      { key, oldValue: '123', newValue: '1234' },
    ]);
    expect(result).toEqual({
      key,
      value: 1234,
    });
  });
});
