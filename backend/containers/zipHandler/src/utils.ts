import { Stream } from 'stream';
import { RaitaSourceSystem, raitaSourceSystems } from './constants';

/**
 * Note: The below can be simplified on node version >= 17.5.0 (requires some work with types)
 * https://stackoverflow.com/questions/68332633/aws-s3-node-js-sdk-notimplemented-error-with-multer/68835964#68835964
 * https://transang.me/modern-fetch-and-how-to-get-buffer-output-from-aws-sdk-v3-getobjectcommand/
 */
export const streamToBuffer = (stream: Stream) =>
  new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.once('end', () => resolve(Buffer.concat(chunks)));
    stream.once('error', reject);
  });

/**
 * Duplicates the method from src/lambdas/utils
 * TODO: To be removed if container is left with dependencties to other code
 */
export const decodeS3EventPropertyString = (s: string) => s.replace(/\+/g, ' ');

/**
 *  Duplicates the method from src/utils
 * TODO: To be removed if container is left with dependencties to other code
 * Returns true if parameter @s matches one of the Raita source systems
 */
export const isRaitaSourceSystem = (s: string) =>
  Object.values(raitaSourceSystems).includes(s as RaitaSourceSystem);
