import { FieldNote, EncryptedFieldNoteRecord, PublicAnglerProfile, SharedFieldNote } from '../types/fieldNotes';
import { UserAccount } from '../types/auth';
import { encryptObject, decryptObject } from './cryptoVault';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  deleteDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';

const DB_NAME = 'SkeenaFieldVault_DB';
const DB_VERSION = 1;
const STORE_NAME = 'field_notes';

/**
 * Initializes and opens the IndexedDB database instance
 */
function openIndexedDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported on this device/environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open local field vault database.'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        const store = dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('syncStatus', 'syncStatus', { unique: false });
      }
    };
  });
}

/**
 * Saves or updates a field note in local IndexedDB
 */
export async function saveFieldNoteLocal(note: FieldNote): Promise<void> {
  const idb = await openIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(note);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(new Error('Failed to save field note to local vault.'));
  });
}

/**
 * Retrieves all field notes for a given user from local IndexedDB
 */
export async function getAllFieldNotesLocal(userId: string): Promise<FieldNote[]> {
  const idb = await openIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('userId');
    const req = index.getAll(IDBKeyRange.only(userId));

    req.onsuccess = () => {
      const notes = (req.result as FieldNote[]) || [];
      // Sort descending by date & created time
      notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      resolve(notes);
    };
    req.onerror = () => reject(new Error('Failed to load notes from local vault.'));
  });
}

/**
 * Deletes a field note from local IndexedDB
 */
export async function deleteFieldNoteLocal(noteId: string): Promise<void> {
  const idb = await openIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(noteId);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(new Error('Failed to delete field note from local vault.'));
  });
}

/**
 * Compresses an image client-side to keep offline memory low and fast
 */
export function compressImageFile(file: File | Blob, maxWidth = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(img.src);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Convert to WebP or JPEG
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => reject(new Error('Failed to process image.'));
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
  });
}

const PENDING_DELETES_KEY = 'skeena_pending_remote_deletions';

function getPendingDeletions(): string[] {
  try {
    return JSON.parse(localStorage.getItem(PENDING_DELETES_KEY) || '[]');
  } catch {
    return [];
  }
}

function addPendingDeletion(noteId: string): void {
  try {
    const list = getPendingDeletions();
    if (!list.includes(noteId)) {
      list.push(noteId);
      localStorage.setItem(PENDING_DELETES_KEY, JSON.stringify(list));
    }
  } catch {}
}

function removePendingDeletion(noteId: string): void {
  try {
    const list = getPendingDeletions().filter((id) => id !== noteId);
    localStorage.setItem(PENDING_DELETES_KEY, JSON.stringify(list));
  } catch {}
}

/**
 * Encrypts and syncs all pending field notes to the private cloud collection
 * and pulls any cloud records down to local vault with two-way deletion reconciliation.
 */
