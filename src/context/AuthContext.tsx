import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  onSnapshot, 
  deleteDoc,
  query, 
  orderBy
} from 'firebase/firestore';
import { 
  auth, 
  db, 
  googleProvider, 
  handleFirestoreError,
  OperationType 
} from '../firebase/config';
import { UserAccount, UserSavedScenario, RiverRole, AuthProviderType, AdminRecord } from '../types/auth';

export { auth, db };
export const BOOTSTRAP_ADMIN_EMAIL = 'chris.zucker@gmail.com';

interface AuthContextType {
  user: UserAccount | null;
  loading: boolean;
  isAdmin: boolean;
  isAuthModalOpen: boolean;
  isAdminModalOpen: boolean;
  authModalInitialTab: 'social' | 'email' | 'local';
  openAuthModal: (tab?: 'social' | 'email' | 'local') => void;
  closeAuthModal: () => void;
  openAdminModal: () => void;
  closeAdminModal: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (params: { email: string; pass: string; displayName: string; riverRole: RiverRole; preferredTributary: string }) => Promise<void>;
  signInLocal: (data: { displayName: string; riverRole: RiverRole; preferredTributary: string; email?: string }) => void;
  updateUserProfile: (updates: Partial<Pick<UserAccount, 'displayName' | 'riverRole' | 'preferredTributary' | 'alertThreshold' | 'photoURL'>>) => Promise<void>;
  signOutUser: () => Promise<void>;
  savedScenarios: UserSavedScenario[];
  saveScenario: (scenario: { title: string; multiplier: number; timingShiftDays: number; notes?: string }) => Promise<string>;
  deleteScenario: (scenarioId: string) => Promise<void>;
  authNotice: string | null;
  setAuthNotice: (msg: string | null) => void;
  // Admin utilities
  adminList: AdminRecord[];
  allUsers: UserAccount[];
  fetchAllUsersForAdmin: () => Promise<UserAccount[]>;
  addAdminByEmail: (email: string) => Promise<void>;
  removeAdmin: (adminId: string) => Promise<void>;
  banUser: (targetUid: string, reason?: string) => Promise<void>;
  unbanUser: (targetUid: string) => Promise<void>;
  deleteUserRecord: (targetUid: string) => Promise<void>;
}

