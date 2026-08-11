/* ============================================================
   NOTIFICATIONS ENGINE (Soft-Ask, Cooldowns, FCM Subscription)
   ============================================================ */

const NOTIF_CONFIG = {
  COOLDOWN_DAYS: 3,
  TOPIC_NAME: "apnamock_all"
};

// --- State Helpers ---
function getNotifState(key) {
  try { return JSON.parse(localStorage.getItem('apnamock_notif_' + key)); } catch { return null; }
}
function setNotifState(key, value) {
  localStorage.setItem('apnamock_notif_' + key, JSON.stringify(value));
}

// --- Instructions Modal for Blocked Users ---
function showNotifBlockedInstructions() {
  // If the instructions modal is already open, do nothing
  if (document.getElementById('notifBlockedOverlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'notifBlockedOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.7);backdrop-filter:blur(8px);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn 0.2s ease;';
  
  const card = document.createElement('div');
  card.style.cssText = 'background:#ffffff;border-radius:16px;max-width:480px;width:100%;box-shadow:0 25px 60px rgba(0,0,0,0.3);padding:32px;font-family:Inter,sans-serif;';
  
  card.innerHTML = `
    <div style="width:64px;height:64px;background:#fee2e2;color:#dc2626;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:28px;">
      <i class="fa-solid fa-bell-slash"></i>
    </div>
    <h3 style="margin:0 0 8px 0;font-size:20px;font-weight:700;color:#1e293b;text-align:center;">Notifications Are Blocked</h3>
    <p style="margin:0 0 24px 0;font-size:15px;color:#475569;line-height:1.5;text-align:center;">
      Your browser is currently blocking notifications for ApnaMock. Follow these steps to enable them so you never miss a deadline:
    </p>
    
    <ol style="margin:0 0 24px 0;padding-left:20px;color:#475569;font-size:14px;line-height:1.8;">
      <li>Click the <strong>Site Settings icon</strong> (<i class="fa-solid fa-sliders" style="font-size: 14px;"></i>) or the <strong>Lock icon</strong> (🔒) in your browser's address bar at the top.</li>
      <li>Find the <strong>Notifications</strong> section in the menu that drops down.</li>
      <li>Change the dropdown from "Block" to <strong>"Allow"</strong>.</li>
      <li>Refresh the page to start receiving alerts.</li>
    </ol>

    <button id="closeBlockedModalBtn" style="background:#1a56db;color:#fff;border:none;padding:12px;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;transition:background 0.2s;width:100%;">
      Got it
    </button>
  `;
  
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // Handle Close
  document.getElementById('closeBlockedModalBtn').addEventListener('click', () => {
    overlay.remove();
  });
}

// --- Main Soft-Ask Function ---
function showNotifSoftAsk(title, message, ctaText, triggerSource, forceShow = false) {
  // 1. Permanent Respect: If already granted, do nothing.
  const finalStatus = getNotifState('final_status');
  if (finalStatus === 'granted') return;

  // 2. Bypass Rules if forceShow is true (User clicked a direct button)
  if (!forceShow) {
    // If the user previously blocked us, don't show automatic popups.
    if (finalStatus === 'denied') return;

    // One Prompt Per Session
    if (sessionStorage.getItem('apnamock_notif_session_asked') === 'true') return;

    // Cooldown Check (3 days)
    const lastAsked = getNotifState('last_asked_time');
    if (lastAsked) {
      const daysPassed = (Date.now() - lastAsked) / (1000 * 60 * 60 * 24);
      if (daysPassed < NOTIF_CONFIG.COOLDOWN_DAYS) return;
    }
  }

  // Mark as asked in this session
  sessionStorage.setItem('apnamock_notif_session_asked', 'true');
  setNotifState('last_asked_time', Date.now());

  // Build UI
  const overlay = document.createElement('div');
  overlay.id = 'notifSoftAskOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.6);backdrop-filter:blur(8px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn 0.2s ease;';
  
  const card = document.createElement('div');
  card.style.cssText = 'background:#ffffff;border-radius:16px;max-width:420px;width:100%;box-shadow:0 25px 60px rgba(0,0,0,0.3);padding:32px;text-align:center;font-family:Inter,sans-serif;';
  
  card.innerHTML = `
    <div style="width:64px;height:64px;background:#e8f0fe;color:#1a56db;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:28px;">
      <i class="fa-solid fa-bell"></i>
    </div>
    <h3 style="margin:0 0 8px 0;font-size:20px;font-weight:700;color:#1e293b;">${title}</h3>
    <p style="margin:0 0 24px 0;font-size:15px;color:#475569;line-height:1.5;">${message}</p>
    <div style="display:flex;flex-direction:column;gap:10px;">
      <button id="notifAcceptBtn" style="background:#1a56db;color:#fff;border:none;padding:12px;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;transition:background 0.2s;">${ctaText || 'Allow Notifications'}</button>
      <button id="notifDismissBtn" style="background:transparent;color:#64748b;border:none;padding:8px;font-size:13px;cursor:pointer;">Not now</button>
    </div>
  `;
  
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // Handle Accept (SYNCHRONOUS request to bypass browser gesture blocking)
  document.getElementById('notifAcceptBtn').addEventListener('click', function() {
    if (window.Notification) {
      Notification.requestPermission().then(permission => {
        overlay.remove(); // Remove the custom soft-ask popup
        
        if (permission === 'granted') {
          setNotifState('final_status', 'granted');
          requestFcmToken(triggerSource);
          // SEND SIGNAL TO THE PAGE TO UPDATE UI INSTANTLY
          window.dispatchEvent(new Event('apnamock_notif_granted'));
        } else if (permission === 'denied') {
          // The browser explicitly blocked us (either by user clicking Block or browser auto-block)
          setNotifState('final_status', 'denied');
          
          // SHOW THE INSTRUCTIONS SCREEN INSTEAD OF A TOAST
          showNotifBlockedInstructions();
        } else {
          // If permission is 'default' (they just closed the native prompt without choosing)
          // DO NOT permanently block them. Let them try again later.
          sessionStorage.removeItem('apnamock_notif_session_asked');
        }
      });
    } else {
      overlay.remove();
      console.error('Notifications API not supported.');
    }
  });

  // Handle Dismiss
  document.getElementById('notifDismissBtn').addEventListener('click', () => {
    overlay.remove();
  });
}

// --- Get FCM Token (Called only AFTER permission is granted) ---
async function requestFcmToken(triggerSource) {
  if (!window.messaging) {
    console.error('Firebase Messaging not initialized.');
    return;
  }

  try {
    // You MUST replace "YOUR_VAPID_KEY_HERE" with your actual VAPID key from Firebase Console!
    const token = await messaging.getToken({ vapidKey: "YOUR_VAPID_KEY_HERE" });
    if (token) {
      console.log('FCM Token received:', token);
      if (typeof showToast === 'function') {
        showToast("Notifications enabled! You'll get daily updates.", "success", 3000);
      } else {
        alert("Notifications enabled!");
      }
    }
  } catch (err) {
    console.error('FCM Token Error:', err);
  }
}

// --- Trigger Helpers ---

// Trigger 1: Deadline Anxiety (job.html)
function checkDeadlineAnxietyTrigger(jobTitle) {
  showNotifSoftAsk(
    "Never Miss a Deadline!",
    `We will send you a push notification before the form for ${jobTitle} closes. Click 'Allow' on the next popup to set your reminder.`,
    "Set Reminder",
    "deadline_anxiety",
    true // forceShow = true: Bypasses rules because user explicitly clicked a button
  );
}

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
    "Great Job! Keep the Momentum Going 🔥",
    "You just put in the hard work. Don't let your preparation stop here! Enable notifications to get instant alerts for new mock tests and crucial exam updates. Click 'Allow' on the next popup to stay ahead.",
    "Allow Alerts",
    "post_test"
  );
}
