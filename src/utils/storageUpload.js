import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getStorageInstance, isStorageConfigured } from '../firebase';

export async function uploadRoomScreenshot(roomCode, playerId, file) {
  if (!isStorageConfigured()) {
    throw new Error('Firebase Storage 尚未設定，請確認 storageBucket 環境變數。');
  }

  const storage = getStorageInstance();
  const extension = file.type === 'image/png' ? 'png' : 'jpg';
  const fileName = `${playerId}-${Date.now()}.${extension}`;
  const storageRef = ref(storage, `rooms/${roomCode}/${fileName}`);

  await uploadBytes(storageRef, file, {
    contentType: file.type || 'image/jpeg',
  });

  return getDownloadURL(storageRef);
}
