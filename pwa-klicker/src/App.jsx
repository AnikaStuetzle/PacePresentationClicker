import { useEffect, useMemo, useState } from "react";
import { signInAnonymously } from "./firebase";
import { createSession, sendCommand, setActiveSession } from "./session";

export default function App() {
  const [userUid, setUserUid] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState("");

  // ===== Timer State =====
  const [isRunning, setIsRunning] = useState(false);
  const [startedAt, setStartedAt] = useState(null); // epoch ms
  const [elapsedMs, setElapsedMs] = useState(0);    // accumulated when paused
  const [limitMin, setLimitMin] = useState(10);     // editable
  const [tick, setTick] = useState(0);              // forces re-render while running

  const limitMs = useMemo(() => limitMin * 60 * 1000, [limitMin]);

  async function ensureSignedIn() {
    if (userUid) return userUid;
    const user = await signInAnonymously();
    setUserUid(user.uid);
    return user.uid;
  }

  async function handleCreateSession() {
    try {
      setStatus("Creating session...");
      const uid = await ensureSignedIn();
      const id = await createSession(uid);

      setSessionId(id);
      await setActiveSession(id, uid);
      setStatus("Session ready.");
    } catch (e) {
      console.error(e);
      setStatus("Failed to create session.");
    }
  }

  async function handleNext() {
    try {
      if (!sessionId) return;
      const uid = await ensureSignedIn();
      await sendCommand(sessionId, "next", uid);
      setStatus("Sent: next");
    } catch (e) {
      console.error(e);
      setStatus(`Next failed: ${e?.code || e?.message || "unknown error"}`);
    }
  }

  async function handlePrev() {
    try {
      if (!sessionId) return;
      const uid = await ensureSignedIn();
      await sendCommand(sessionId, "prev", uid);
      setStatus("Sent: prev");
    } catch (e) {
      console.error(e);
      setStatus(`Prev failed: ${e?.code || e?.message || "unknown error"}`);
    }
  }

  // ===== Timer ticking (updates every second) =====
  useEffect(() => {
    if (!isRunning) return;
    const t = setInterval(() => {
      setTick((x) => x + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [isRunning]);

  const totalMs = useMemo(() => {
    if (!isRunning || !startedAt) return elapsedMs;
    return elapsedMs + (Date.now() - startedAt);
  }, [elapsedMs, isRunning, startedAt, tick]);

  const over = totalMs > limitMs;

  function format(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }

  function handleTimerStartPause() {
    if (!isRunning) {
      const now = Date.now();
      setIsRunning(true);
      setStartedAt(now);
      setStatus("Timer running");
    } else {
      const now = Date.now();
      const added = startedAt ? (now - startedAt) : 0;
      setElapsedMs((prev) => prev + added);
      setIsRunning(false);
      setStartedAt(null);
      setStatus("Timer paused");
    }
  }

  function handleTimerReset() {
    setIsRunning(false);
    setStartedAt(null);
    setElapsedMs(0);
    setTick(0);
    setStatus("Timer reset");
  }

  // ===== UI Styles (Sage Theme) =====
  const styles = {
    page: {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #F5F7F4 0%, #EEF3EE 100%)",
  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
  color: "#0F1A14",
  padding: 18,
  boxSizing: "border-box",

  display: "flex",
  alignItems: "stretch",
  justifyContent: "flex-start",
},

    card: {
  width: "100%",
  maxWidth: "100%",
  margin: "0 auto",
  alignSelf: "stretch",

  background: "rgba(255,255,255,0.90)",
  border: "1px solid rgba(15,26,20,0.08)",
  borderRadius: 22,
  boxShadow: "0 18px 50px rgba(15,26,20,0.10)",
  padding: 20,
  backdropFilter: "blur(10px)",

  minHeight: "calc(100vh - 36px)",
  boxSizing: "border-box",

  display: "flex",
  flexDirection: "column",
},

    title: { margin: 0, fontSize: 30, letterSpacing: -0.2 },
    sub: { marginTop: 6, color: "rgba(15,26,20,0.65)", fontSize: 13 },
    row: { display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16, width: "100%" },
    btn: {
      appearance: "none",
      border: "1px solid rgba(15,26,20,0.12)",
      background: "#F7FAF7",
      padding: "12px 14px",
      borderRadius: 14,
      fontSize: 15,
      cursor: "pointer",
      flex: "1 1 180px",
      width: "100%",
    },
    btnPrimary: {
      background: "#5D7D6A",
      color: "white",
      border: "1px solid rgba(0,0,0,0.06)",
    },
    btnGhost: {
      background: "transparent",
      border: "1px solid rgba(15,26,20,0.18)",
    },
    timerBox: {
      marginTop: 18,
      padding: 16,
      borderRadius: 16,
      border: "1px solid rgba(15,26,20,0.10)",
      background: over ? "rgba(181,83,76,0.08)" : "rgba(93,125,106,0.08)",
    },
    timerTop: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: 12,
      flexWrap: "wrap",
    },
    timerBig: { fontSize: 42, fontWeight: 750, letterSpacing: -0.6 },
    badge: {
      fontSize: 12,
      padding: "6px 10px",
      borderRadius: 999,
      background: over ? "rgba(181,83,76,0.18)" : "rgba(93,125,106,0.18)",
      border: "1px solid rgba(15,26,20,0.10)",
      display: "inline-block",
      marginTop: 6,
    },
    tiny: { marginTop: 8, fontSize: 12, color: "rgba(15,26,20,0.65)" },
    input: {
      width: 90,
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid rgba(15,26,20,0.12)",
      background: "white",
      fontSize: 14,
    },
    footer: { marginTop: 16, fontSize: 12, color: "rgba(15,26,20,0.65)" },
    mono: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" },
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Clicker Remote</h1>

        {!sessionId && (
          <div style={styles.row}>
            <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={handleCreateSession}>
              Create Session
            </button>
          </div>
        )}

        {sessionId && (
          <>
            <div style={styles.row}>
              <button style={{ ...styles.btn, ...styles.btnGhost }} onClick={handlePrev}>
                ← Zurück
              </button>
              <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={handleNext}>
                Weiter →
              </button>
            </div>

            <div style={styles.timerBox}>
              <div style={styles.timerTop}>
                <div>
                  <div style={styles.tiny}>Sprechzeit</div>
                  <div style={styles.timerBig}>{format(totalMs)}</div>
                  <span style={styles.badge}>{over ? "Über Zeit" : "Im Rahmen"}</span>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={styles.tiny}>Limit (Min)</div>
                  <input
                    style={styles.input}
                    type="number"
                    min={1}
                    value={limitMin}
                    onChange={(e) => setLimitMin(Number(e.target.value || 1))}
                  />
                </div>
              </div>

              <div style={{ ...styles.row, marginTop: 14 }}>
                <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={handleTimerStartPause}>
                  {isRunning ? "Pause" : "Start"}
                </button>
                <button style={styles.btn} onClick={handleTimerReset}>
                  Reset
                </button>
              </div>
            </div>

            <div style={styles.footer}>
              <div>
                <b>Session:</b> <span style={styles.mono}>{sessionId}</span>
              </div>
              <div>
                <b>Status:</b> {status}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
