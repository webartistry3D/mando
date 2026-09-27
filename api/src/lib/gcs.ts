import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  credentials: {
    client_email: process.env.GCS_CLIENT_EMAIL,
    private_key: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

const bucketName = process.env.GCS_BUCKET_NAME || 'mando-uploads';
const bucket = storage.bucket(bucketName);

export async function uploadToGCS(
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<string> {
  const file = bucket.file(fileName);
  await file.save(buffer, {
    contentType: mimeType,
    public: true,
  });
  return `https://storage.googleapis.com/${bucketName}/${fileName}`;
}

export async function deleteFromGCS(storageKey: string): Promise<void> {
  const fileName = storageKey.replace(`https://storage.googleapis.com/${bucketName}/`, '');
  const file = bucket.file(fileName);
  await file.delete().catch(() => {
    // Ignore errors if file doesn't exist
  });
}

export function getPublicUrl(storageKey: string): string {
  return storageKey;
}