export async function encryptAndSyncFieldNotes(
  userId: string, 
  encryptionKeySeed: string
): Promise<{ syncedCount: number; errors: string[] }> {
  const errors: string[] = [];
  let syncedCount = 0;

  try {
    // 1. Process any pending remote deletions queued from offline sessions
    const pendingDeletions = getPendingDeletions();
    for (const delId of pendingDeletions) {
      try {
        const docRef = doc(db, 'users', userId, 'privateFieldNotes', delId);
        await deleteDoc(docRef);
        removePendingDeletion(delId);
      } catch (err) {
        // Retry on next sync
      }
    }

    // 2. Get local notes for user
    const localNotes = await getAllFieldNotesLocal(userId);
    const pendingNotes = localNotes.filter(
      n => n.storageMode === 'cloud_encrypted' && (n.syncStatus === 'pending_sync' || n.syncStatus === 'sync_error')
    );

    // 3. Encrypt and upload pending notes
    for (const note of pendingNotes) {
      try {
        const encrypted = await encryptObject(note, encryptionKeySeed);
        const record: EncryptedFieldNoteRecord = {
          id: note.id,
          userId: note.userId,
          iv: encrypted.iv,
          salt: encrypted.salt,
          ciphertext: encrypted.ciphertext,
          createdAt: note.createdAt,
          updatedAt: new Date().toISOString(),
          schemaVersion: 1
        };

        const noteDocRef = doc(db, 'users', userId, 'privateFieldNotes', note.id);
        await setDoc(noteDocRef, record);

        // Mark local note as synced
        note.syncStatus = 'synced';
        note.lastSyncedAt = new Date().toISOString();
        await saveFieldNoteLocal(note);
        syncedCount++;
      } catch (err: any) {
        console.error('Error syncing note:', note.id, err);
        note.syncStatus = 'sync_error';
        await saveFieldNoteLocal(note);
        errors.push(`Note "${note.title}": ${err.message || 'Encryption/Sync failed'}`);
      }
    }

    // 4. Fetch cloud snapshot & reconcile deletions + additions across devices
    try {
      const notesColRef = collection(db, 'users', userId, 'privateFieldNotes');
      const cloudSnapshot = await getDocs(notesColRef);
      const cloudDocMap = new Map(cloudSnapshot.docs.map((d) => [d.id, d.data() as EncryptedFieldNoteRecord]));

      // A. Reconcile deletions: Remove local notes that were previously synced but deleted from cloud on another device
      for (const localNote of localNotes) {
        if (localNote.storageMode === 'cloud_encrypted' && localNote.syncStatus === 'synced') {
          if (!cloudDocMap.has(localNote.id)) {
            await deleteFieldNoteLocal(localNote.id);
          }
        }
      }

      // B. Reconcile additions: Pull down remote notes that do not exist locally
      const currentLocalNotes = await getAllFieldNotesLocal(userId);
      const currentLocalIds = new Set(currentLocalNotes.map((n) => n.id));

      for (const [remoteId, remoteRecord] of cloudDocMap.entries()) {
        if (!currentLocalIds.has(remoteId)) {
          try {
            const decryptedNote = await decryptObject<FieldNote>(
              {
                ciphertext: remoteRecord.ciphertext,
                iv: remoteRecord.iv,
                salt: remoteRecord.salt
              },
              encryptionKeySeed
            );
            decryptedNote.syncStatus = 'synced';
            decryptedNote.lastSyncedAt = remoteRecord.updatedAt;
            await saveFieldNoteLocal(decryptedNote);
            syncedCount++;
          } catch (decryptErr) {
            console.warn('Could not decrypt remote cloud note:', remoteId, decryptErr);
          }
        }
      }
    } catch (pullErr: any) {
      console.warn('Could not fetch cloud notes snapshot:', pullErr);
    }

  } catch (globalErr: any) {
    errors.push(globalErr.message || 'General sync failure');
  }

  return { syncedCount, errors };
}

/**
 * Deletes a note both locally and in the private Firestore cloud collection with offline queue support
 */
export async function deleteFieldNoteBoth(userId: string, noteId: string): Promise<void> {
  // Delete locally
  await deleteFieldNoteLocal(noteId);
  
  // Try deleting from cloud if online; otherwise queue for next sync
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const docRef = doc(db, 'users', userId, 'privateFieldNotes', noteId);
      await deleteDoc(docRef);
      removePendingDeletion(noteId);
    } catch (err) {
      addPendingDeletion(noteId);
      console.warn('Note deleted locally, remote deletion queued:', err);
    }

    // Also remove from shared collection if it was shared
    try {
      const sharedDocRef = doc(db, 'sharedFieldNotes', noteId);
      await deleteDoc(sharedDocRef);
    } catch {
      // ignore
    }
  } else {
    addPendingDeletion(noteId);
  }
}

/**
 * Searches the public directory of registered anglers by username/display name
 */
export async function searchPublicAnglers(
  searchTerm: string, 
  excludeUid?: string
): Promise<PublicAnglerProfile[]> {
  try {
    const colRef = collection(db, 'publicProfiles');
    const snapshot = await getDocs(colRef);
    const results: PublicAnglerProfile[] = [];
    const term = searchTerm.toLowerCase().trim();

    snapshot.forEach((d) => {
      const data = d.data() as PublicAnglerProfile;
      if (excludeUid && data.userId === excludeUid) return;
      
      if (!term || 
          data.displayName?.toLowerCase().includes(term) || 
          data.preferredTributary?.toLowerCase().includes(term) ||
          data.riverRole?.toLowerCase().includes(term)) {
        results.push({
          userId: data.userId || d.id,
          displayName: data.displayName || 'Angler',
          riverRole: data.riverRole || 'angler',
          preferredTributary: data.preferredTributary || 'Skeena Watershed',
          photoURL: data.photoURL || undefined,
          updatedAt: data.updatedAt || new Date().toISOString()
        });
      }
    });

    return results;
  } catch (err) {
    console.warn('Could not query publicProfiles:', err);
    return [];
  }
}

