export const COURSE_MANIFEST_KEY = "peninsula-course-manifest-v1";
const DB_NAME = "peninsula-course-media";
const STORE_NAME = "videos";
type StoredVideo = { moduleId: string; fileName: string; type: string; size: number; updatedAt: string; blob: Blob };

function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: "moduleId" }); };
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
}

export async function saveCourseVideo(moduleId: string, file: File) {
  const db = await database();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({ moduleId, fileName: file.name, type: file.type, size: file.size, updatedAt: new Date().toISOString(), blob: file } satisfies StoredVideo);
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getCourseVideo(moduleId: string) {
  const db = await database();
  const result = await new Promise<StoredVideo | undefined>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(moduleId);
    request.onsuccess = () => resolve(request.result as StoredVideo | undefined); request.onerror = () => reject(request.error);
  });
  db.close(); return result;
}
