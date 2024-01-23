import { Readable } from 'stream';

/**
 * Return a Readable stream that will contain the given string
 */
export const stringToStream = (text: string): Readable => {
  const stream = new Readable();
  stream.push(text);
  stream.push(null);
  return stream;
};

/**
 * Return a Readable stream that will contain the given string
 * Will keep stream paused for the given delay in milliseconds first
 */
export const stringToStreamWithDelay = (
  text: string,
  delay: number,
): Readable => {
  const stream = new Readable();
  stream.push(text);
  stream.push(null);
  const timeout = setTimeout(() => {
    stream.resume();
    timeout.unref();
  }, delay);
  stream.pause();
  return stream;
};