/**
 * Shares or updates sharing permissions for a field note to specific user IDs
 */
export async function shareFieldNoteWithUsers(
  note: FieldNote,
  sharedWithUserIds: string[],
  sharedWithNames: Record<string, string>,
  isGpsCloaked: boolean,
  author: UserAccount
): Promise<void> {
  const noteDocRef = doc(db, 'sharedFieldNotes', note.id);
  const now = new Date().toISOString();

  // Prepare sanitized shared record
  const sharedRecord: SharedFieldNote = {
    id: note.id,
    authorId: author.uid,
    authorName: author.displayName || 'Skeena Angler',
    authorRole: author.riverRole || 'angler',
    authorPhotoURL: author.photoURL || undefined,
    sharedWithUserIds: Array.from(new Set(sharedWithUserIds)),
    sharedWithNames,
    title: note.title,
    tributary: note.tributary,
    date: note.date,
    time: note.time,
    waterClarity: note.waterClarity,
    waterTempC: note.waterTempC,
    waterLevelGauge: note.waterLevelGauge,
    flyPattern: note.flyPattern,
    steelheadHooked: note.steelheadHooked,
    steelheadLanded: note.steelheadLanded,
    notes: note.notes,
    photos: (note.photos || []).slice(0, 3), // max 3 photos
    isGpsCloaked,
    poolName: isGpsCloaked ? undefined : note.location?.poolName,
    lat: isGpsCloaked ? undefined : note.location?.lat,
    lng: isGpsCloaked ? undefined : note.location?.lng,
    createdAt: note.createdAt || now,
    updatedAt: now
  };

  try {
    await setDoc(noteDocRef, sharedRecord);

    // Update local note with sharing metadata
    const updatedLocalNote: FieldNote = {
      ...note,
      isShared: sharedWithUserIds.length > 0,
      sharedWithUserIds,
      sharedWithNames,
      isGpsCloaked,
      updatedAt: now
    };
    await saveFieldNoteLocal(updatedLocalNote);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `sharedFieldNotes/${note.id}`);
  }
}

/**
 * Unshares a field note completely (removes all peer access)
 */
export async function unshareFieldNote(note: FieldNote): Promise<void> {
  try {
    const sharedDocRef = doc(db, 'sharedFieldNotes', note.id);
    await deleteDoc(sharedDocRef);

    // Update local note
    const updatedLocalNote: FieldNote = {
      ...note,
      isShared: false,
      sharedWithUserIds: [],
      sharedWithNames: {},
      updatedAt: new Date().toISOString()
    };
    await saveFieldNoteLocal(updatedLocalNote);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `sharedFieldNotes/${note.id}`);
  }
}

/**
 * Subscribes in real-time to all field notes shared with the current user
 */
export function subscribeToNotesSharedWithUser(
  currentUserId: string,
  onUpdate: (notes: SharedFieldNote[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!currentUserId || currentUserId === 'anonymous_local_vault') {
    onUpdate([]);
    return () => {};
  }

  try {
    const sharedCol = collection(db, 'sharedFieldNotes');
    const q = query(
      sharedCol, 
      where('sharedWithUserIds', 'array-contains', currentUserId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const notes: SharedFieldNote[] = [];
        snapshot.forEach((docSnap) => {
          notes.push(docSnap.data() as SharedFieldNote);
        });
        // Sort descending by date
        notes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        onUpdate(notes);
      },
      (err) => {
        console.warn('Subscription error for shared field notes:', err);
        onError?.(err);
      }
    );
  } catch (err: any) {
    console.warn('Could not attach shared notes subscription:', err);
    return () => {};
  }
}

