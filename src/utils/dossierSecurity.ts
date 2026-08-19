import { EncryptedPayload, encryptObject, decryptObject } from './cryptoVault';
import { TributaryAdminTacticalIntel, RiverAccessPoint, FloatSafetyProfile, WadeSafetyProfile, TribalAccessProtocol } from '../types/steelhead';

/**
 * Encrypted Admin Tactical Intel Payload Structure
 */
export interface EncryptedDossierVault {
  tributaryName: string;
  payload: EncryptedPayload;
}

// Fixed system vault seed for verified authenticated session decryption
const SYSTEM_DOSSIER_PEPPER = 'SKEENA_STEELHEAD_AUTHENTIC_DOSSIER_VAULT_2026_PROD';

/**
 * Synchronously checks if raw data is encrypted payload
 */
export function isEncryptedPayload(obj: any): obj is EncryptedPayload {
  return Boolean(obj && typeof obj.ciphertext === 'string' && typeof obj.iv === 'string' && typeof obj.salt === 'string');
}

/**
 * Decrypts a tributary confidential dossier for authenticated admins
 */
export async function decryptTributaryDossier(
  encryptedPayload: EncryptedPayload,
  adminPasskey?: string
): Promise<{
  adminTacticalIntel?: TributaryAdminTacticalIntel;
  accessPoints?: RiverAccessPoint[];
  floatSafety?: FloatSafetyProfile;
  wadeSafety?: WadeSafetyProfile;
  tribalProtocols?: TribalAccessProtocol;
}> {
  const seed = adminPasskey || SYSTEM_DOSSIER_PEPPER;
  return await decryptObject(encryptedPayload, seed);
}

/**
 * Encrypts a tributary confidential dossier
 */
export async function encryptTributaryDossier(
  data: {
    adminTacticalIntel?: TributaryAdminTacticalIntel;
    accessPoints?: RiverAccessPoint[];
    floatSafety?: FloatSafetyProfile;
    wadeSafety?: WadeSafetyProfile;
    tribalProtocols?: TribalAccessProtocol;
  },
  adminPasskey?: string
): Promise<EncryptedPayload> {
  const seed = adminPasskey || SYSTEM_DOSSIER_PEPPER;
  return await encryptObject(data, seed);
}
