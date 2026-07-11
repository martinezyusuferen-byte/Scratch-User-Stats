import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Eye, EyeOff, LogOut, ChevronDown,
  CheckCheck, Check, Clock, Wifi, WifiOff, RefreshCw,
  AlertCircle, ExternalLink, Copy, Key
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const SESSION_KEY = "ss_scratch_token_session";

interface ScratchSession {
  username: string;
  xToken: string;
  avatar: string;
}

interface Mesaj {
  id: string;
  type: string;
  actor: string;
  actorAvatar: string;
  text: string;
  projectId?: string;
  projectTitle?: string;
  created_at: string;
}

function saveSession(s: ScratchSession) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {}
}
function loadSession(): ScratchSession | null {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
}
function clearSession() { localStorage.removeItem(SESSION_KEY); }

function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "şimdi";
  if (diff < 3600) return `${Math.floor(diff / 60)}dk`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}s`;
  return `${Math.floor(diff / 86400)}g`;
}

// ── Token Giriş Formu ──────────────────────────────────────
function TokenGirisFormu({ onLogin }: { onLogin: (s: ScratchSession) => void }) {
  const [step, setStep] = useState<"info" | "paste">("info");
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !token.trim()) return;
    setLoading(true);
    setError("");
    try {
      // Token'ı doğrula: mesaj sayısını çek
      const r = await fetch(`${BASE}/api/scratch/messages/count`, {
        headers: {
          "x-scratch-token": token.trim(),
          "x-scratch-user": username.trim(),
        },
      });
      if (r.status === 401) {
        setError("Token geçersiz. Tekrar kopyaladığından emin ol.");
        return;
      }
      // Avatar çek
      const profR = await fetch(`${BASE}/api/scratch/user/${encodeURIComponent(username.trim())}`).catch(() => null);
      const prof = profR ? await profR.json().catch(() => null) : null;
      const avatar = prof?.avatar || `https://cdn2.scratch.mit.edu/get_image/user/0_60x60.png`;

      const session: ScratchSession = { username: username.trim(), xToken: token.trim(), avatar };
      saveSession(session);
      onLogin(session);
    } catch {
      setError("Sunucuya bağlanılamadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      {step === "info" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "hsl(var(--primary)/0.15)", border: "1px solid hsl(var(--primary)/0.3)" }}>
              <Key className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Scratch Token ile Bağlan</p>
              <p className="text-[10px] text-white/35">Mesajlarını görmek için token'ını yapıştır</p>
            </div>
          </div>

          {/* Adım adım talimat */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 flex flex-col gap-2.5">
            <p className="text-[10px] text-white/50 font-semibold uppercase tracking-wider">Nasıl yapılır?</p>
            {[
              { n: "1", text: "Tarayıcında Scratch'e giriş yap" },
              { n: "2", text: <>Yeni sekmede aç: <span className="text-primary font-mono text-[10px]">scratch.mit.edu/session/</span></> },
              { n: "3", text: <>Açılan JSON'da <span className="text-primary font-mono">"token"</span> değerini kopyala</> },
              { n: "4", text: "Aşağıya kullanıcı adını ve token'ı yapıştır" },
            ].map(s => (
              <div key={s.n} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{s.n}</span>
                <p className="text-[11px] text-white/50 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <a href="https://scratch.mit.edu/session/" target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-semibold border border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white transition-all">
              <ExternalLink className="w-3 h-3" /> scratch.mit.edu/session/
            </a>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => setStep("paste")} type="button"
              className="flex-1 py-2.5 rounded-xl text-[11px] font-bold text-white"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}>
              Token'ım Hazır →
            </motion.button>
          </div>
        </motion.div>
      )}

      {step === "paste" && (
        <motion.form onSubmit={handleVerify} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-3">
          <button type="button" onClick={() => setStep("info")} className="text-[10px] text-white/30 hover:text-white/60 text-left transition-colors">
            ← Geri
          </button>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Scratch kullanıcı adı"
            autoComplete="username"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/25 outline-none focus:border-primary/40 transition-colors"
          />
          <div className="relative">
            <input
              value={token}
              onChange={e => setToken(e.target.value)}
              type={showToken ? "text" : "password"}
              placeholder={"JSON'dan kopyaladığın \"token\" değeri"}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 pr-9 text-[10px] font-mono text-white placeholder:text-white/20 outline-none focus:border-primary/40 transition-colors"
            />
            <button type="button" onClick={() => setShowToken(p => !p)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
              {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-1.5 text-[10px] text-red-400/90 bg-red-500/10 rounded-lg px-3 py-1.5">
              <AlertCircle className="w-3 h-3 shrink-0" /> {error}
            </div>
          )}
          <motion.button whileTap={{ scale: 0.97 }} disabled={loading || !username.trim() || !token.trim()} type="submit"
            className="w-full py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}>
            {loading ? <><RefreshCw className="w-3 h-3 animate-spin" /> Doğrulanıyor...</> : "Bağlan ve Mesajları Gör"}
          </motion.button>
          <p className="text-[9px] text-white/20 text-center">Token sadece bu cihazda tarayıcı belleğinde tutulur.</p>
        </motion.form>
      )}
    </div>
  );
}

// ── Mesaj Satırı ──────────────────────────────────────────
function MesajSatiri({ m, onlineMap }: { m: Mesaj; onlineMap: Record<string, boolean> }) {
  const actorOnline = onlineMap[m.actor] ?? false;

  const typeLabel = (type: string) => {
    if (type === "addcomment") return "yorum yaptı";
    if (type === "loveproject") return "beğendi";
    if (type === "favoriteproject") return "favoriledi";
    if (type === "followuser") return "seni takip etti";
    if (type === "remixproject") return "remix yaptı";
    if (type === "shareproject") return "proje paylaştı";
    return type;
  };

  return (
    <motion.div layout
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors"
    >
      <div className="relative shrink-0">
        <img src={m.actorAvatar} alt={m.actor}
          className="w-7 h-7 rounded-full border border-white/10 object-cover"
          onError={e => { (e.target as HTMLImageElement).src = "https://cdn2.scratch.mit.edu/get_image/user/0_60x60.png"; }} />
        <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-background ${actorOnline ? "bg-green-400" : "bg-white/15"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1 mb-0.5 flex-wrap">
          <span className="text-[11px] font-semibold text-white/80">{m.actor}</span>
          <span className="text-[10px] text-white/30">{typeLabel(m.type)}</span>
          {m.projectTitle && <span className="text-[10px] text-primary/70 truncate max-w-[90px]">{m.projectTitle}</span>}
        </div>
        {m.text && <p className="text-[10px] text-white/45 leading-relaxed line-clamp-2">{m.text}</p>}
      </div>
      <div className="shrink-0 flex flex-col items-end gap-0.5 pt-0.5">
        <span className="text-[9px] text-white/25">{relTime(m.created_at)}</span>
        <div className="flex items-center gap-0.5">
          {actorOnline
            ? <CheckCheck className="w-3 h-3 text-primary" />
            : <Check className="w-3 h-3 text-white/25" />}
          <span className="text-[8px] text-white/25">{actorOnline ? "Görüldü" : "İletildi"}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Ana Panel ─────────────────────────────────────────────
export default function OkunanIletilerPanel() {
  const [session, setSession] = useState<ScratchSession | null>(() => loadSession());
  const [open, setOpen] = useState(false);
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>({});
  const [lastError, setLastError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seenKeysRef = useRef<Set<string>>(new Set());

  const authHeaders = useCallback((): Record<string, string> => {
    if (!session) return {};
    return {
      "x-scratch-token": session.xToken,
      "x-scratch-user": session.username,
    };
  }, [session]);

  const fetchMesajlar = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setLastError("");
    try {
      const [msgR, cntR] = await Promise.all([
        fetch(`${BASE}/api/scratch/messages?limit=30`, { headers: authHeaders() }),
        fetch(`${BASE}/api/scratch/messages/count`, { headers: authHeaders() }),
      ]);
      if (msgR.status === 401) { clearSession(); setSession(null); return; }
      const msgD = await msgR.json();
      const cntD = await cntR.json().catch(() => ({ count: 0 }));

      const yeni: Mesaj[] = (msgD.messages || []);
      const brandNew = yeni.filter(m => !seenKeysRef.current.has(m.id));
      if (brandNew.length > 0) {
        brandNew.forEach(m => seenKeysRef.current.add(m.id));
        setMesajlar(prev => {
          const merged = [...brandNew, ...prev];
          const seen = new Set<string>();
          return merged.filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; }).slice(0, 60);
        });
      }
      setUnreadCount(cntD.count || 0);
    } catch {
      setLastError("Mesajlar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [session, authHeaders]);

  const fetchOnline = useCallback(async (actors: string[]) => {
    const unique = [...new Set(actors)].slice(0, 6);
    const results = await Promise.allSettled(
      unique.map(a => fetch(`${BASE}/api/scratch/online/${encodeURIComponent(a)}`).then(r => r.json()))
    );
    const map: Record<string, boolean> = {};
    unique.forEach((a, i) => {
      const r = results[i];
      if (r.status === "fulfilled") map[a] = r.value?.online ?? false;
    });
    setOnlineMap(prev => ({ ...prev, ...map }));
  }, []);

  useEffect(() => {
    if (!session) return;
    fetchMesajlar();
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(fetchMesajlar, 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [session, fetchMesajlar]);

  useEffect(() => {
    if (mesajlar.length === 0) return;
    fetchOnline(mesajlar.slice(0, 8).map(m => m.actor));
  }, [mesajlar, fetchOnline]);

  const handleLogin = (s: ScratchSession) => { setSession(s); setOpen(true); };
  const handleLogout = () => { clearSession(); setSession(null); setMesajlar([]); setUnreadCount(0); seenKeysRef.current = new Set(); };
  const onlineCount = Object.values(onlineMap).filter(Boolean).length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 26 }}
      className="w-full max-w-md mx-auto">
      <div className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(10,10,20,0.85)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(16px)" }}>

        {/* Header */}
        <button onClick={() => setOpen(p => !p)}
          className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-white/[0.03] transition-colors">
          <div className="relative shrink-0">
            <MessageSquare className="w-4 h-4 text-primary" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-primary text-[8px] font-bold text-white flex items-center justify-center px-0.5">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          <span className="text-xs font-semibold text-white/70 flex-1 text-left">Okunan İletiler</span>
          {session && (
            <div className="flex items-center gap-1.5">
              {onlineCount > 0 && (
                <div className="flex items-center gap-1 text-[9px] text-green-400">
                  <Wifi className="w-2.5 h-2.5" /><span>{onlineCount} çevrimiçi</span>
                </div>
              )}
              <img src={session.avatar} alt={session.username}
                className="w-5 h-5 rounded-full border border-white/15 object-cover" />
            </div>
          )}
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
            <ChevronDown className="w-3.5 h-3.5 text-white/30" />
          </motion.div>
        </button>

        {/* Panel İçeriği */}
        <AnimatePresence>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 320, damping: 30 }}
              style={{ overflow: "hidden" }}>
              <div className="border-t border-white/[0.05]">
                {!session && <TokenGirisFormu onLogin={handleLogin} />}

                {session && (
                  <div className="flex flex-col">
                    {/* Kullanıcı bar */}
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.05]">
                      <img src={session.avatar} alt={session.username}
                        className="w-6 h-6 rounded-full border border-white/15 object-cover" />
                      <span className="text-[11px] font-semibold text-white/70 flex-1">{session.username}</span>
                      <button onClick={() => fetchMesajlar()}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/8 transition-colors">
                        <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                      </button>
                      <button onClick={handleLogout}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <LogOut className="w-3 h-3" />
                      </button>
                    </div>

                    {lastError && (
                      <div className="mx-3 mt-2 flex items-center gap-1.5 text-[10px] text-red-400/80 bg-red-500/10 rounded-lg px-3 py-1.5">
                        <AlertCircle className="w-3 h-3 shrink-0" /> {lastError}
                      </div>
                    )}

                    <div className="max-h-64 overflow-y-auto py-1">
                      {loading && mesajlar.length === 0 ? (
                        <div className="flex items-center justify-center gap-2 py-8 text-[11px] text-white/25">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Mesajlar yükleniyor...
                        </div>
                      ) : mesajlar.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageSquare className="w-7 h-7 text-white/10 mx-auto mb-2" />
                          <p className="text-[11px] text-white/25">Henüz mesaj yok</p>
                        </div>
                      ) : (
                        <AnimatePresence initial={false}>
                          {mesajlar.map(m => <MesajSatiri key={m.id} m={m} onlineMap={onlineMap} />)}
                        </AnimatePresence>
                      )}
                    </div>

                    {mesajlar.length > 0 && (
                      <div className="border-t border-white/[0.05] px-3 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[9px] text-white/25">
                          {onlineCount > 0
                            ? <><Wifi className="w-2.5 h-2.5 text-green-400" /><span className="text-green-400">{onlineCount} çevrimiçi</span></>
                            : <><WifiOff className="w-2.5 h-2.5" /><span>Kimse çevrimiçi değil</span></>}
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-white/20">
                          <Clock className="w-2.5 h-2.5" /> 30s'de bir güncelleniyor
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
