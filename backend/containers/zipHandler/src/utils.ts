import { Stream } from 'stream';

// https://stackoverflow.com/questions/68332633/aws-s3-node-js-sdk-notimplemented-error-with-multer/68835964#68835964
// https://transang.me/modern-fetch-and-how-to-get-buffer-output-from-aws-sdk-v3-getobjectcommand/
export const streamToBuffer = (stream: Stream) =>
  new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.once('end', () => resolve(Buffer.concat(chunks)));
    stream.once('error', reject);
  });
