import { ALBEvent, Context } from 'aws-lambda';
import { log } from '../../../utils/logger';
import { getUser } from '../../../utils/userService';
import { getRaitaLambdaErrorResponse } from '../../utils';

const CLOUDFRONT_DOMAIN_NAME = process.env.CLOUDFRONT_DOMAIN_NAME;

export async function handleRequest(event: ALBEvent, _context: Context) {
  try {
    const user = await getUser(event);
    log.info(user, 'Returning user back to frontpage.');

    const expires = new Date(Date.now() + 120 * 1000).toUTCString(); // In two minutes
    const setCookieAttributes = `; Domain=${CLOUDFRONT_DOMAIN_NAME}; Path=/; Secure; SameSite=Lax; expires=${expires};`;
    const returnUrlEnd = event.queryStringParameters?.redirect_url
      ? decodeURIComponent(event.queryStringParameters.redirect_url)
      : '/';
    return {
      statusCode: 302,
      headers: {
        Location: `https://${CLOUDFRONT_DOMAIN_NAME}${returnUrlEnd}`,
        'Set-Cookie': `Return=true${setCookieAttributes}`,
      },
    };
  } catch (err: any) {
    log.error(err);
    return getRaitaLambdaErrorResponse(err);
  }
}
