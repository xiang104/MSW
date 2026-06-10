import { get, ref, remove } from 'firebase/database';
import { listAll, ref as storageRef, deleteObject } from 'firebase/storage';
import { getDb, getStorageInstance, isFirebaseConfigured, isStorageConfigured } from '../firebase';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

async function deleteStorageFolder(roomCode) {
  if (!isStorageConfigured()) return;

  const storage = getStorageInstance();
  const folderRef = storageRef(storage, `rooms/${roomCode}`);

  try {
    const listing = await listAll(folderRef);
    await Promise.all(listing.items.map((item) => deleteObject(item)));
  } catch {
    // Folder may not exist yet; ignore cleanup errors for storage.
  }
}

export async function cleanupExpiredRooms() {
  if (!isFirebaseConfigured()) return { removed: 0 };

  const db = getDb();
  const roomsRef = ref(db, 'rooms');
  const snapshot = await get(roomsRef);
  const rooms = snapshot.val();

  if (!rooms || typeof rooms !== 'object') {
    return { removed: 0 };
  }

  const now = Date.now();
  const expiredCodes = Object.entries(rooms)
    .filter(([, roomData]) => {
      const createdAt = Number(roomData?.createdAt);
      return Number.isFinite(createdAt) && now - createdAt > THREE_DAYS_MS;
    })
    .map(([code]) => code);

  await Promise.all(
    expiredCodes.map(async (code) => {
      await deleteStorageFolder(code);
      await remove(ref(db, `rooms/${code}`));
    })
  );

  return { removed: expiredCodes.length };
}
