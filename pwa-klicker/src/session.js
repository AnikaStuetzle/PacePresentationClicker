import { collection, addDoc, doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";


export async function createSession(presenterUid) {
  const ref = await addDoc(collection(db, "sessions"), {
    slideIndex: 0,
    presenterUid,
    updatedAt: serverTimestamp(),
  });

  return ref.id; // sessionId
}
export async function sendCommand(sessionId, command, presenterUid) {
  const ref = doc(db, "sessions", sessionId);

  await setDoc(
    ref,
    {
      presenterUid,
      command,              // "next" oder "prev"
      commandId: Date.now(), // einfache eindeutige ID
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
export async function setActiveSession(sessionId, presenterUid) {
  const ref = doc(db, "active", "current");
  await setDoc(ref, {
    sessionId,
    presenterUid,
    updatedAt: serverTimestamp(),
  });
}

