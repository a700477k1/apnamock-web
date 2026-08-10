/* ============================================================
   NOTIFICATIONS ENGINE (Soft-Ask, Cooldowns, FCM Subscription)
   ============================================================ */

const NOTIF_CONFIG = {
  COOLDOWN_DAYS: 3, // Changed to 3 days as requested
  TOPIC_NAME: "apnamock_all"
};

// --- State Helpers ---
function getNotifState(key) {
  try { return JSON.parse(localStorage.getItem('apnamock_notif_' + key)); } catch { return null; }
}
function setNotifState(key, value) {
  localStorage.setItem('apnamock_notif_' + key, JSON.stringify(value));
}

// --- Main Soft-Ask Function ---
function showNotifSoftAsk(title, message, ctaText, triggerSource) {
  // 1. Permanent Respect: If already granted or permanently denied, do nothing.
  const finalStatus = getNotifState('final_status');
  if (finalStatus === 'granted' || finalStatus === 'denied') return;

  // 2. One Prompt Per Session: If asked in this session, do nothing.
  if (sessionStorage.getItem('apnamock_notif_session_asked') === 'true') return;

  // 3. Cooldown Check: If asked recently and dismissed, wait 3 days.
  const lastAsked = getNotifState('last_asked_time');
  if (lastAsked) {
    const daysPassed = (Date.now() - lastAsked) / (1000 * 60 * 60 * 24);
    if (daysPassed < NOTIF_CONFIG.COOLDOWN_DAYS) return;
  }

  // Mark as asked in this session
  sessionStorage.setItem('apnamock_notif_session_asked', 'true');
  setNotifState('last_asked_time', Date.now());

  // Build UI
  const overlay = document.createElement('div');
  overlay.id = 'notifSoftAskOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.6);backdrop-filter:blur(8px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn 0.2s ease;';
  
  const card = document.createElement('div');
  card.style.cssText = 'background:var(--bg-card,#fff);border-radius:16px;max-width:420px;width:100%;box-shadow:0 25px 60px rgba(0,0,0,0.3);padding:32px;text-align:center;font-family:Inter,sans-serif;';
  
  card.innerHTML = `
    <div style="width:64px;height:64px;background:var(--primary-light,#e8f0fe);color:var(--primary,#1a56db);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:28px;">
      <i class="fa-solid fa-bell"></i>
    </div>
    <h3 style="margin:0 0 8px 0;font-size:20px;font-weight:700;color:var(--text-primary,#1e293b);">${title}</h3>
    <p style="margin:0 0 24px 0;font-size:15px;color:var(--text-secondary,#475569);line-height:1.5;">${message}</p>
    <div style="display:flex;flex-direction:column;gap:10px;">
      <button id="notifAcceptBtn" style="background:var(--primary,#1a56db);color:#fff;border:none;padding:12px;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;transition:background 0.2s;">${ctaText || 'Allow Notifications'}</button>
      <button id="notifDismissBtn" style="background:transparent;color:var(--text-muted,#64748b);border:none;padding:8px;font-size:13px;cursor:pointer;">Not now</button>
    </div>
  `;
  
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // Handle Accept
  document.getElementById('notifAcceptBtn').addEventListener('click', async () => {
    overlay.remove();
    await requestPermissionAndSubscribe(triggerSource);
  });

  // Handle Dismiss
  document.getElementById('notifDismissBtn').addEventListener('click', () => {
    overlay.remove();
  });
}

// --- Request Permission & Subscribe ---
async function requestPermissionAndSubscribe(triggerSource) {
  if (!window.messaging) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotifState('final_status', 'granted');
      
      // Get FCM Token
      const token = await messaging.getToken({ vapidKey: "YOUR_VAPID_KEY_HERE" }); // You will need to add your VAPID key from Firebase Console
      console.log('FCM Token received:', token);
      
      // In Phase 4, we will send this token to our GAS backend to subscribe to the topic.
      // For now, we just log it.
      
      showToast("Notifications enabled! You'll get daily updates.", "success", 3000);
    } else {
      setNotifState('final_status', 'denied');
      console.log('User denied notifications.');
    }
  } catch (err) {
    console.error('FCM Error:', err);
  }
}

// --- Trigger Helpers ---

// Trigger 4: Returning Visitor (tests.html)
function checkReturningVisitorTrigger() {
  let visits = getNotifState('visit_count') || 0;
  visits++;
  setNotifState('visit_count', visits);

  if (visits === 3) {
    showNotifSoftAsk(
      "Stay Updated!",
      "Get notified as soon as we upload new SSC, Banking, or Railway mock tests. Click 'Allow' to stay ahead.",
      "Allow Test Alerts",
      "returning_visitor"
    );
  }
}

// Trigger 1: Deadline Anxiety (job.html)
function checkDeadlineAnxietyTrigger(jobTitle) {
  showNotifSoftAsk(
    "Never Miss a Deadline!",
    `We will send you a push notification before the form for ${jobTitle} closes. Click 'Allow' on the next popup to set your reminder.`,
    "Set Reminder",
    "deadline_anxiety"
  );
}

// Trigger 3: Power User (favorites/history)
function checkPowerUserTrigger(count, type) {
  if (count >= 3) {
    showNotifSoftAsk(
      "Protect Your Progress!",
      `You have ${count} saved ${type}! Don't lose your hard work if you clear your browser. Enable notifications to get daily revision tips and sync alerts.`,
      "Enable Notifications",
      "power_user"
    );
  }
}

// Trigger 2: Post-Test High (result.html)
function checkPostTestTrigger() {
  showNotifSoftAsk(
    "Great Job!",
    "Enable notifications to get alerts when new mock tests are added, so you can keep your preparation streak going.",
    "Allow Alerts",
    "post_test"
  );
}
