import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';

const PRESIGNED_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 days

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrlBase = process.env.R2_PUBLIC_URL;

  const hasR2Config =
    accountId && accessKeyId && secretAccessKey && bucketName;

  if (!hasR2Config) {
    return new Response(
      JSON.stringify({
        error: 'R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: { polaroid?: string };
  try {
    body = (await req.json()) as { polaroid?: string };
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const polaroidBase64 = body.polaroid;
  const isPolaroidValid =
    typeof polaroidBase64 === 'string' && polaroidBase64.length > 0;

  if (!isPolaroidValid) {
    return new Response(
      JSON.stringify({ error: 'polaroid (base64) is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const buffer = Buffer.from(polaroidBase64, 'base64');
  const key = `polaroids/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: 'image/png',
      })
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let shareUrl: string;

  if (publicUrlBase) {
    const base = publicUrlBase.replace(/\/$/, '');
    shareUrl = `${base}/${key}`;
  } else {
    const getUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: bucketName, Key: key }),
      { expiresIn: PRESIGNED_EXPIRY_SECONDS }
    );
    shareUrl = getUrl;
  }

  return new Response(
    JSON.stringify({ shareUrl }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
