import {
  appStorage,
  type KvStorage,
  storageGetJson,
  storageSetJson,
} from "@/lib/storage";

/**
 * Recently-opened stores, persisted on-device. The home screen shows
 * them as a quick list; the most recent is the "last store".
 */

export interface RecentStore {
  slug: string;
  name: string;
  openedAt: string;
}

const KEY = "zer-mobile:recent-stores";
const MAX_RECENT = 5;

export async function getRecentStores(
  storage: KvStorage = appStorage,
): Promise<RecentStore[]> {
  const list = await storageGetJson<RecentStore[]>(storage, KEY);
  return Array.isArray(list) ? list : [];
}

export async function getLastStore(
  storage: KvStorage = appStorage,
): Promise<RecentStore | null> {
  const list = await getRecentStores(storage);
  return list[0] ?? null;
}

/** Record an opened store (moves it to the front, dedupes, caps the list). */
export async function recordStore(
  store: { slug: string; name?: string },
  storage: KvStorage = appStorage,
): Promise<RecentStore[]> {
  const list = await getRecentStores(storage);
  const entry: RecentStore = {
    slug: store.slug,
    name: store.name?.trim() || store.slug,
    openedAt: new Date().toISOString(),
  };
  const next = [entry, ...list.filter((s) => s.slug !== store.slug)].slice(
    0,
    MAX_RECENT,
  );
  await storageSetJson(storage, KEY, next);
  return next;
}
