import format from 'date-fns/format';
import { parsePrimitive } from '../parsePrimitives';

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
    const date = format(new Date('2023-09-19T18:00:00.000Z'), 'd/M/y h:m:s a');
    const date2 = format(new Date('2023-09-19T06:00:00.000Z'), 'd/M/y h:m:s a');

    const result = parsePrimitive('test', date, 'date');
    const result2 = parsePrimitive('test', date2, 'date');

    expect(result).toEqual({
      key: 'test',
      value: '2023-09-19T18:00:00.000Z',
    });

    expect(result2).toEqual({
      key: 'test',
      value: '2023-09-19T06:00:00.000Z',
    });
  });
  test('success: date format yyyyMMdd_HHmmss', () => {
    const date = format(
      new Date('2023-09-19T18:00:00.000Z'),
      'yyyyMMdd_HHmmss',
    );
    const date2 = format(
      new Date('2023-09-19T06:00:00.000Z'),
      'yyyyMMdd_HHmmss',
    );

    const result = parsePrimitive('test', date, 'date');
    const result2 = parsePrimitive('test', date2, 'date');

    expect(result).toEqual({
      key: 'test',
      value: '2023-09-19T18:00:00.000Z',
    });
    expect(result2).toEqual({
      key: 'test',
      value: '2023-09-19T06:00:00.000Z',
    });
  });
  test.skip('success: date format yyyyMMdd', () => {
    // TODO: returning wrong date because of timezone?
    const date = format(new Date('2023-09-19'), 'yyyyMMdd');
    const result = parsePrimitive('test', date, 'date');

    expect(result).toEqual({
      key: 'test',
      value: '2023-09-19T00:00:00.000Z',
    });
  });
});
