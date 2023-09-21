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
  test('success: format d/M/y h:m:s a', () => {
    const date = format(new Date('2023-09-19T18:00:00.000Z'), 'd/M/y h:m:s a');
    const result = parsePrimitive('test', date, 'date');

    expect(result).toEqual({
      key: 'test',
      value: '2023-09-19T18:00:00.000Z',
    });
  });
  test.skip('success: format yyyyMMdd_hhmmss', () => {
    // TODO: only dates in 12h formats are accepted, is this intentional?
    const date = format(
      new Date('2023-09-19T18:00:00.000Z'),
      'yyyyMMdd_HHmmss',
    );
    const result = parsePrimitive('test', date, 'date');

    expect(result).toEqual({
      key: 'test',
      value: '2023-09-19T18:00:00.000Z',
    });
  });
  test.skip('success: format yyyyMMdd', () => {
    // TODO: returning wrong date because of timezone?
    const date = format(new Date('2023-09-19'), 'yyyyMMdd');
    const result = parsePrimitive('test', date, 'date');

    expect(result).toEqual({
      key: 'test',
      value: '2023-09-19T00:00:00.000Z',
    });
  });
});
