import imageCompression from 'browser-image-compression';

const COMPRESSION_OPTIONS = {
  maxWidthOrHeight: 800,
  maxSizeMB: 0.1,
  useWebWorker: true,
  fileType: 'image/jpeg',
};

export async function compressScreenshot(file) {
  const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
  return compressed;
}
