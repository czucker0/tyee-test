export type WaterClarityType = 'gin_clear' | 'clear_tinted' | 'tea_colored' | 'glacial_green' | 'murky_blown';

export type FieldNoteStorageMode = 'cloud_encrypted' | 'local_only';

export type FieldNoteSyncStatus = 'synced' | 'pending_sync' | 'local_only' | 'sync_error';

export interface FieldNoteLocation {
  lat: number;
  lng: number;
  riverSystem: string; // e.g. 'Bulkley River', 'Babine River', etc.
  poolName?: string;   // e.g. 'Moricetown Canyon', 'Babine Fence Run', 'Upper Telkwa'
  accuracyMeters?: number;
}

export interface FieldNote {
  id: string;
  userId: string;
  title: string;
  tributary: string;
  location: FieldNoteLocation;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  
  // River Telemetry
  waterClarity?: WaterClarityType;
  waterTempC?: number;
  waterLevelGauge?: string; // e.g. "1.85m (stable)", "Rising fast"
  
  // Fly & Angling Log
  flyPattern?: string; // e.g. "Bulkley Black & Blue Intruders, 10ft T-11"
  steelheadHooked?: number;
  steelheadLanded?: number;
  fishNotes?: string;
  
  // General Observations
  notes: string;
  
  // Photo attachments (Compressed base64 data URLs)
  photos: string[];
  
  // Privacy & Sync
  storageMode: FieldNoteStorageMode;
  syncStatus: FieldNoteSyncStatus;
  lastSyncedAt?: string;

  // Peer-to-Peer Sharing Metadata
  isShared?: boolean;
  sharedWithUserIds?: string[];
  sharedWithNames?: Record<string, string>; // mapping of userId -> displayName
  isGpsCloaked?: boolean;
  
  createdAt: string;
  updatedAt: string;
}

export interface PublicAnglerProfile {
  userId: string;
  displayName: string;
  riverRole: 'angler' | 'guide' | 'biologist' | 'conservationist' | 'resident' | 'guest';
  preferredTributary?: string;
  photoURL?: string;
  updatedAt: string;
}

export interface SharedFieldNote {
  id: string;
  authorId: string;
  authorName: string;
  authorRole?: string;
  authorPhotoURL?: string;
  sharedWithUserIds: string[];
  sharedWithNames?: Record<string, string>;
  title: string;
  tributary: string;
  date: string; // YYYY-MM-DD
  time?: string;
  waterClarity?: WaterClarityType;
  waterTempC?: number;
  waterLevelGauge?: string;
  flyPattern?: string;
  steelheadHooked?: number;
  steelheadLanded?: number;
  notes: string;
  photos?: string[];
  isGpsCloaked?: boolean;
  poolName?: string;
  lat?: number;
  lng?: number;
  createdAt: string;
  updatedAt: string;
}

export interface EncryptedFieldNoteRecord {
  id: string;
  userId: string;
  iv: string;
  salt: string;
  ciphertext: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}
