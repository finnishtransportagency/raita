start();

async function start() {
  const bucket = process.env['S3_BUCKET'];
  const key = process.env['S3_KEY'];
  console.log('ECS task launched succesfully');
  console.log(`Bucket: ${bucket}`);
  console.log(`Key: ${key}`);
}