const LOCAL_USER_STORAGE_KEY = 'skeena_steelhead_local_user';
const LOCAL_SCENARIOS_STORAGE_KEY = 'skeena_steelhead_local_scenarios';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'social' | 'email' | 'local'>('social');
  const [savedScenarios, setSavedScenarios] = useState<UserSavedScenario[]>([]);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [adminList, setAdminList] = useState<AdminRecord[]>([]);
  const [allUsers, setAllUsers] = useState<UserAccount[]>([]);

  const openAuthModal = (tab: 'social' | 'email' | 'local' = 'social') => {
    setAuthModalInitialTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const openAdminModal = () => setIsAdminModalOpen(true);
  const closeAdminModal = () => setIsAdminModalOpen(false);

  // Helper: check if email is admin
  const checkIsAdmin = useCallback(async (email: string | null, uid?: string): Promise<boolean> => {
    if (!email && !uid) return false;
    const cleanEmail = email?.toLowerCase().trim();
    if (cleanEmail === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) return true;

    try {
      if (uid) {
        const adminDoc = await getDoc(doc(db, 'admins', uid));
        if (adminDoc.exists()) return true;
      }
      if (cleanEmail) {
        const sanitizedId = cleanEmail.replace(/[@.]/g, '_');
        const emailAdminDoc = await getDoc(doc(db, 'admins', sanitizedId));
        if (emailAdminDoc.exists()) return true;
      }
    } catch {
      // ignore
    }
    return false;
  }, []);

  // Helper to load scenarios from localStorage for local guest
  const loadLocalScenarios = (uid: string): UserSavedScenario[] => {
    try {
      const raw = localStorage.getItem(`${LOCAL_SCENARIOS_STORAGE_KEY}_${uid}`);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [];
  };

  const saveLocalScenarios = (uid: string, scenarios: UserSavedScenario[]) => {
    try {
      localStorage.setItem(`${LOCAL_SCENARIOS_STORAGE_KEY}_${uid}`, JSON.stringify(scenarios));
    } catch {
      // ignore
    }
  };

  // Sync or fetch User Profile from Firestore for authenticated user
  const syncFirebaseUserProfile = useCallback(async (
    fbUser: FirebaseUser, 
    providerType: AuthProviderType = 'google',
    extraInitialData?: { riverRole?: RiverRole; preferredTributary?: string }
  ): Promise<UserAccount> => {
    const userDocRef = doc(db, 'users', fbUser.uid);
    let userAccount: UserAccount;
    const isUserAdmin = await checkIsAdmin(fbUser.email, fbUser.uid);

    try {
      const snapshot = await getDoc(userDocRef);
      if (snapshot.exists()) {
        const data = snapshot.data();

        // Check if user is banned
        if (data.isBanned) {
          await fbSignOut(auth);
          setAuthNotice('Your account has been suspended by a Skeena System administrator.');
          throw new Error('USER_BANNED');
        }

        userAccount = {
          uid: fbUser.uid,
          displayName: data.displayName || fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Skeena River Angler'),
          email: fbUser.email || data.email || null,
          photoURL: fbUser.photoURL || data.photoURL || null,
          provider: (data.provider as AuthProviderType) || providerType,
          riverRole: (data.riverRole as RiverRole) || extraInitialData?.riverRole || 'angler',
          preferredTributary: data.preferredTributary || extraInitialData?.preferredTributary || 'All Watershed (General)',
          alertThreshold: typeof data.alertThreshold === 'number' ? data.alertThreshold : 20000,
          isLocalOnly: false,
          isAdmin: isUserAdmin || data.isAdmin || false,
          isBanned: data.isBanned || false,
          bannedAt: data.bannedAt,
          bannedReason: data.bannedReason,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        // update last active
        await setDoc(userDocRef, {
          ...data,
          isAdmin: isUserAdmin || data.isAdmin || false,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } else {
        // Create initial profile in Firestore
        const now = new Date().toISOString();
        userAccount = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Skeena Biologist'),
          email: fbUser.email || null,
          photoURL: fbUser.photoURL || null,
          provider: providerType,
          riverRole: extraInitialData?.riverRole || 'angler',
          preferredTributary: extraInitialData?.preferredTributary || 'All Watershed (General)',
          alertThreshold: 20000,
          isLocalOnly: false,
          isAdmin: isUserAdmin,
          isBanned: false,
          createdAt: now,
          updatedAt: now
        };

        await setDoc(userDocRef, {
          userId: userAccount.uid,
          displayName: userAccount.displayName,
          email: userAccount.email || '',
          photoURL: userAccount.photoURL || '',
          provider: userAccount.provider,
          riverRole: userAccount.riverRole,
          preferredTributary: userAccount.preferredTributary,
          alertThreshold: userAccount.alertThreshold,
          isAdmin: isUserAdmin,
          isBanned: false,
          createdAt: userAccount.createdAt,
          updatedAt: userAccount.updatedAt
        });
      }

      // Sync non-PII Public Profile for angler username discovery
      try {
        const publicDocRef = doc(db, 'publicProfiles', userAccount.uid);
        await setDoc(publicDocRef, {
          userId: userAccount.uid,
          displayName: userAccount.displayName,
          riverRole: userAccount.riverRole,
          preferredTributary: userAccount.preferredTributary || 'All Watershed (General)',
          photoURL: userAccount.photoURL || '',
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (pubErr) {
        console.warn('Could not sync public angler profile:', pubErr);
      }

      // If bootstrapped admin, ensure admin entry exists
      if (isUserAdmin && fbUser.email?.toLowerCase().trim() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
        try {
          const adminDocRef = doc(db, 'admins', fbUser.uid);
          await setDoc(adminDocRef, {
            adminId: fbUser.uid,
            email: fbUser.email,
            addedBy: 'SYSTEM_BOOTSTRAP',
            createdAt: new Date().toISOString()
          }, { merge: true });
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.warn('Could not sync profile to Firestore, falling back to basic auth info:', err);
      userAccount = {
        uid: fbUser.uid,
        displayName: fbUser.displayName || fbUser.email || 'Skeena Angler',
        email: fbUser.email || null,
        photoURL: fbUser.photoURL || null,
        provider: providerType,
        riverRole: extraInitialData?.riverRole || 'angler',
        preferredTributary: extraInitialData?.preferredTributary || 'All Watershed (General)',
        alertThreshold: 20000,
        isLocalOnly: false,
        isAdmin: isUserAdmin,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    return userAccount;
  }, [checkIsAdmin]);

  // Listen to Firebase Auth state
  useEffect(() => {
    let unsubscribeFirestoreScenarios: (() => void) | null = null;
    let unsubscribeAdminList: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Determine provider
        const providerId = fbUser.providerData[0]?.providerId || '';
        let detectedProvider: AuthProviderType = 'google';
        if (providerId.includes('apple')) detectedProvider = 'apple';
        else if (providerId.includes('facebook')) detectedProvider = 'facebook';
        else if (providerId.includes('password')) detectedProvider = 'password';

        const cloudUser = await syncFirebaseUserProfile(fbUser, detectedProvider);
        setUser(cloudUser);

        // Attach real-time snapshot for savedScenarios subcollection
        try {
          const scenariosCol = collection(db, 'users', fbUser.uid, 'savedScenarios');
          unsubscribeFirestoreScenarios = onSnapshot(
            query(scenariosCol, orderBy('createdAt', 'desc')),
            (snapshot) => {
              const items: UserSavedScenario[] = [];
              snapshot.forEach((docItem) => {
                const data = docItem.data();
                items.push({
                  id: docItem.id,
                  userId: data.userId || fbUser.uid,
                  title: data.title || 'Untitled Scenario',
                  multiplier: data.multiplier ?? 1.0,
                  timingShiftDays: data.timingShiftDays ?? 0,
                  notes: data.notes || '',
                  createdAt: data.createdAt || new Date().toISOString(),
                  updatedAt: data.updatedAt || new Date().toISOString(),
                });
              });
              setSavedScenarios(items);
            },
            (err) => {
              console.error('Snapshot error for saved scenarios:', err);
            }
          );
        } catch (e) {
          console.warn('Could not attach scenarios snapshot:', e);
        }

        // If user is Admin, attach listener for Admin list
        if (cloudUser.isAdmin) {
          try {
            const adminCol = collection(db, 'admins');
            unsubscribeAdminList = onSnapshot(adminCol, (snap) => {
              const admins: AdminRecord[] = [];
              snap.forEach((docItem) => {
                const data = docItem.data();
                admins.push({
                  adminId: docItem.id,
                  email: data.email || docItem.id,
                  addedBy: data.addedBy || '',
                  createdAt: data.createdAt || new Date().toISOString()
                });
              });
              setAdminList(admins);
            });
          } catch (e) {
            console.warn('Could not attach admin listener:', e);
          }
        }

        setLoading(false);
      } else {
        if (unsubscribeFirestoreScenarios) {
          unsubscribeFirestoreScenarios();
          unsubscribeFirestoreScenarios = null;
        }
        if (unsubscribeAdminList) {
          unsubscribeAdminList();
          unsubscribeAdminList = null;
        }

        // Check local storage for offline / local user profile
        try {
          const rawLocal = localStorage.getItem(LOCAL_USER_STORAGE_KEY);
          if (rawLocal) {
            const localObj: UserAccount = JSON.parse(rawLocal);
            // Check if local user configured the admin email
            if (localObj.email?.toLowerCase().trim() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
              localObj.isAdmin = true;
            }
            setUser(localObj);
            setSavedScenarios(loadLocalScenarios(localObj.uid));
          } else {
            setUser(null);
            setSavedScenarios([]);
          }
        } catch {
          setUser(null);
          setSavedScenarios([]);
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestoreScenarios) unsubscribeFirestoreScenarios();
      if (unsubscribeAdminList) unsubscribeAdminList();
    };
  }, [syncFirebaseUserProfile]);

  const handleOAuthError = (err: any, providerName: string) => {
    console.error(`${providerName} Sign-In error:`, err);
    if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
      setAuthNotice(
        `OAuth Domain Notice: "${currentHost}" is not yet authorized in Firebase Console > Authentication > Settings > Authorized Domains. You can sign in immediately using "Email / Pass" or "Local Profile" with full access!`
      );
    } else if (err?.code === 'auth/operation-not-allowed' || err?.code === 'auth/configuration-not-found' || err?.message?.includes('provider is not enabled')) {
      setAuthNotice(`${providerName} is not yet enabled in Firebase Console. Please sign in with Email & Password or Local Profile.`);
    } else if (err?.code === 'auth/popup-closed-by-user') {
      setAuthNotice(null);
    } else {
      setAuthNotice(err?.message || `${providerName} sign-in encountered an issue.`);
    }
  };

  // Google Sign In
  const signInWithGoogle = async () => {
    setLoading(true);
    setAuthNotice(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const cloudUser = await syncFirebaseUserProfile(result.user, 'google');
      setUser(cloudUser);
      localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
      closeAuthModal();
    } catch (err: any) {
      handleOAuthError(err, 'Google');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Email & Password Sign In
  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    setAuthNotice(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const cloudUser = await syncFirebaseUserProfile(result.user, 'password');
      setUser(cloudUser);
      localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
      closeAuthModal();
    } catch (err: any) {
      console.error('Email sign in error:', err);
      let msg = err.message;
      if (err.code === 'auth/operation-not-allowed') {
        msg = 'Email/Password sign-in is currently disabled in your Firebase Console. Please enable the "Email/Password" provider in your Firebase Authentication settings, or sign in with Google or Local Profile.';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password. Please verify your credentials or create a new account.';
      } else if (err.code === 'auth/unauthorized-domain') {
        msg = 'Domain authorization notice: You can also use Local Profile to enter immediately.';
      }
      setAuthNotice(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Email & Password Sign Up
  const signUpWithEmail = async (params: { 
    email: string; 
    pass: string; 
    displayName: string; 
    riverRole: RiverRole; 
    preferredTributary: string 
  }) => {
    setLoading(true);
    setAuthNotice(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, params.email.trim(), params.pass);
      await updateProfile(result.user, { displayName: params.displayName.trim() });
      const cloudUser = await syncFirebaseUserProfile(result.user, 'password', {
        riverRole: params.riverRole,
        preferredTributary: params.preferredTributary
      });
      setUser(cloudUser);
      localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
      closeAuthModal();
    } catch (err: any) {
      console.error('Email sign up error:', err);
      let msg = err.message;
      if (err.code === 'auth/operation-not-allowed') {
        msg = 'Email/Password accounts are currently disabled in your Firebase Console. Please enable "Email/Password" in your Firebase Authentication settings, or sign in with Google or Local Profile.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered. Please sign in or use another email.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password must be at least 6 characters.';
      } else if (err.code === 'auth/unauthorized-domain') {
        msg = 'Domain authorization notice: You can also use Local Profile to enter immediately.';
      }
      setAuthNotice(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Local / Guest Sign In
  const signInLocal = (data: { displayName: string; riverRole: RiverRole; preferredTributary: string; email?: string }) => {
    const now = new Date().toISOString();
    const localUid = 'local_user_' + Math.random().toString(36).substring(2, 9);
    const isAdmin = data.email?.toLowerCase().trim() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
    
    const localUser: UserAccount = {
      uid: localUid,
      displayName: data.displayName.trim() || 'Skeena Steelhead Angler',
      email: data.email?.trim() || null,
      photoURL: null,
      provider: 'local',
      riverRole: data.riverRole,
      preferredTributary: data.preferredTributary || 'All Watershed (General)',
      alertThreshold: 20000,
      isLocalOnly: true,
      isAdmin,
      createdAt: now,
      updatedAt: now
    };

    localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(localUser));
    setUser(localUser);
    setSavedScenarios(loadLocalScenarios(localUid));
    closeAuthModal();
  };

  // Update Profile
  const updateUserProfile = async (updates: Partial<Pick<UserAccount, 'displayName' | 'riverRole' | 'preferredTributary' | 'alertThreshold' | 'photoURL'>>) => {
    if (!user) return;

    const updatedUser: UserAccount = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (user.isLocalOnly) {
      localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } else {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          displayName: updatedUser.displayName,
          riverRole: updatedUser.riverRole,
          preferredTributary: updatedUser.preferredTributary,
          alertThreshold: updatedUser.alertThreshold,
          photoURL: updatedUser.photoURL || '',
          updatedAt: updatedUser.updatedAt
        }, { merge: true });

        // Update public angler profile
        try {
          const publicDocRef = doc(db, 'publicProfiles', user.uid);
          await setDoc(publicDocRef, {
            userId: user.uid,
            displayName: updatedUser.displayName,
            riverRole: updatedUser.riverRole,
            preferredTributary: updatedUser.preferredTributary || 'All Watershed (General)',
            photoURL: updatedUser.photoURL || '',
            updatedAt: updatedUser.updatedAt
          }, { merge: true });
        } catch (pubErr) {
          console.warn('Could not update public profile:', pubErr);
        }

        setUser(updatedUser);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  // Fetch all users for Admin
  const fetchAllUsersForAdmin = async (): Promise<UserAccount[]> => {
    if (!user?.isAdmin) return [];

    try {
      const usersCol = collection(db, 'users');
      const snapshot = await getDocs(usersCol);
      const list: UserAccount[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          uid: docSnap.id,
          displayName: d.displayName || 'Unknown Angler',
          email: d.email || null,
          photoURL: d.photoURL || null,
          provider: (d.provider as AuthProviderType) || 'google',
          riverRole: (d.riverRole as RiverRole) || 'angler',
          preferredTributary: d.preferredTributary || 'All Watershed',
          alertThreshold: typeof d.alertThreshold === 'number' ? d.alertThreshold : 20000,
          isLocalOnly: false,
          isAdmin: d.isAdmin || false,
          isBanned: d.isBanned || false,
          bannedAt: d.bannedAt,
          bannedReason: d.bannedReason,
          createdAt: d.createdAt || new Date().toISOString(),
          updatedAt: d.updatedAt || new Date().toISOString()
        });
      });
      setAllUsers(list);
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'users');
    }
  };

  // Ban User
  const banUser = async (targetUid: string, reason?: string) => {
    if (!user?.isAdmin) throw new Error('Unauthorized');
    if (!targetUid) return;

    const now = new Date().toISOString();
    const finalReason = reason?.trim() || 'Violation of Skeena Telemetry Terms of Service';

    // 1. Immediately update local in-memory and storage state
    setAllUsers(prev => prev.map(u => u.uid === targetUid ? {
      ...u,
      isBanned: true,
      bannedAt: now,
      bannedReason: finalReason,
      updatedAt: now
    } : u));

    // 2. Persist to Firestore if online
    try {
      const userRef = doc(db, 'users', targetUid);
      await setDoc(userRef, {
        isBanned: true,
        bannedAt: now,
        bannedReason: finalReason,
        updatedAt: now
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore update for banUser skipped/errored:', err);
    }
  };

  // Unban User
  const unbanUser = async (targetUid: string) => {
    if (!user?.isAdmin) throw new Error('Unauthorized');
    if (!targetUid) return;

    const now = new Date().toISOString();

    // 1. Immediately update local state
    setAllUsers(prev => prev.map(u => u.uid === targetUid ? {
      ...u,
      isBanned: false,
      bannedAt: undefined,
      bannedReason: undefined,
      updatedAt: now
    } : u));

    // 2. Persist to Firestore if online
    try {
      const userRef = doc(db, 'users', targetUid);
      await setDoc(userRef, {
        isBanned: false,
        bannedAt: null,
        bannedReason: null,
        updatedAt: now
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore update for unbanUser skipped/errored:', err);
    }
  };

  // Delete User Record permanently from Firestore & Local State
  const deleteUserRecord = async (targetUid: string) => {
    if (!user?.isAdmin) throw new Error('Unauthorized');
    if (!targetUid) return;

    // 1. Immediately update local in-memory state
    setAllUsers(prev => prev.filter(u => u.uid !== targetUid));

    // 2. Delete from Firestore
    try {
      // 1. Delete main user document
      const userRef = doc(db, 'users', targetUid);
      await deleteDoc(userRef);

      // 2. Delete public profile document if exists
      try {
        const pubRef = doc(db, 'publicProfiles', targetUid);
        await deleteDoc(pubRef);
      } catch {
        // ignore
      }

      // 3. Delete admin document if exists
      try {
        const adminRef = doc(db, 'admins', targetUid);
        await deleteDoc(adminRef);
      } catch {
        // ignore
      }
    } catch (err) {
      console.warn('Firestore purge for user skipped/errored:', err);
    }
  };

  // Add new Admin by Email
  const addAdminByEmail = async (newEmail: string) => {
    if (!user?.isAdmin) throw new Error('Unauthorized');
    const cleanEmail = newEmail.toLowerCase().trim();
    if (!cleanEmail) return;

    const docId = cleanEmail.replace(/[@.]/g, '_');
    const adminRef = doc(db, 'admins', docId);

    try {
      await setDoc(adminRef, {
        adminId: docId,
        email: cleanEmail,
        addedBy: user.email || user.displayName,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `admins/${docId}`);
    }
  };

  // Remove Admin
  const removeAdmin = async (adminId: string) => {
    if (!user?.isAdmin) throw new Error('Unauthorized');
    try {
      const adminRef = doc(db, 'admins', adminId);
      await deleteDoc(adminRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `admins/${adminId}`);
    }
  };

  // Sign Out
  const signOutUser = async () => {
    setLoading(true);
    try {
      if (auth.currentUser) {
        await fbSignOut(auth);
      }
      localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
      setUser(null);
      setSavedScenarios([]);
      setAllUsers([]);
      setAdminList([]);
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Save What-If Scenario
  const saveScenario = async (scenario: { title: string; multiplier: number; timingShiftDays: number; notes?: string }): Promise<string> => {
    const scenarioId = 'scn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();

    if (!user) {
      const fallbackUser: UserAccount = {
        uid: 'local_guest_' + Math.random().toString(36).substring(2, 7),
        displayName: 'Guest Biologist',
        email: null,
        photoURL: null,
        provider: 'local',
        riverRole: 'angler',
        preferredTributary: 'All Watershed (General)',
        alertThreshold: 20000,
        isLocalOnly: true,
        createdAt: now,
        updatedAt: now
      };
      localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(fallbackUser));
      setUser(fallbackUser);

      const newScenario: UserSavedScenario = {
        id: scenarioId,
        userId: fallbackUser.uid,
        title: scenario.title || 'Custom Projection Curve',
        multiplier: scenario.multiplier,
        timingShiftDays: scenario.timingShiftDays,
        notes: scenario.notes || '',
        createdAt: now,
        updatedAt: now
      };
      const updatedList = [newScenario, ...savedScenarios];
      saveLocalScenarios(fallbackUser.uid, updatedList);
      setSavedScenarios(updatedList);
      return scenarioId;
    }

    const newScenario: UserSavedScenario = {
      id: scenarioId,
      userId: user.uid,
      title: scenario.title || 'Custom Projection Curve',
      multiplier: scenario.multiplier,
      timingShiftDays: scenario.timingShiftDays,
      notes: scenario.notes || '',
      createdAt: now,
      updatedAt: now
    };

    if (user.isLocalOnly) {
      const updatedList = [newScenario, ...savedScenarios];
      saveLocalScenarios(user.uid, updatedList);
      setSavedScenarios(updatedList);
    } else {
      try {
        const scenarioDocRef = doc(db, 'users', user.uid, 'savedScenarios', scenarioId);
        await setDoc(scenarioDocRef, newScenario);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/savedScenarios/${scenarioId}`);
      }
    }

    return scenarioId;
  };

  // Delete Scenario
  const deleteScenario = async (scenarioId: string) => {
    if (!user) return;

    if (user.isLocalOnly) {
      const updated = savedScenarios.filter((s) => s.id !== scenarioId);
      saveLocalScenarios(user.uid, updated);
      setSavedScenarios(updated);
    } else {
      try {
        const scenarioDocRef = doc(db, 'users', user.uid, 'savedScenarios', scenarioId);
        await deleteDoc(scenarioDocRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/savedScenarios/${scenarioId}`);
      }
    }
  };

  const isAdmin = Boolean(user?.isAdmin || (user?.email && user.email.toLowerCase().trim() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()));

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isAuthModalOpen,
        isAdminModalOpen,
        authModalInitialTab,
        openAuthModal,
        closeAuthModal,
        openAdminModal,
        closeAdminModal,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInLocal,
        updateUserProfile,
        signOutUser,
        savedScenarios,
        saveScenario,
        deleteScenario,
        authNotice,
        setAuthNotice,
        adminList,
        allUsers,
        fetchAllUsersForAdmin,
        addAdminByEmail,
        removeAdmin,
        banUser,
        unbanUser,
        deleteUserRecord
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
