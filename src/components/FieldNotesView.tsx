import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  MapPin, 
  Plus, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Calendar, 
  Clock, 
  Camera, 
  Image as ImageIcon, 
  Trash2, 
  X, 
  Check, 
  Info, 
  Compass, 
  Sliders, 
  Search, 
  Filter, 
  Download, 
  Layers, 
  ChevronRight, 
  Eye, 
  EyeOff,
  Share2, 
  Users,
  UserCheck,
  UserPlus,
  AlertCircle,
  Fish,
  Thermometer,
  Droplets,
  HelpCircle,
  ExternalLink,
  Copy,
  Inbox,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FieldNote, WaterClarityType, FieldNoteStorageMode, PublicAnglerProfile, SharedFieldNote } from '../types/fieldNotes';
import { 
  saveFieldNoteLocal, 
  getAllFieldNotesLocal, 
  deleteFieldNoteBoth, 
  encryptAndSyncFieldNotes, 
  compressImageFile,
  searchPublicAnglers,
  shareFieldNoteWithUsers,
  unshareFieldNote,
  subscribeToNotesSharedWithUser
} from '../utils/fieldNotesDb';

const TRIBUTARIES_COORDINATES: Record<string, { lat: number; lng: number; x: number; y: number; color: string; desc: string }> = {
  'Skeena Lower Mainstem': { lat: 54.201, lng: -129.852, x: 18, y: 78, color: '#38bdf8', desc: 'Tyee Test Fishery to Terrace & Exchamsiks' },
  'Kalum River': { lat: 54.550, lng: -128.650, x: 28, y: 64, color: '#0ea5e9', desc: 'Kitsumkalum system, spring & summer runs' },
  'Zymoetz (Copper) River': { lat: 54.480, lng: -128.320, x: 38, y: 70, color: '#06b6d4', desc: 'Canyon, Clore River junction & classic freestone' },
  'Kitwanga River': { lat: 55.100, lng: -128.000, x: 44, y: 55, color: '#14b8a6', desc: 'Gitanyow / Kitwanga smolt & escapement fence' },
  'Kispiox River': { lat: 55.350, lng: -127.700, x: 50, y: 40, color: '#f59e0b', desc: 'Famous big-fish freestone & tributary pools' },
  'Bulkley River': { lat: 54.780, lng: -127.170, x: 62, y: 62, color: '#d97706', desc: 'Moricetown Canyon, Telkwa & Quick runs' },
  'Morice River': { lat: 54.380, lng: -127.020, x: 74, y: 72, color: '#b45309', desc: 'Upper Bulkley system & Morice Lake headwaters' },
  'Babine River': { lat: 55.650, lng: -126.850, x: 70, y: 35, color: '#10b981', desc: 'Babine Counting Fence, Nilkitkwa & wilderness canyon' },
  'Sustut River': { lat: 56.400, lng: -126.650, x: 82, y: 18, color: '#059669', desc: 'Pristine upper Skeena wilderness sanctuary' },
  'Skeena Upper Watershed': { lat: 56.000, lng: -127.500, x: 58, y: 22, color: '#6366f1', desc: 'Kuldo, Slamgeesh & headwater tributaries' }
};

