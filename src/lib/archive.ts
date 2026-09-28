/**
 * Quiet Archive persistence.
 * Boundary (intentional design choice): archive is kept in AsyncStorage
 * locally; a reinstall wipes it unless the user explicitly exports a JSON
 * backup. We never auto-restore from a file — the user must open it.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@decay/archive';
export type CertificateEntry = {
  id: string;
  plantedAt?: number;
  realVisits?: number;
  longestVisitMs?: number;
  longestVisitDay?: number | null;
  lifespanDays: number;
  cause: string;
  sentences: string[];
  passedAt: number;
  certificateImageUri?: string; // exported PNG path (optional)
};

export async function loadArchive(): Promise<CertificateEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveArchive(list: CertificateEntry[]): Promise<void> {
  try { await AsyncStorage.setItem(KEY, JSON.stringify(list)); } catch {}
}

export async function addToArchive(entry: CertificateEntry): Promise<void> {
  const list = await loadArchive();
  if (list.some((existing) => existing.passedAt === entry.passedAt)) return;
  // no counts, no achievements — just keep it quietly
  list.push(entry);
  await saveArchive(list);
}

export async function exportArchiveJSON(): Promise<string> {
  const list = await loadArchive();
  return JSON.stringify({ exportedAt: Date.now(), entries: list }, null, 2);
}
