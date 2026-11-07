/** Bounded, in-memory read cache. Private reads use ttl=0 (in-flight only). */
export function createReadCache({ now = Date.now, maxEntries = 64 } = {}) {
  const entries = new Map();

  return {
    clear() {
      entries.clear();
    },
    get(key, loader, ttl = 0) {
      const current = entries.get(key);
      if (current && (current.pending || current.expires > now())) {
        return current.promise;
      }

      const entry = { pending: true, expires: 0 };
      entry.promise = Promise.resolve().then(loader).then(
        (value) => {
          entry.pending = false;
          entry.expires = now() + ttl;
          if (ttl === 0 && entries.get(key) === entry) entries.delete(key);
          return value;
        },
        (error) => {
          if (entries.get(key) === entry) entries.delete(key);
          throw error;
        },
      );
      entries.delete(key);
      entries.set(key, entry);
      if (entries.size > maxEntries) entries.delete(entries.keys().next().value);
      return entry.promise;
    },
  };
}
