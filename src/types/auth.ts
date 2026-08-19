export type AuthProviderType = 'google' | 'apple' | 'facebook' | 'local' | 'password' | 'email';

export type RiverRole = 'angler' | 'guide' | 'biologist' | 'conservationist' | 'resident' | 'guest';

export interface UserAccount {
  uid: string;
  displayName: string;
  email: string | null;
  photoURL: string | null;
  provider: AuthProviderType;
  riverRole: RiverRole;
  preferredTributary: string; // e.g. 'All Watershed', 'Babine', 'Bulkley', 'Kispiox', 'Morice', 'Sustut', 'Mainstem'
  alertThreshold: number; // escapement trigger
  isLocalOnly: boolean;
  isAdmin?: boolean;
  isBanned?: boolean;
  bannedAt?: string;
  bannedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRecord {
  adminId: string;
  id?: string;
  email: string;
  addedBy?: string;
  createdAt: string;
}

export interface UserSavedScenario {
  id: string;
  userId: string;
  title: string;
  multiplier: number;
  timingShiftDays: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserFieldObservation {
  id: string;
  userId: string;
  date: string;
  tributary: string;
  notes: string;
  waterCondition?: string;
  createdAt: string;
  updatedAt: string;
}
