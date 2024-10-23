import { objectToCsvBody, objectToCsvHeader } from '../utils';

const testData = [
  { test1: 'z', date: 'foo', variable1: 'bar', test2: 'baz' },
  { test1: 'z', date: '2', variable1: '3', test2: '4' },
  { test1: 'z', date: 'b', variable1: 'a', test2: 'c' },
];
const headerString = 'test1;date;variable1;test2\r\n';
const bodyString = 'z;foo;bar;baz\r\n' + 'z;2;3;4\r\n' + 'z;b;a;c\r\n';
const csvString =
  'test1;date;variable1;test2\r\n' +
  'z;foo;bar;baz\r\n' +
  'z;2;3;4\r\n' +
  'z;b;a;c\r\n';
describe('objectToCsvHeader', () => {
  test('success: basic operation', () => {
    const header = objectToCsvHeader(testData[0]);
    expect(header).toEqual(headerString);
  });
});
describe('objectToCsvBody', () => {
  test('success: basic operation', () => {
    const body = objectToCsvBody(testData);
    expect(body).toEqual(bodyString);
  });
});
describe('objectToCsvHeader and objectToCsvBody', () => {
  test('success: basic operation', () => {
    // important to make sure header ans body columns are aligned
    const header = objectToCsvHeader(testData[0]);
    const body = objectToCsvBody(testData);
    expect(header + body).toEqual(csvString);
  });
});
