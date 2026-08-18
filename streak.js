/* ============================================================
   LEARNING STREAK TRACKER (IndexedDB)
   ============================================================ */

const STREAK_DB_NAME = 'ApnaMockDB';
const STREAK_STORE_NAME = 'app_state';
const STREAK_KEY = 'learning_streak';

function initStreakDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(STREAK_DB_NAME, 2);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STREAK_STORE_NAME)) {
        db.createObjectStore(STREAK_STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function getStreakData() {
  try {
    const db = await initStreakDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STREAK_STORE_NAME, 'readonly');
      const store = tx.objectStore(STREAK_STORE_NAME);
      const req = store.get(STREAK_KEY);
      req.onsuccess = () => resolve(req.result || { id: STREAK_KEY, count: 0, lastPlayed: null });
      req.onerror = () => resolve({ id: STREAK_KEY, count: 0, lastPlayed: null });
    });
  } catch (err) {
    console.error("Streak DB error:", err);
    return { id: STREAK_KEY, count: 0, lastPlayed: null };
  }
}

async function updateStreak() {
  const data = await getStreakData();
  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
  const yesterdayStr = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');

  if (data.lastPlayed === todayStr) {
    // Already played today, do nothing
    return data.count;
  } else if (data.lastPlayed === yesterdayStr) {
    // Played yesterday, increment streak
    data.count = (data.count || 0) + 1;
  } else {
    // Missed a day or never played, reset to 1
    data.count = 1;
  }

  data.lastPlayed = todayStr;

  try {
    const db = await initStreakDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STREAK_STORE_NAME, 'readwrite');
      const store = tx.objectStore(STREAK_STORE_NAME);
      store.put(data);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("Error saving streak:", err);
  }

  return data.count;
}

// Helper to check if streak is active (played today or yesterday)
async function getStreakStatus() {
  const data = await getStreakData();
  const todayStr = new Date().toLocaleDateString('en-CA');
  const yesterdayStr = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');

  if (data.lastPlayed === todayStr) {
    return { status: 'active_today', count: data.count };
  } else if (data.lastPlayed === yesterdayStr) {
    return { status: 'at_risk', count: data.count }; // Played yesterday, hasn't played today
  } else {
    return { status: 'broken', count: 0 }; // Streak broken or never started
  }
}
