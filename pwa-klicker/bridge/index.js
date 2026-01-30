import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { execSync } from "child_process";

// Firebase Config (so lassen)
const firebaseConfig = {
  apiKey: "AIzaSyD9dZXiRDFG9rbJpQwdMhulqgoJTlXnzfk",
  authDomain: "pwa-klicker.firebaseapp.com",
  projectId: "pwa-klicker",
  storageBucket: "pwa-klicker.firebasestorage.app",
  messagingSenderId: "462408423563",
  appId: "1:462408423563:web:ce1dd5855cd4ea803a1c8e",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let lastCommandId = null;
let unsubscribeSession = null;
let currentSessionId = null;

// Pfeiltaste an macOS senden
function pressKey(direction) {
  const keyCode = direction === "next" ? 124 : 123; // rechts / links
  const script = `tell application "System Events" to key code ${keyCode}`;
  execSync(`osascript -e '${script}'`);
}

function listenToSession(sessionId) {
  if (!sessionId) return;

  // Wenn wir schon auf dieser Session lauschen, nichts tun
  if (currentSessionId === sessionId) return;

  // Alten Listener beenden
  if (unsubscribeSession) unsubscribeSession();

  currentSessionId = sessionId;
  lastCommandId = null; // wichtig: bei Sessionwechsel neu starten

  console.log("🔄 Wechsel auf Session:", sessionId);

  const sessionRef = doc(db, "sessions", sessionId);
  unsubscribeSession = onSnapshot(sessionRef, (snap) => {
    if (!snap.exists()) return;

    const { command, commandId } = snap.data();

    if (!command || !commandId) return;
    if (commandId === lastCommandId) return;

    lastCommandId = commandId;
    console.log("Command empfangen:", command);

    if (command === "next" || command === "prev") {
      pressKey(command);
    }
  });
}

console.log("📡 Bridge läuft. Lausche auf /active/current ...");

const activeRef = doc(db, "active", "current");
onSnapshot(activeRef, (snap) => {
  if (!snap.exists()) {
    console.log("⚠️ Kein Dokument active/current gefunden.");
    console.log("➡️ Lösung: Tablet-App muss active/current setzen.");
    return;
  }

  const data = snap.data();
  const sessionId = data?.sessionId;

  if (!sessionId) {
    console.log("⚠️ active/current hat keine sessionId.");
    return;
  }

  listenToSession(sessionId);
});