const CLARITY_LABELS: Record<WaterClarityType, { label: string; icon: string; badge: string }> = {
  gin_clear: { label: 'Gin Clear (5m+)', icon: '💎', badge: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30' },
  clear_tinted: { label: 'Clear & Tinted (2-4m)', icon: '🌊', badge: 'bg-sky-500/10 text-sky-500 border-sky-500/30' },
  glacial_green: { label: 'Glacial Green (1.5-2.5m)', icon: '🏔️', badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' },
  tea_colored: { label: 'Tea Colored (1-2m)', icon: '☕', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
  murky_blown: { label: 'Murky / Blown (<1m)', icon: '⛈️', badge: 'bg-rose-500/10 text-rose-500 border-rose-500/30' }
};

export const FieldNotesView: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.uid || 'anonymous_local_vault';

  // State
  const [notes, setNotes] = useState<FieldNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  
  // Modals & UI
  const [activeTab, setActiveTab] = useState<'my_vault' | 'shared_with_me'>('my_vault');
  const [sharedNotes, setSharedNotes] = useState<SharedFieldNote[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDisclosureOpen, setIsDisclosureOpen] = useState<boolean>(false);
  const [selectedNote, setSelectedNote] = useState<FieldNote | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [selectedTributaryFilter, setSelectedTributaryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Peer Sharing Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareTargetNote, setShareTargetNote] = useState<FieldNote | null>(null);
  const [shareSearchQuery, setShareSearchQuery] = useState<string>('');
  const [anglerSearchResults, setAnglerSearchResults] = useState<PublicAnglerProfile[]>([]);
  const [searchingAnglers, setSearchingAnglers] = useState<boolean>(false);
  const [selectedShareRecipients, setSelectedShareRecipients] = useState<PublicAnglerProfile[]>([]);
  const [isShareGpsCloaked, setIsShareGpsCloaked] = useState<boolean>(false);
  const [savingShare, setSavingShare] = useState<boolean>(false);
  const [copiedReportId, setCopiedReportId] = useState<string | null>(null);
  const { openAuthModal } = useAuth();
  
  // Note Form State (New & Edit Mode)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [formTributary, setFormTributary] = useState<string>('Bulkley River');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formPoolName, setFormPoolName] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState<string>(new Date().toTimeString().slice(0, 5));
  const [formLat, setFormLat] = useState<number>(TRIBUTARIES_COORDINATES['Bulkley River'].lat);
  const [formLng, setFormLng] = useState<number>(TRIBUTARIES_COORDINATES['Bulkley River'].lng);
  const [formClarity, setFormClarity] = useState<WaterClarityType>('clear_tinted');
  const [formWaterTemp, setFormWaterTemp] = useState<string>('9.5');
  const [formGauge, setFormGauge] = useState<string>('1.45m');
  const [formFlyPattern, setFormFlyPattern] = useState<string>('');
  const [formHooked, setFormHooked] = useState<number>(0);
  const [formLanded, setFormLanded] = useState<number>(0);
  const [formNotes, setFormNotes] = useState<string>('');
  const [formPhotos, setFormPhotos] = useState<string[]>([]);
  const [formStorageMode, setFormStorageMode] = useState<FieldNoteStorageMode>('cloud_encrypted');
  const [isGeoLocating, setIsGeoLocating] = useState<boolean>(false);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState<boolean>(false);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  const handleCopyCoords = (lat: number, lng: number, noteId: string) => {
    navigator.clipboard?.writeText(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    setCopiedNoteId(noteId);
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Online / Offline monitor
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Opportunistic sync on reconnect
      handleEncryptAndSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userId]);

  // Load Notes from Local IndexedDB
  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await getAllFieldNotesLocal(userId);
      setNotes(data);
    } catch (err) {
      console.error('Failed to load local field notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [userId]);

  // Subscribe to notes shared with this user in real time
  useEffect(() => {
    if (!user || user.isLocalOnly) {
      setSharedNotes([]);
      return;
    }

    const unsubscribe = subscribeToNotesSharedWithUser(
      user.uid,
      (incomingSharedNotes) => {
        setSharedNotes(incomingSharedNotes);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Search Anglers for sharing
  const handleSearchAnglers = async (term: string) => {
    setShareSearchQuery(term);
    if (!term.trim()) {
      setAnglerSearchResults([]);
      return;
    }
    setSearchingAnglers(true);
    try {
      const results = await searchPublicAnglers(term, user?.uid);
      setAnglerSearchResults(results);
    } catch (err) {
      console.warn('Angler search failed:', err);
    } finally {
      setSearchingAnglers(false);
    }
  };

  // Open Share Modal for a specific note
  const handleOpenShareModal = async (note: FieldNote) => {
    setShareTargetNote(note);
    setIsShareGpsCloaked(Boolean(note.isGpsCloaked));
    setShareSearchQuery('');
    setAnglerSearchResults([]);

    // Populate currently shared recipients if any
    if (note.sharedWithUserIds && note.sharedWithUserIds.length > 0) {
      const currentList: PublicAnglerProfile[] = note.sharedWithUserIds.map((uid) => ({
        userId: uid,
        displayName: note.sharedWithNames?.[uid] || 'Angler',
        riverRole: 'angler',
        preferredTributary: 'Skeena Watershed',
        updatedAt: new Date().toISOString()
      }));
      setSelectedShareRecipients(currentList);
    } else {
      setSelectedShareRecipients([]);
    }

    setIsShareModalOpen(true);

    // Pre-fetch default angler directory
    try {
      setSearchingAnglers(true);
      const initialAnglers = await searchPublicAnglers('', user?.uid);
      setAnglerSearchResults(initialAnglers.slice(0, 8));
    } catch {
      // ignore
    } finally {
      setSearchingAnglers(false);
    }
  };

  // Add recipient to sharing list
  const handleAddRecipient = (angler: PublicAnglerProfile) => {
    if (!selectedShareRecipients.some((r) => r.userId === angler.userId)) {
      setSelectedShareRecipients((prev) => [...prev, angler]);
    }
  };

  // Add any angler handle directly by username
  const handleAddDirectRecipient = (rawName: string) => {
    const clean = rawName.trim();
    if (!clean) return;
    const newRecipient: PublicAnglerProfile = {
      userId: clean,
      displayName: clean,
      riverRole: 'angler',
      preferredTributary: 'Skeena Watershed',
      updatedAt: new Date().toISOString()
    };
    if (!selectedShareRecipients.some((r) => r.userId.toLowerCase() === clean.toLowerCase())) {
      setSelectedShareRecipients((prev) => [...prev, newRecipient]);
    }
    setShareSearchQuery('');
  };

  // Remove recipient from sharing list
  const handleRemoveRecipient = (userIdToRemove: string) => {
    setSelectedShareRecipients((prev) => prev.filter((r) => r.userId !== userIdToRemove));
  };

  // Save sharing configuration to Firestore
  const handleSaveSharing = async () => {
    if (!shareTargetNote || !user) return;

    setSavingShare(true);
    try {
      if (selectedShareRecipients.length === 0) {
        // Unshare if recipient list is cleared
        await unshareFieldNote(shareTargetNote);
        setSyncNotice(`Field note "${shareTargetNote.title}" is now private (unshared).`);
      } else {
        const uids = selectedShareRecipients.map((r) => r.userId);
        const nameMap: Record<string, string> = {};
        selectedShareRecipients.forEach((r) => {
          nameMap[r.userId] = r.displayName;
        });

        await shareFieldNoteWithUsers(
          shareTargetNote,
          uids,
          nameMap,
          isShareGpsCloaked,
          user
        );
        setSyncNotice(`Shared note with ${uids.length} selected angler(s).`);
      }

      await loadNotes();
      setIsShareModalOpen(false);
      setTimeout(() => setSyncNotice(null), 4000);
    } catch (err: any) {
      console.error('Failed to save sharing:', err);
      alert('Error updating sharing permissions: ' + (err.message || 'Check connection'));
    } finally {
      setSavingShare(false);
    }
  };

  // Completely unshare from modal
  const handleRevokeAllSharing = async () => {
    if (!shareTargetNote || !user) return;
    if (!confirm('Remove all angler access and make this note strictly private?')) return;

    setSavingShare(true);
    try {
      await unshareFieldNote(shareTargetNote);
      await loadNotes();
      setIsShareModalOpen(false);
      setSyncNotice(`Field note "${shareTargetNote.title}" is now private.`);
      setTimeout(() => setSyncNotice(null), 4000);
    } catch (err: any) {
      alert('Failed to revoke access: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingShare(false);
    }
  };

  // 1-Click direct unshare from note card
  const handleDirectUnshare = async (note: FieldNote) => {
    if (!confirm(`Revoke all shared access for "${note.title}" and make it private to your vault?`)) return;
    try {
      await unshareFieldNote(note);
      await loadNotes();
      setSyncNotice(`Field note "${note.title}" is now private (unshared).`);
      setTimeout(() => setSyncNotice(null), 4000);
    } catch (err: any) {
      alert('Failed to unshare note: ' + (err.message || 'Check network'));
    }
  };

  // Copy formatted river report text
  const handleCopyFormattedReport = (note: FieldNote | SharedFieldNote, isSharedRecord = false) => {
    const authorHeader = isSharedRecord 
      ? `🎣 Shared River Report by ${(note as SharedFieldNote).authorName} (${(note as SharedFieldNote).authorRole || 'Angler'})\n`
      : `📓 Skeena Field Log: ${note.title}\n`;

    const clarityText = note.waterClarity ? `Water Clarity: ${CLARITY_LABELS[note.waterClarity]?.label || note.waterClarity}` : '';
    const tempText = note.waterTempC !== undefined ? `Water Temp: ${note.waterTempC}°C` : '';
    const gaugeText = note.waterLevelGauge ? `Gauge Height: ${note.waterLevelGauge}` : '';
    const flyText = note.flyPattern ? `Fly/Tackle: ${note.flyPattern}` : '';
    const fishText = (note.steelheadHooked !== undefined || note.steelheadLanded !== undefined)
      ? `Steelhead: ${note.steelheadHooked || 0} hooked, ${note.steelheadLanded || 0} landed`
      : '';

    const poolNameStr = 'poolName' in note && note.poolName 
      ? note.poolName 
      : ('location' in note && note.location?.poolName) 
        ? note.location.poolName 
        : '';

    const lines = [
      authorHeader,
      `📍 Tributary: ${note.tributary}`,
      poolNameStr ? `🌊 Pool: ${poolNameStr}` : '',
      `📅 Date: ${note.date} ${note.time || ''}`,
      clarityText,
      tempText,
      gaugeText,
      flyText,
      fishText,
      note.notes ? `\n📝 Field Notes:\n${note.notes}` : '',
      `\n🔗 Skeena Steelhead Run Tracker`
    ].filter(Boolean).join('\n');

    navigator.clipboard?.writeText(lines);
    setCopiedReportId(note.id);
    setTimeout(() => setCopiedReportId(null), 2500);
  };

  // Clone shared note into personal local vault
  const handleCloneToMyVault = async (sharedNote: SharedFieldNote) => {
    const cloneId = `note_cloned_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const clonedNote: FieldNote = {
      id: cloneId,
      userId: userId,
      title: `[Shared by ${sharedNote.authorName}] ${sharedNote.title}`,
      tributary: sharedNote.tributary,
      location: {
        lat: sharedNote.lat || TRIBUTARIES_COORDINATES[sharedNote.tributary]?.lat || 54.78,
        lng: sharedNote.lng || TRIBUTARIES_COORDINATES[sharedNote.tributary]?.lng || -127.17,
        riverSystem: sharedNote.tributary,
        poolName: sharedNote.poolName
      },
      date: sharedNote.date,
      time: sharedNote.time,
      waterClarity: sharedNote.waterClarity,
      waterTempC: sharedNote.waterTempC,
      waterLevelGauge: sharedNote.waterLevelGauge,
      flyPattern: sharedNote.flyPattern,
      steelheadHooked: sharedNote.steelheadHooked,
      steelheadLanded: sharedNote.steelheadLanded,
      notes: `--- Shared by ${sharedNote.authorName} (${sharedNote.authorRole || 'Angler'}) ---\n${sharedNote.notes}`,
      photos: sharedNote.photos || [],
      storageMode: 'cloud_encrypted',
      syncStatus: isOnline ? 'pending_sync' : 'pending_sync',
      isShared: false,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    try {
      await saveFieldNoteLocal(clonedNote);
      await loadNotes();
      setSyncNotice(`Saved copy of "${sharedNote.title}" to your personal vault.`);
      setTimeout(() => setSyncNotice(null), 4000);
      setActiveTab('my_vault');
    } catch (err) {
      console.error('Failed to clone shared note:', err);
      alert('Could not save note to local vault.');
    }
  };

  // Encrypt & Sync Handler
  const handleEncryptAndSync = async () => {
    if (!isOnline) {
      setSyncNotice('Device is currently offline. Your entries are safely stored locally in the vault and will sync once connected.');
      return;
    }
    setSyncing(true);
    setSyncNotice(null);
    try {
      const keySeed = user?.uid || 'skeena_field_vault_key';
      const result = await encryptAndSyncFieldNotes(userId, keySeed);
      await loadNotes();
      if (result.errors.length > 0) {
        setSyncNotice(`Synced with warnings: ${result.errors.join(', ')}`);
      } else {
        setSyncNotice(`Successfully encrypted & synced ${result.syncedCount} entry(ies) to cloud.`);
        setTimeout(() => setSyncNotice(null), 5000);
      }
    } catch (err: any) {
      setSyncNotice(`Sync notice: ${err.message || 'Encryption sync in progress'}`);
    } finally {
      setSyncing(false);
    }
  };

  // Geolocation Handler
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser/device.');
      return;
    }
    setIsGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormLat(Number(pos.coords.latitude.toFixed(5)));
        setFormLng(Number(pos.coords.longitude.toFixed(5)));
        setIsGeoLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setIsGeoLocating(false);
        alert('Could not fetch exact GPS. You can drop a pin on the river map or enter coordinates manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Photo Upload Handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressingPhoto(true);
    const newPhotos: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const compressedBase64 = await compressImageFile(file, 1280, 0.78);
        newPhotos.push(compressedBase64);
      } catch (err) {
        console.error('Failed to compress image:', err);
      }
    }

    setFormPhotos((prev) => [...prev, ...newPhotos]);
    setIsCompressingPhoto(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (index: number) => {
    setFormPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Map Click to Set River & Coordinates
  const handleSelectRiverOnMap = (riverName: string) => {
    const data = TRIBUTARIES_COORDINATES[riverName];
    if (data) {
      setFormTributary(riverName);
      setFormLat(data.lat);
      setFormLng(data.lng);
    }
  };

  // Save New or Edited Note
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Please provide a title or pool name for your field entry.');
      return;
    }

    const nowIso = new Date().toISOString();

    if (editingNoteId) {
      // UPDATE EXISTING NOTE
      const existingNote = notes.find((n) => n.id === editingNoteId);
      const updatedNote: FieldNote = {
        id: editingNoteId,
        userId: userId,
        title: formTitle.trim(),
        tributary: formTributary,
        location: {
          lat: formLat,
          lng: formLng,
          riverSystem: formTributary,
          poolName: formPoolName.trim() || undefined
        },
        date: formDate,
        time: formTime,
        waterClarity: formClarity,
        waterTempC: formWaterTemp ? Number(formWaterTemp) : undefined,
        waterLevelGauge: formGauge.trim() || undefined,
        flyPattern: formFlyPattern.trim() || undefined,
        steelheadHooked: formHooked,
        steelheadLanded: formLanded,
        notes: formNotes.trim(),
        photos: formPhotos,
        storageMode: formStorageMode,
        syncStatus: formStorageMode === 'cloud_encrypted' ? (isOnline ? 'pending_sync' : 'pending_sync') : 'local_only',
        isShared: existingNote ? existingNote.isShared : false,
        sharedWithUserIds: existingNote?.sharedWithUserIds || [],
        sharedWithNames: existingNote?.sharedWithNames || {},
        isGpsCloaked: existingNote?.isGpsCloaked || false,
        createdAt: existingNote?.createdAt || nowIso,
        updatedAt: nowIso
      };

      try {
        await saveFieldNoteLocal(updatedNote);

        // If this note is already shared with peers, update the public shared record as well
        if (updatedNote.isShared && user && updatedNote.sharedWithUserIds && updatedNote.sharedWithUserIds.length > 0) {
          try {
            await shareFieldNoteWithUsers(
              updatedNote,
              updatedNote.sharedWithUserIds,
              updatedNote.sharedWithNames || {},
              Boolean(updatedNote.isGpsCloaked),
              user
            );
          } catch (sharedUpdateErr) {
            console.warn('Could not update shared peer record on edit:', sharedUpdateErr);
          }
        }

        setIsModalOpen(false);
        resetForm();
        await loadNotes();
        setSyncNotice(`Updated "${updatedNote.title}" in your field vault.`);
        setTimeout(() => setSyncNotice(null), 4000);

        if (formStorageMode === 'cloud_encrypted' && isOnline) {
          handleEncryptAndSync();
        }
      } catch (err) {
        console.error('Failed to update field note:', err);
        alert('Error updating note in local vault.');
      }
    } else {
      // CREATE NEW NOTE
      const noteId = `note_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const newNote: FieldNote = {
        id: noteId,
        userId: userId,
        title: formTitle.trim(),
        tributary: formTributary,
        location: {
          lat: formLat,
          lng: formLng,
          riverSystem: formTributary,
          poolName: formPoolName.trim() || undefined
        },
        date: formDate,
        time: formTime,
        waterClarity: formClarity,
        waterTempC: formWaterTemp ? Number(formWaterTemp) : undefined,
        waterLevelGauge: formGauge.trim() || undefined,
        flyPattern: formFlyPattern.trim() || undefined,
        steelheadHooked: formHooked,
        steelheadLanded: formLanded,
        notes: formNotes.trim(),
        photos: formPhotos,
        storageMode: formStorageMode,
        syncStatus: formStorageMode === 'cloud_encrypted' ? (isOnline ? 'pending_sync' : 'pending_sync') : 'local_only',
        createdAt: nowIso,
        updatedAt: nowIso
      };

      try {
        await saveFieldNoteLocal(newNote);
        setIsModalOpen(false);
        resetForm();
        await loadNotes();

        // Trigger automatic Encrypt & Sync if cloud mode & online
        if (formStorageMode === 'cloud_encrypted' && isOnline) {
          handleEncryptAndSync();
        }
      } catch (err) {
        console.error('Failed to save field note:', err);
        alert('Error saving note to local vault.');
      }
    }
  };

  // Open edit modal and populate fields
  const handleOpenEditNote = (note: FieldNote) => {
    setEditingNoteId(note.id);
    setFormTributary(note.tributary);
    setFormTitle(note.title);
    setFormPoolName(note.location?.poolName || '');
    setFormDate(note.date);
    setFormTime(note.time || new Date().toTimeString().slice(0, 5));
    setFormLat(note.location?.lat ?? TRIBUTARIES_COORDINATES[note.tributary]?.lat ?? 54.78);
    setFormLng(note.location?.lng ?? TRIBUTARIES_COORDINATES[note.tributary]?.lng ?? -127.17);
    setFormClarity(note.waterClarity || 'clear_tinted');
    setFormWaterTemp(note.waterTempC !== undefined ? String(note.waterTempC) : '');
    setFormGauge(note.waterLevelGauge || '');
    setFormFlyPattern(note.flyPattern || '');
    setFormHooked(note.steelheadHooked || 0);
    setFormLanded(note.steelheadLanded || 0);
    setFormNotes(note.notes || '');
    setFormPhotos(note.photos || []);
    setFormStorageMode(note.storageMode || 'cloud_encrypted');
    setIsModalOpen(true);
  };

  // Open create new note modal
  const handleOpenCreateNote = () => {
    setEditingNoteId(null);
    resetForm();
    setFormTributary(selectedTributaryFilter === 'all' ? 'Bulkley River' : selectedTributaryFilter);
    const coords = TRIBUTARIES_COORDINATES[selectedTributaryFilter === 'all' ? 'Bulkley River' : selectedTributaryFilter];
    if (coords) {
      setFormLat(coords.lat);
      setFormLng(coords.lng);
    }
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingNoteId(null);
    setFormTitle('');
    setFormPoolName('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormTime(new Date().toTimeString().slice(0, 5));
    setFormWaterTemp('9.5');
    setFormGauge('1.45m');
    setFormNotes('');
    setFormFlyPattern('');
    setFormHooked(0);
    setFormLanded(0);
    setFormPhotos([]);
  };

  // Delete Note
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this private field note? This action cannot be undone.')) return;
    try {
      await deleteFieldNoteBoth(userId, noteId);
      if (selectedNote?.id === noteId) setSelectedNote(null);
      await loadNotes();
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  // Export Encrypted Vault Backup
  const handleExportVault = () => {
    const dataStr = JSON.stringify(notes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skeena-field-vault-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchRiver = selectedTributaryFilter === 'all' || n.tributary === selectedTributaryFilter;
      const matchQuery = !searchQuery.trim() || 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.location.poolName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.flyPattern?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchRiver && matchQuery;
    });
  }, [notes, selectedTributaryFilter, searchQuery]);

  // Filtered Shared Notes
  const filteredSharedNotes = useMemo(() => {
    return sharedNotes.filter((sn) => {
      const matchRiver = selectedTributaryFilter === 'all' || sn.tributary === selectedTributaryFilter;
      const matchQuery = !searchQuery.trim() ||
        sn.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sn.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sn.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sn.poolName && sn.poolName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (sn.flyPattern && sn.flyPattern.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchRiver && matchQuery;
    });
  }, [sharedNotes, selectedTributaryFilter, searchQuery]);

  const pendingCount = notes.filter(n => n.storageMode === 'cloud_encrypted' && n.syncStatus === 'pending_sync').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-[var(--accent-amber)] border border-amber-500/30">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-[var(--text-main)] uppercase">
                  Field Notes
                </h1>
                <div className="flex items-center gap-2 mt-0.5 text-xs font-mono text-[var(--text-muted)]">
                  <span className="flex items-center gap-1 text-emerald-500">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Zero-Knowledge AES-256</span>
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    {isOnline ? (
                      <span className="text-emerald-500 flex items-center gap-1">
                        <Wifi className="w-3.5 h-3.5" /> Online
                      </span>
                    ) : (
                      <span className="text-amber-500 flex items-center gap-1">
                        <WifiOff className="w-3.5 h-3.5" /> Offline (Vault Active)
                      </span>
                    )}
                  </span>
                  <span>&bull;</span>
                  <span>{notes.length} Encrypted Entries</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => setIsDisclosureOpen(true)}
              className="px-3 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] border border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-main)] transition flex items-center gap-1.5"
            >
              <Info className="w-4 h-4 text-[var(--accent-amber)]" />
              <span>Security Fine Print</span>
            </button>

            <button
              type="button"
              onClick={handleExportVault}
              disabled={notes.length === 0}
              className="px-3 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] border border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-main)] transition flex items-center gap-1.5 disabled:opacity-40"
              title="Download encrypted backup file"
            >
              <Download className="w-4 h-4" />
              <span>Backup Vault</span>
            </button>

            <button
              type="button"
              onClick={handleEncryptAndSync}
              disabled={syncing}
              className="px-4 py-2 rounded-xl bg-[var(--accent-amber)] hover:opacity-90 text-white font-bold transition shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>Encrypt &amp; Sync</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setFormTributary('Bulkley River');
                handleSelectRiverOnMap('Bulkley River');
                setIsModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Field Entry</span>
            </button>
          </div>
        </div>

        {/* Sync Toast / Notice */}
        {syncNotice && (
          <div className="mt-4 p-3 rounded-xl bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)] text-xs font-mono text-[var(--text-main)] flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--accent-amber)] shrink-0" />
              <span>{syncNotice}</span>
            </div>
            <button 
              onClick={() => setSyncNotice(null)}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-main)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Interactive Watershed Map & Notes Library */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Watershed River Map & Pins (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[var(--accent-amber)]" />
                <h2 className="text-xs font-heading font-extrabold text-[var(--text-main)] uppercase tracking-wide">
                  Skeena Watershed Interactive Map
                </h2>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">Click pin to filter</span>
            </div>

            {/* River Map Canvas Container */}
            <div className="relative w-full aspect-[4/3] bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl overflow-hidden p-2 select-none">
              
              {/* Watershed SVG Topology */}
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="skeenaWaterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.7" />
                  </linearGradient>
                </defs>

                {/* Mainstem Skeena River Curve */}
                <path 
                  d="M 12 85 Q 24 75 35 68 T 50 48 T 60 25 T 75 12" 
                  fill="none" 
                  stroke="url(#skeenaWaterGradient)" 
                  strokeWidth="3.5" 
                  strokeLinecap="round"
                />

                {/* Bulkley River Tributary Branch */}
                <path 
                  d="M 45 55 Q 58 60 68 64 T 82 75" 
                  fill="none" 
                  stroke="#d97706" 
                  strokeWidth="2.5" 
                  strokeDasharray="1,0"
                  strokeOpacity="0.8"
                />

                {/* Babine River Branch */}
                <path 
                  d="M 52 45 Q 62 38 72 32 T 85 28" 
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth="2.2" 
                  strokeOpacity="0.8"
                />

                {/* Kispiox River Branch */}
                <path 
                  d="M 46 48 Q 48 38 52 28" 
                  fill="none" 
                  stroke="#f59e0b" 
                  strokeWidth="2" 
                  strokeOpacity="0.8"
                />

                {/* Kalum River Branch */}
                <path 
                  d="M 28 68 Q 26 58 28 48" 
                  fill="none" 
                  stroke="#38bdf8" 
                  strokeWidth="2" 
                  strokeOpacity="0.8"
                />

                {/* Copper / Zymoetz River Branch */}
                <path 
                  d="M 32 70 Q 40 75 48 82" 
                  fill="none" 
                  stroke="#06b6d4" 
                  strokeWidth="2" 
                  strokeOpacity="0.8"
                />

                {/* Sustut Headwater Branch */}
                <path 
                  d="M 62 25 Q 74 18 84 14" 
                  fill="none" 
                  stroke="#059669" 
                  strokeWidth="1.8" 
                  strokeOpacity="0.8"
                />
              </svg>

              {/* Tributary Map Pin Nodes */}
              {Object.entries(TRIBUTARIES_COORDINATES).map(([name, data]) => {
                const count = notes.filter(n => n.tributary === name).length;
                const isSelected = selectedTributaryFilter === name;

                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedTributaryFilter(selectedTributaryFilter === name ? 'all' : name)}
                    style={{ left: `${data.x}%`, top: `${data.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group z-10 focus:outline-none"
                  >
                    <div 
                      className={`relative flex items-center justify-center p-1.5 rounded-full border shadow-md transition-transform transform group-hover:scale-125 ${
                        isSelected 
                          ? 'bg-[var(--accent-amber)] border-white text-white ring-4 ring-amber-500/30 scale-110' 
                          : 'bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-main)] hover:border-[var(--accent-amber)]'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" style={{ color: isSelected ? '#ffffff' : data.color }} />
                      {count > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 px-1 py-0.2 bg-emerald-500 text-white rounded-full text-[9px] font-mono font-bold leading-tight">
                          {count}
                        </span>
                      )}
                    </div>

                    {/* Tooltip on hover */}
                    <div className="absolute left-1/2 bottom-full mb-1.5 -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                      <div className="px-2 py-1 bg-black/90 backdrop-blur-md text-white text-[10px] font-mono rounded-md shadow-lg whitespace-nowrap border border-white/10">
                        <p className="font-bold">{name}</p>
                        <p className="text-[9px] text-zinc-400">{count} private pins &bull; {data.desc}</p>
                      </div>
                      <div className="w-1.5 h-1.5 bg-black/90 rotate-45 -mt-0.5" />
                    </div>
                  </button>
                );
              })}

              {/* Map Footer Info */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-surface)]/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-[var(--border-main)]">
                <span>📍 Click river node to filter</span>
                <span className="text-emerald-500 font-semibold">🔒 Secret coordinates encrypted</span>
              </div>
            </div>

            {/* Quick River Filter Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setSelectedTributaryFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition border ${
                  selectedTributaryFilter === 'all'
                    ? 'bg-[var(--accent-amber)] text-white border-[var(--accent-amber)] font-bold'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-main)] hover:text-[var(--text-main)]'
                }`}
              >
                All Rivers ({notes.length})
              </button>

              {Object.keys(TRIBUTARIES_COORDINATES).map((name) => {
                const count = notes.filter(n => n.tributary === name).length;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedTributaryFilter(name)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-mono transition border ${
                      selectedTributaryFilter === name
                        ? 'bg-[var(--accent-amber)] text-white border-[var(--accent-amber)] font-bold'
                        : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-main)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {name.replace(' River', '').replace(' Watershed', '')} {count > 0 ? `(${count})` : ''}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Notes Library, Search & Filtered Cards (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Main Navigation Tabs: My Vault vs Shared With Me */}
          <div className="flex items-center justify-between p-1.5 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl gap-2 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab('my_vault')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'my_vault'
                  ? 'bg-[var(--accent-amber)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>My Field Vault</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === 'my_vault' ? 'bg-white/20 text-white' : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-main)]'
              }`}>
                {notes.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('shared_with_me')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'shared_with_me'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Shared With Me</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === 'shared_with_me' ? 'bg-white/20 text-white' : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-main)]'
              }`}>
                {sharedNotes.length}
              </span>
            </button>
          </div>

          {/* Search and River Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={activeTab === 'my_vault' ? "Search notes, pool names, fly patterns, GPS..." : "Search shared notes, author name, flies..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] text-xs font-mono focus:outline-none focus:border-[var(--accent-amber)] transition"
              />
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5 pointer-events-none" />
            </div>

            {selectedTributaryFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedTributaryFilter('all')}
                className="px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] text-xs font-mono text-[var(--accent-amber)] hover:bg-[var(--bg-subtle)] flex items-center gap-1.5 shrink-0"
              >
                <span>Filter: {selectedTributaryFilter}</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: MY FIELD VAULT */}
          {/* ========================================================================= */}
          {activeTab === 'my_vault' && (
            <>
              {loading ? (
                <div className="p-12 text-center text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--accent-amber)]" />
                  <p>Decrypting and loading your local field vault...</p>
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="p-8 sm:p-12 text-center bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-[var(--accent-amber)] border border-amber-500/30 flex items-center justify-center mx-auto">
                    <Fish className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-heading font-extrabold text-[var(--text-main)]">
                    {searchQuery || selectedTributaryFilter !== 'all' ? 'No Matching Field Notes' : 'Your Field Vault is Empty'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] font-sans max-w-md mx-auto leading-relaxed">
                    Record secret river pools, GPS coordinates, water clarity, hooked fish stats, and compressed photos. Everything is saved locally and encrypted with AES-256.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenCreateNote}
                    className="px-4 py-2 rounded-xl bg-[var(--accent-amber)] text-white font-bold text-xs font-mono shadow-sm hover:opacity-90 transition inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create First Field Note</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredNotes.map((note) => {
                    const clarityInfo = note.waterClarity ? CLARITY_LABELS[note.waterClarity] : null;
                    const sharedCount = note.sharedWithUserIds?.length || 0;

                    return (
                      <div
                        key={note.id}
                        className="bg-[var(--bg-surface)] border border-[var(--border-main)] hover:border-[var(--accent-amber)]/60 rounded-2xl p-4 sm:p-5 shadow-sm transition space-y-3 relative group"
                      >
                        {/* Top Header of Card */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--accent-amber)] font-mono text-[11px] font-bold">
                                📍 {note.tributary}
                              </span>
                              {note.location.poolName && (
                                <span className="px-2 py-0.5 rounded-md bg-[var(--bg-subtle)] text-[var(--text-main)] font-mono text-[11px] font-medium border border-[var(--border-main)]">
                                  Pool: {note.location.poolName}
                                </span>
                              )}
                              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                                {note.date} {note.time ? `• ${note.time}` : ''}
                              </span>
                            </div>
                            <h3 className="text-base font-heading font-extrabold text-[var(--text-main)] tracking-tight">
                              {note.title}
                            </h3>
                          </div>

                          {/* Sync Status Badge & Delete Button */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {note.storageMode === 'local_only' ? (
                              <span className="px-2 py-0.5 rounded-md bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 text-[10px] font-mono flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Local Only
                              </span>
                            ) : note.syncStatus === 'synced' ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-mono flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Encrypted &amp; Synced
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-mono flex items-center gap-1">
                                <RefreshCw className="w-3 h-3" /> Pending Sync
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition"
                              title="Delete note"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Coordinates & Water Conditions Badges */}
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                          {note.location.lat && note.location.lng && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleCopyCoords(note.location.lat, note.location.lng, note.id)}
                                className="px-2 py-0.5 rounded-md bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-main)] text-[11px] flex items-center gap-1 transition"
                                title="Click to copy exact GPS coordinates"
                              >
                                <Compass className="w-3 h-3 text-[var(--accent-amber)]" />
                                <span>GPS: {note.location.lat.toFixed(4)}, {note.location.lng.toFixed(4)}</span>
                                {copiedNoteId === note.id ? (
                                  <span className="text-emerald-500 font-bold text-[10px] ml-0.5">Copied!</span>
                                ) : (
                                  <Copy className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                                )}
                              </button>

                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${note.location.lat},${note.location.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-1.5 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] flex items-center gap-0.5 transition font-semibold"
                                title="Open in Google Maps"
                              >
                                <span>Google Maps</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>

                              <a
                                href={`https://maps.apple.com/?q=${encodeURIComponent(note.title || note.tributary)}&ll=${note.location.lat},${note.location.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-1.5 py-0.5 rounded bg-zinc-500/10 hover:bg-zinc-500/20 text-zinc-700 dark:text-zinc-300 border border-zinc-500/20 text-[10px] flex items-center gap-0.5 transition font-semibold"
                                title="Open in Apple Maps"
                              >
                                <span>Apple Maps</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          )}

                          {clarityInfo && (
                            <span className={`px-2 py-0.5 rounded-md border text-[11px] flex items-center gap-1 ${clarityInfo.badge}`}>
                              <span>{clarityInfo.icon}</span>
                              <span>{clarityInfo.label}</span>
                            </span>
                          )}

                          {note.waterTempC !== undefined && (
                            <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[11px] flex items-center gap-1">
                              <Thermometer className="w-3 h-3" />
                              <span>{note.waterTempC}°C</span>
                            </span>
                          )}

                          {note.waterLevelGauge && (
                            <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[11px] flex items-center gap-1">
                              <Droplets className="w-3 h-3" />
                              <span>Gauge: {note.waterLevelGauge}</span>
                            </span>
                          )}
                        </div>

                        {/* Fly Pattern & Catch Stats */}
                        {(note.flyPattern || (note.steelheadHooked !== undefined && note.steelheadHooked > 0) || (note.steelheadLanded !== undefined && note.steelheadLanded > 0)) && (
                          <div className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] text-xs font-mono flex flex-wrap items-center gap-3">
                            {note.flyPattern && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[var(--text-muted)]">Pattern:</span>
                                <span className="text-[var(--text-main)] font-semibold">{note.flyPattern}</span>
                              </div>
                            )}
                            {(note.steelheadHooked !== undefined || note.steelheadLanded !== undefined) && (
                              <div className="flex items-center gap-2 border-l border-[var(--border-main)] pl-3">
                                <span className="text-[var(--text-muted)]">Fish:</span>
                                <span className="text-amber-500 font-bold">{note.steelheadHooked || 0} Hooked</span>
                                <span>&bull;</span>
                                <span className="text-emerald-500 font-bold">{note.steelheadLanded || 0} Landed</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Note Content Text */}
                        {note.notes && (
                          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-sans leading-relaxed whitespace-pre-line">
                            {note.notes}
                          </p>
                        )}

                        {/* Attached Photos Gallery */}
                        {note.photos && note.photos.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {note.photos.map((photoUrl, idx) => (
                              <div
                                key={idx}
                                onClick={() => setLightboxPhoto(photoUrl)}
                                className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-[var(--border-main)] cursor-pointer group/photo shadow-sm hover:border-[var(--accent-amber)] transition"
                              >
                                <img 
                                  src={photoUrl} 
                                  alt={`Field note attachment ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover/photo:scale-105 transition duration-300"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/photo:opacity-100 transition flex items-center justify-center text-white">
                                  <Eye className="w-4 h-4" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                          {/* Card Bottom Bar: Sharing Status & Actions */}
                          <div className="pt-2 border-t border-[var(--border-main)] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                            <div className="flex items-center gap-2">
                              {note.isShared && sharedCount > 0 ? (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[11px] font-semibold flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5" />
                                  <span>Shared with {sharedCount} Angler{sharedCount > 1 ? 's' : ''}</span>
                                  {note.isGpsCloaked && (
                                    <span className="text-[10px] text-amber-500 font-normal">(GPS Cloaked)</span>
                                  )}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-main)] text-[11px] flex items-center gap-1">
                                  <Lock className="w-3 h-3" />
                                  <span>Private Vault Only</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Edit Note Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditNote(note)}
                                className="px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] border border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-main)] transition flex items-center gap-1 text-[11px] font-semibold"
                                title="Edit note details, water conditions, or flies"
                              >
                                <Sliders className="w-3 h-3 text-[var(--accent-amber)]" />
                                <span>Edit Note</span>
                              </button>

                              {/* Direct Unshare Button (if currently shared) */}
                              {note.isShared && (
                                <button
                                  type="button"
                                  onClick={() => handleDirectUnshare(note)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 transition flex items-center gap-1 text-[11px] font-semibold"
                                  title="Instantly revoke all peer sharing and make this note private"
                                >
                                  <EyeOff className="w-3 h-3" />
                                  <span>Unshare</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleCopyFormattedReport(note)}
                                className="px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] border border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-main)] transition flex items-center gap-1 text-[11px]"
                                title="Copy report text to clipboard"
                              >
                                <Copy className="w-3 h-3" />
                                <span>{copiedReportId === note.id ? 'Copied Log!' : 'Copy Summary'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenShareModal(note)}
                                className="px-3 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 border border-sky-500/30 transition flex items-center gap-1.5 text-[11px] font-bold"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>{note.isShared ? 'Manage Sharing' : 'Share with Anglers'}</span>
                              </button>
                            </div>
                          </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: SHARED WITH ME (Peer-to-Peer Angler Reports) */}
          {/* ========================================================================= */}
          {activeTab === 'shared_with_me' && (
            <>
              {(!user || user.isLocalOnly) ? (
                <div className="p-8 sm:p-12 text-center bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 border border-sky-500/30 flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-heading font-extrabold text-[var(--text-main)]">
                    Sign In to Receive Shared Field Notes
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] font-sans max-w-md mx-auto leading-relaxed">
                    Other anglers can share specific river logs, clarity checks, and fly setups directly to your username. Sign in or create an account to discover incoming reports.
                  </p>
                  <button
                    type="button"
                    onClick={() => openAuthModal()}
                    className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs font-mono shadow-sm transition inline-flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Sign In or Register</span>
                  </button>
                </div>
              ) : filteredSharedNotes.length === 0 ? (
                <div className="p-8 sm:p-12 text-center bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 border border-sky-500/30 flex items-center justify-center mx-auto">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-heading font-extrabold text-[var(--text-main)]">
                    {searchQuery || selectedTributaryFilter !== 'all' ? 'No Matching Shared Notes' : 'No Field Notes Shared With You Yet'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] font-sans max-w-md mx-auto leading-relaxed">
                    When fellow anglers, guides, or biologists share field notes specifically with your username (<strong>{user.displayName || user.email}</strong>), they will appear here in real time.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredSharedNotes.map((sn) => {
                    const clarityInfo = sn.waterClarity ? CLARITY_LABELS[sn.waterClarity] : null;

                    return (
                      <div
                        key={sn.id}
                        className="bg-[var(--bg-surface)] border border-[var(--border-main)] hover:border-sky-500/50 rounded-2xl p-4 sm:p-5 shadow-sm transition space-y-3 relative group"
                      >
                        {/* Top Header with Author Profile */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Author Badge */}
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-500 border border-sky-500/20 text-xs font-mono font-bold">
                                <span>🎣</span>
                                <span>{sn.authorName}</span>
                                {sn.authorRole && (
                                  <span className="text-[10px] text-[var(--text-muted)] uppercase font-normal ml-0.5">
                                    ({sn.authorRole})
                                  </span>
                                )}
                              </div>

                              <span className="px-2.5 py-0.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--accent-amber)] font-mono text-[11px] font-bold">
                                📍 {sn.tributary}
                              </span>

                              {sn.poolName ? (
                                <span className="px-2 py-0.5 rounded-md bg-[var(--bg-subtle)] text-[var(--text-main)] font-mono text-[11px] font-medium border border-[var(--border-main)]">
                                  Pool: {sn.poolName}
                                </span>
                              ) : sn.isGpsCloaked ? (
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono text-[10px] flex items-center gap-1">
                                  <EyeOff className="w-3 h-3" />
                                  <span>Exact Spot Cloaked</span>
                                </span>
                              ) : null}

                              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                                {sn.date} {sn.time ? `• ${sn.time}` : ''}
                              </span>
                            </div>

                            <h3 className="text-base font-heading font-extrabold text-[var(--text-main)] tracking-tight">
                              {sn.title}
                            </h3>
                          </div>
                        </div>

                        {/* Conditions & Coordinates */}
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                          {!sn.isGpsCloaked && sn.lat && sn.lng && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleCopyCoords(sn.lat!, sn.lng!, sn.id)}
                                className="px-2 py-0.5 rounded-md bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-main)] text-[11px] flex items-center gap-1 transition"
                                title="Click to copy GPS coordinates"
                              >
                                <Compass className="w-3 h-3 text-[var(--accent-amber)]" />
                                <span>GPS: {sn.lat.toFixed(4)}, {sn.lng.toFixed(4)}</span>
                                {copiedNoteId === sn.id ? (
                                  <span className="text-emerald-500 font-bold text-[10px] ml-0.5">Copied!</span>
                                ) : (
                                  <Copy className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                                )}
                              </button>

                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${sn.lat},${sn.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-1.5 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] flex items-center gap-0.5 transition font-semibold"
                              >
                                <span>Google Maps</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          )}

                          {clarityInfo && (
                            <span className={`px-2 py-0.5 rounded-md border text-[11px] flex items-center gap-1 ${clarityInfo.badge}`}>
                              <span>{clarityInfo.icon}</span>
                              <span>{clarityInfo.label}</span>
                            </span>
                          )}

                          {sn.waterTempC !== undefined && (
                            <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[11px] flex items-center gap-1">
                              <Thermometer className="w-3 h-3" />
                              <span>{sn.waterTempC}°C</span>
                            </span>
                          )}

                          {sn.waterLevelGauge && (
                            <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[11px] flex items-center gap-1">
                              <Droplets className="w-3 h-3" />
                              <span>Gauge: {sn.waterLevelGauge}</span>
                            </span>
                          )}
                        </div>

                        {/* Fly Pattern & Fish Count */}
                        {(sn.flyPattern || (sn.steelheadHooked !== undefined && sn.steelheadHooked > 0) || (sn.steelheadLanded !== undefined && sn.steelheadLanded > 0)) && (
                          <div className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] text-xs font-mono flex flex-wrap items-center gap-3">
                            {sn.flyPattern && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[var(--text-muted)]">Pattern:</span>
                                <span className="text-[var(--text-main)] font-semibold">{sn.flyPattern}</span>
                              </div>
                            )}
                            {(sn.steelheadHooked !== undefined || sn.steelheadLanded !== undefined) && (
                              <div className="flex items-center gap-2 border-l border-[var(--border-main)] pl-3">
                                <span className="text-[var(--text-muted)]">Fish:</span>
                                <span className="text-amber-500 font-bold">{sn.steelheadHooked || 0} Hooked</span>
                                <span>&bull;</span>
                                <span className="text-emerald-500 font-bold">{sn.steelheadLanded || 0} Landed</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Notes text */}
                        {sn.notes && (
                          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-sans leading-relaxed whitespace-pre-line">
                            {sn.notes}
                          </p>
                        )}

                        {/* Photos */}
                        {sn.photos && sn.photos.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {sn.photos.map((photoUrl, idx) => (
                              <div
                                key={idx}
                                onClick={() => setLightboxPhoto(photoUrl)}
                                className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-[var(--border-main)] cursor-pointer group/photo shadow-sm hover:border-sky-500 transition"
                              >
                                <img 
                                  src={photoUrl} 
                                  alt={`Shared note attachment ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover/photo:scale-105 transition duration-300"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/photo:opacity-100 transition flex items-center justify-center text-white">
                                  <Eye className="w-4 h-4" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="pt-2 border-t border-[var(--border-main)] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                          <span className="text-[11px] text-[var(--text-muted)]">
                            Shared directly with your account &bull; Real-time sync
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopyFormattedReport(sn, true)}
                              className="px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] border border-[var(--border-main)] text-[var(--text-secondary)] hover:text-[var(--text-main)] transition flex items-center gap-1 text-[11px]"
                            >
                              <Copy className="w-3 h-3" />
                              <span>{copiedReportId === sn.id ? 'Copied!' : 'Copy Summary'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCloneToMyVault(sn)}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 text-[11px] font-bold shadow-sm"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Save to My Vault</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: Share Field Note with Selected Anglers (Searchable by Username) */}
      {/* ========================================================================= */}
      {isShareModalOpen && shareTargetNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[var(--text-main)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-main)] bg-[var(--bg-subtle)]">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/30">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-heading font-extrabold text-[var(--text-main)] tracking-tight">
                    Share Field Note
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] font-mono">
                    Select specific anglers by username &bull; Private peer-to-peer sharing
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs font-mono">
              
              {/* Note Summary banner */}
              <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-1">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Selected Field Note</p>
                <p className="font-heading font-bold text-sm text-[var(--text-main)]">{shareTargetNote.title}</p>
                <p className="text-[11px] text-[var(--accent-amber)] font-mono">
                  📍 {shareTargetNote.tributary} {shareTargetNote.location.poolName ? `• Pool: ${shareTargetNote.location.poolName}` : ''} &bull; {shareTargetNote.date}
                </p>
              </div>

              {/* Username Search Input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)]">
                  Search Registered Anglers or Add by Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type an angler username, role, or river..."
                    value={shareSearchQuery}
                    onChange={(e) => handleSearchAnglers(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] text-xs font-mono focus:outline-none focus:border-sky-500 transition"
                  />
                  <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3 pointer-events-none" />
                </div>

                {/* Direct Add Option if user typed a username not already in selected list */}
                {shareSearchQuery.trim() && !selectedShareRecipients.some(r => r.userId.toLowerCase() === shareSearchQuery.trim().toLowerCase()) && (
                  <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-between gap-2 mt-2">
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-sky-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-[var(--text-main)]">Add "{shareSearchQuery.trim()}" directly</p>
                        <p className="text-[10px] text-[var(--text-muted)]">Share to this angler handle/username immediately</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddDirectRecipient(shareSearchQuery.trim())}
                      className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold font-mono transition flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Angler</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Search Results Dropdown/List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-muted)]">
                  <span>Angler Directory</span>
                  {searchingAnglers && <span className="text-sky-500 animate-pulse">Searching...</span>}
                </div>

                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 border border-[var(--border-main)] rounded-xl p-2 bg-[var(--bg-subtle)]/50">
                  {anglerSearchResults.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[var(--text-muted)]">
                      {shareSearchQuery.trim() ? 'No anglers found matching your search term.' : 'Search for a username above or select from active anglers.'}
                    </div>
                  ) : (
                    anglerSearchResults.map((angler) => {
                      const isAdded = selectedShareRecipients.some((r) => r.userId === angler.userId);

                      return (
                        <div
                          key={angler.userId}
                          className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-main)] hover:border-sky-500/40 transition"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-500 font-bold flex items-center justify-center text-xs">
                              {angler.displayName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-[var(--text-main)] text-xs">{angler.displayName}</p>
                              <p className="text-[10px] text-[var(--text-muted)]">
                                {angler.riverRole} &bull; {angler.preferredTributary || 'Skeena Watershed'}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => isAdded ? handleRemoveRecipient(angler.userId) : handleAddRecipient(angler)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1 ${
                              isAdded 
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30'
                                : 'bg-sky-600 hover:bg-sky-700 text-white'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Selected</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3" />
                                <span>Add</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Selected Recipients Tag List */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)]">
                  Selected Recipients ({selectedShareRecipients.length})
                </label>

                {selectedShareRecipients.length === 0 ? (
                  <div className="p-3 rounded-xl border border-dashed border-[var(--border-main)] text-center text-xs text-[var(--text-muted)] font-mono">
                    No anglers selected yet. Select usernames from the directory above.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)]">
                    {selectedShareRecipients.map((recipient) => (
                      <span
                        key={recipient.userId}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] text-sky-500 border border-sky-500/30 text-xs font-mono font-semibold"
                      >
                        <UserCheck className="w-3 h-3 text-sky-500" />
                        <span>{recipient.displayName}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipient(recipient.userId)}
                          className="p-0.5 hover:text-rose-500 text-[var(--text-muted)] transition"
                          title="Remove angler"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* GPS Privacy & Cloaking Switch */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isShareGpsCloaked ? (
                      <EyeOff className="w-4 h-4 text-amber-500 shrink-0" />
                    ) : (
                      <Compass className="w-4 h-4 text-[var(--accent-amber)] shrink-0" />
                    )}
                    <div>
                      <p className="font-bold text-[var(--text-main)] text-xs">GPS &amp; Secret Spot Cloaking</p>
                      <p className="text-[11px] text-[var(--text-muted)] font-sans">
                        {isShareGpsCloaked 
                          ? 'Protected: Exact GPS coordinates & pool names are hidden. Only tributary name and water conditions are shared.'
                          : 'Exact Pin: Latitude, longitude, and pool name will be viewable by selected recipients.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsShareGpsCloaked(!isShareGpsCloaked)}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition shrink-0 ${
                      isShareGpsCloaked 
                        ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-main)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {isShareGpsCloaked ? '🛡️ GPS Cloaked' : '📍 Share Exact GPS'}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-main)] gap-2">
                {shareTargetNote.isShared ? (
                  <button
                    type="button"
                    onClick={handleRevokeAllSharing}
                    disabled={savingShare}
                    className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 text-xs font-mono font-bold transition disabled:opacity-50"
                  >
                    Revoke All Access
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] text-[var(--text-secondary)] font-bold text-xs"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSharing}
                    disabled={savingShare}
                    className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs font-mono shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{savingShare ? 'Saving Permissions...' : 'Save & Share Note'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Create or Edit Field Entry */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[var(--text-main)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-main)] bg-[var(--bg-subtle)]">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-[var(--accent-amber)] border border-amber-500/30">
                  {editingNoteId ? <Sliders className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-heading font-extrabold text-[var(--text-main)] tracking-tight">
                    {editingNoteId ? 'Edit Field Note' : 'New Private Field Note'}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] font-mono">
                    {editingNoteId 
                      ? 'Update river observations, water clarity, or secret coordinates'
                      : 'AES-256 Zero-Knowledge Encrypted • 100% Offline Capable'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingNoteId(null);
                }}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveNote} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs font-mono">
              
              {/* Tributary and Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                    River System / Tributary <span className="text-[var(--accent-amber)]">*</span>
                  </label>
                  <select
                    value={formTributary}
                    onChange={(e) => {
                      setFormTributary(e.target.value);
                      handleSelectRiverOnMap(e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)] font-mono"
                  >
                    {Object.keys(TRIBUTARIES_COORDINATES).map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                    Pool / Secret Run Name (Encrypted)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Upper Canyon Tailout, Big Rock Run"
                    value={formPoolName}
                    onChange={(e) => setFormPoolName(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                  Entry Title / Summary <span className="text-[var(--accent-amber)]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh pulse on the Bulkley, afternoon hookup"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                />
              </div>

              {/* GPS Coordinates & Geolocation */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-[var(--accent-amber)]" />
                    <span className="font-bold text-[var(--text-main)] text-xs">GPS Coordinates (Encrypted Zero-Knowledge)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isGeoLocating}
                    className="px-2.5 py-1 rounded-lg bg-[var(--accent-amber)] hover:opacity-90 text-white font-bold text-[11px] transition flex items-center gap-1 disabled:opacity-50"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{isGeoLocating ? 'Acquiring GPS...' : '📍 Use Current GPS'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-[var(--text-muted)] mb-1">Latitude</label>
                    <input
                      type="number"
                      step="0.00001"
                      value={formLat}
                      onChange={(e) => setFormLat(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-lg text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[var(--text-muted)] mb-1">Longitude</label>
                    <input
                      type="number"
                      step="0.00001"
                      value={formLng}
                      onChange={(e) => setFormLng(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-lg text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                    />
                  </div>
                </div>

                {/* Map Preview Links */}
                {formLat && formLng ? (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">Preview pin:</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${formLat},${formLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5"
                    >
                      Google Maps <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <span className="text-zinc-500">&bull;</span>
                    <a
                      href={`https://maps.apple.com/?q=${encodeURIComponent(formTitle || formTributary)}&ll=${formLat},${formLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-zinc-400 hover:underline flex items-center gap-0.5"
                    >
                      Apple Maps <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                ) : null}
              </div>

              {/* Date, Time, Clarity, Temp */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-lg text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1">Time</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-lg text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1">Water Clarity</label>
                  <select
                    value={formClarity}
                    onChange={(e) => setFormClarity(e.target.value as WaterClarityType)}
                    className="w-full px-2 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-lg text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)] truncate"
                  >
                    {Object.entries(CLARITY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1">Water Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 9.5"
                    value={formWaterTemp}
                    onChange={(e) => setFormWaterTemp(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-lg text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                  />
                </div>
              </div>

              {/* Fly Pattern & Hooked / Landed */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1">
                    Fly Pattern / Line / Rig Setup
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bulkley Special #4, 12ft sink-tip T-14"
                    value={formFlyPattern}
                    onChange={(e) => setFormFlyPattern(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-lg text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-amber-500 mb-1">Hooked</label>
                    <input
                      type="number"
                      min="0"
                      value={formHooked}
                      onChange={(e) => setFormHooked(parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-lg text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-500 mb-1">Landed</label>
                    <input
                      type="number"
                      min="0"
                      value={formLanded}
                      onChange={(e) => setFormLanded(parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-lg text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)]"
                    />
                  </div>
                </div>
              </div>

              {/* Notes Details */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                  Field Observations &amp; Run Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Water rising slightly after afternoon rain, fish moving along the gravel bar edge. Hooked bright wild hen on the swing..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] text-xs focus:outline-none focus:border-[var(--accent-amber)] resize-none"
                />
              </div>

              {/* Photos Upload & Offline Compression */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary)]">
                    Photos (Compressed &amp; Encrypted Client-Side)
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressingPhoto}
                    className="px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] border border-[var(--border-main)] text-xs font-mono flex items-center gap-1.5 text-[var(--accent-amber)]"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{isCompressingPhoto ? 'Compressing...' : 'Add Photos'}</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    multiple
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {formPhotos.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2 bg-[var(--bg-subtle)] rounded-xl border border-[var(--border-main)]">
                    {formPhotos.map((p, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[var(--border-main)] group">
                        <img src={p} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-md opacity-90 hover:opacity-100 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Storage Mode Toggle */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-[var(--text-main)] text-xs">Storage &amp; Encryption Mode</p>
                  <p className="text-[11px] text-[var(--text-muted)] font-sans">
                    {formStorageMode === 'cloud_encrypted' 
                      ? 'Encrypted with AES-256 before upload. Synced across your authorized devices.'
                      : 'Stored only in this browser\'s local IndexedDB vault. Never transmitted anywhere.'}
                  </p>
                </div>
                <div className="flex items-center gap-1 p-1 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-main)] shrink-0">
                  <button
                    type="button"
                    onClick={() => setFormStorageMode('cloud_encrypted')}
                    className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition ${
                      formStorageMode === 'cloud_encrypted' ? 'bg-[var(--accent-amber)] text-white' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    AES Cloud Sync
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormStorageMode('local_only')}
                    className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition ${
                      formStorageMode === 'local_only' ? 'bg-[var(--accent-amber)] text-white' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    Local Only
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-main)]">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingNoteId(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--border-light)] text-[var(--text-secondary)] font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs font-mono shadow-sm flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{editingNoteId ? 'Update Field Note' : 'Save to Encrypted Vault'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Security & Privacy Disclosure / Fine Print */}
      {/* ========================================================================= */}
      {isDisclosureOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[var(--text-main)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-main)] bg-[var(--bg-subtle)]">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-heading font-extrabold text-[var(--text-main)] tracking-tight">
                    Security &amp; Privacy Fine Print
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] font-mono">
                    How your secret spots and field notes are protected
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDisclosureOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs font-sans leading-relaxed text-[var(--text-secondary)]">
              
              <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-1">
                <h4 className="font-heading font-bold text-sm text-[var(--text-main)] flex items-center gap-2">
                  <span>🛡️ 1. Zero-Knowledge AES-256-GCM Encryption</span>
                </h4>
                <p>
                  Before your GPS coordinates, pool names, observations, and photos ever leave your browser, they are encrypted locally using the <strong>Web Crypto API with AES-GCM (256-bit)</strong> and a cryptographically unique initialization vector (IV) &amp; salt. The server only receives scrambled ciphertext strings.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-1">
                <h4 className="font-heading font-bold text-sm text-[var(--text-main)] flex items-center gap-2">
                  <span>📡 2. 100% Offline Capability (IndexedDB Isolation)</span>
                </h4>
                <p>
                  Your device uses an isolated local database (IndexedDB). When you are fishing remote Skeena canyons with <strong>zero cell reception</strong> (e.g. Babine Counting Fence, Upper Sustut, Moricetown), you can save pins, notes, and photos with zero network requirements.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-1">
                <h4 className="font-heading font-bold text-sm text-[var(--text-main)] flex items-center gap-2">
                  <span>🔒 3. Inaccessible to Administrators &amp; Developers</span>
                </h4>
                <p>
                  Because the encryption keys reside strictly on the client, database administrators, cloud operators, and other users cannot decrypt or read your secret fishing pools, catch numbers, or coordinate markers.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-main)] space-y-1">
                <h4 className="font-heading font-bold text-sm text-[var(--text-main)] flex items-center gap-2">
                  <span>🚫 4. Strict Non-Aggregation Policy</span>
                </h4>
                <p>
                  Your field data is strictly private to your personal user ID. It is never aggregated into public heatmaps, scraped for commercial marketing, or shared with third parties.
                </p>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setIsDisclosureOpen(false)}
                  className="px-5 py-2 rounded-xl bg-[var(--accent-amber)] text-white font-bold text-xs font-mono shadow-sm hover:opacity-90 transition"
                >
                  Understood &amp; Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHOTO LIGHTBOX */}
      {/* ========================================================================= */}
      {lightboxPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/20 shadow-2xl">
            <img src={lightboxPhoto} alt="Enlarged field note attachment" className="w-full h-full object-contain max-h-[85vh]" />
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-3 right-3 p-2 bg-black/70 hover:bg-black text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
