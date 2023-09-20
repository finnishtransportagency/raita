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
  test('success: multiple date formats', () => {
    // multiple different date formats accepted
    // TODO: times are checked in current timezone
    const date1 = format(new Date('2023-09-19T18:00:00.000Z'), 'd/M/y h:m:s a');
    const date2 = format(
      new Date('2023-09-19T18:00:00.000Z'),
      'yyyyMMdd_HHmmss',
    );
    const date3 = format(new Date('2023-09-19'), 'yyyyMMdd');
    const result1 = parsePrimitive('test', date1, 'date');
    // const result2 = parsePrimitive('test', date2, 'date');
    // const result3 = parsePrimitive('test', date3, 'date');
    const expectedDateTime = '2023-09-19T18:00:00.000Z';
    const expectedDateOnly = '2023-09-19T00:00:00.000Z';

    expect(result1).toEqual({
      key: 'test',
      value: expectedDateTime,
    });
    // TODO: fix these
    // expect(result2).toEqual({
    //   key: 'test',
    //   value: expectedDateTime,
    // });
    // expect(result3).toEqual({
    //   key: 'test',
    //   value: expectedDateOnly,
    // });
  });
});
