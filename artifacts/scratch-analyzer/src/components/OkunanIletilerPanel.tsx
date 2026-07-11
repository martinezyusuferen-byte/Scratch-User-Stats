import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Lock, Eye, EyeOff, LogOut, ChevronDown, ChevronUp,
  CheckCheck, Check, Clock, Wifi, WifiOff, RefreshCw, AlertCircle, X
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const SESSION_KEY = "ss_scratch_session";

interface ScratchSession {
  username: string;
  sessionId: string;
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
  read: boolean;
  seenBy?: Record<string, "delivered" | "seen" | "active_no_reply">;
}

function saveSession(s: ScratchSession) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {}
}
function loadSession(): ScratchSession | null {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "şimdi";
  if (diff < 3600) return `${Math.floor(diff / 60)}dk`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}s`;
  return `${Math.floor(diff / 86400)}g`;
}

// ── Giriş Formu ──────────────────────────────────────────
function GirisFormu({ onLogin }: { onLogin: (s: ScratchSession) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`${BASE}/api/scratch/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) {
        setError(d.message || "Giriş başarısız. Bilgileri kontrol et.");
        return;
      }
      const session: ScratchSession = { username: d.username, sessionId: d.sessionId, xToken: d.xToken, avatar: d.avatar };
      saveSession(session);
      onLogin(session);
    } catch {
      setError("Sunucuya bağlanılamadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-3 px-4 py-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "hsl(var(--primary)/0.15)", border: "1px solid hsl(var(--primary)/0.3)" }}>
          <Lock className="w-3.5 h-3.5 text-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold text-white">Scratch hesabınla giriş yap</p>
          <p className="text-[10px] text-white/35">Mesajlarını görmek için kimliğini doğrula</p>
        </div>
      </div>
      <input
        value={username}
        onChange={e => setUsername(e.target.value)}
        placeholder="Scratch kullanıcı adı"
        autoComplete="username"
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/25 outline-none focus:border-primary/40 transition-colors"
      />
      <div className="relative">
        <input
          value={password}
          onChange={e => setPassword(e.target.value)}
          type={showPass ? "text" : "password"}
          placeholder="Scratch şifresi"
          autoComplete="current-password"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 pr-9 text-xs text-white placeholder:text-white/25 outline-none focus:border-primary/40 transition-colors"
        />
        <button type="button" onClick={() => setShowPass(p => !p)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
          {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-[10px] text-red-400/90 bg-red-500/10 rounded-lg px-3 py-1.5">
          <AlertCircle className="w-3 h-3 shrink-0" /> {error}
        </div>
      )}
      <motion.button
        whileTap={{ scale: 0.97 }}
        disabled={loading || !username.trim() || !password.trim()}
        type="submit"
        className="w-full py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 transition-opacity"
        style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
      >
        {loading ? <><RefreshCw className="w-3 h-3 animate-spin" /> Giriş yapılıyor...</> : "Giriş Yap"}
      </motion.button>
      <p className="text-[9px] text-white/20 text-center leading-relaxed">
        Şifre hiç saklanmaz — sadece oturum token'ı tutulur.
      </p>
    </form>
  );
}

// ── Mesaj Satırı ─────────────────────────────────────────
function MesajSatiri({ m, onlineMap }: { m: Mesaj; onlineMap: Record<string, boolean> }) {
  const actorOnline = onlineMap[m.actor] ?? false;
  const statusIcon = actorOnline
    ? <CheckCheck className="w-3 h-3 text-primary" />
    : <Check className="w-3 h-3 text-white/30" />;
  const statusLabel = actorOnline ? "Görüldü" : "İletildi";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors group"
    >
      <div className="relative shrink-0">
        <img
          src={m.actorAvatar || `https://cdn2.scratch.mit.edu/get_image/user/0_60x60.png`}
          alt={m.actor}
          className="w-7 h-7 rounded-full border border-white/10 object-cover"
          onError={e => { (e.target as HTMLImageElement).src = "https://cdn2.scratch.mit.edu/get_image/user/0_60x60.png"; }}
        />
        <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-background ${actorOnline ? "bg-green-400" : "bg-white/20"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          <span className="text-[11px] font-semibold text-white/80">{m.actor}</span>
          {m.projectTitle && (
            <span className="text-[9px] text-white/25 truncate max-w-[80px]">· {m.projectTitle}</span>
          )}
        </div>
        <p className="text-[11px] text-white/55 leading-relaxed line-clamp-2">{m.text || m.type}</p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-0.5 pt-0.5">
        <span className="text-[9px] text-white/25">{relTime(m.created_at)}</span>
        <div className="flex items-center gap-0.5 text-[9px] text-white/30">
          {statusIcon}
          <span>{statusLabel}</span>
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

  const authHeaders = useCallback(() => {
    if (!session) return {};
    const h: Record<string, string> = {
      "x-scratch-session": session.sessionId,
      "x-scratch-user": session.username,
    };
    if (session.xToken) h["x-scratch-token"] = session.xToken;
    return h;
  }, [session]);

  // Mesajları çek
  const fetchMesajlar = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setLastError("");
    try {
      const r = await fetch(`${BASE}/api/scratch/messages?limit=30`, { headers: authHeaders() });
      if (r.status === 401) { clearSession(); setSession(null); return; }
      const d = await r.json();
      const yeni: Mesaj[] = (d.messages || []);
      const brandNew = yeni.filter(m => !seenKeysRef.current.has(m.id));
      if (brandNew.length > 0) {
        brandNew.forEach(m => seenKeysRef.current.add(m.id));
        setMesajlar(prev => {
          const merged = [...brandNew, ...prev];
          const seen = new Set<string>();
          return merged.filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; }).slice(0, 60);
        });
      }
      // Unread count
      const countR = await fetch(`${BASE}/api/scratch/messages/count`, { headers: authHeaders() });
      const countD = await countR.json().catch(() => ({ count: 0 }));
      setUnreadCount(countD.count || 0);
    } catch (e: any) {
      setLastError("Mesajlar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [session, authHeaders]);

  // Online durumunu çek
  const fetchOnline = useCallback(async (actors: string[]) => {
    const unique = [...new Set(actors)].slice(0, 8);
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

  // İlk yükleme + polling
  useEffect(() => {
    if (!session) return;
    fetchMesajlar();
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      fetchMesajlar();
    }, 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [session, fetchMesajlar]);

  // Mesajlar değiştikçe online durumu güncelle
  useEffect(() => {
    if (mesajlar.length === 0) return;
    const actors = mesajlar.slice(0, 10).map(m => m.actor);
    fetchOnline(actors);
  }, [mesajlar, fetchOnline]);

  const handleLogin = (s: ScratchSession) => {
    setSession(s);
    setOpen(true);
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
    setMesajlar([]);
    setUnreadCount(0);
    seenKeysRef.current = new Set();
  };

  const onlineCount = Object.values(onlineMap).filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, type: "spring", stiffness: 280, damping: 26 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(10,10,20,0.85)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(16px)" }}>

        {/* ── Header ── */}
        <button
          onClick={() => setOpen(p => !p)}
          className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-white/[0.03] transition-colors"
        >
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
                  <Wifi className="w-2.5 h-2.5" />
                  <span>{onlineCount} çevrimiçi</span>
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

        {/* ── Panel İçeriği ── */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              style={{ overflow: "hidden" }}
            >
              <div className="border-t border-white/[0.05]">

                {/* Giriş yapılmadıysa */}
                {!session && <GirisFormu onLogin={handleLogin} />}

                {/* Giriş yapıldıysa */}
                {session && (
                  <div className="flex flex-col">
                    {/* Kullanıcı + aksiyonlar */}
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

                    {/* Hata mesajı */}
                    {lastError && (
                      <div className="mx-3 mt-2 flex items-center gap-1.5 text-[10px] text-red-400/80 bg-red-500/10 rounded-lg px-3 py-1.5">
                        <AlertCircle className="w-3 h-3 shrink-0" /> {lastError}
                      </div>
                    )}

                    {/* Mesaj listesi */}
                    <div className="max-h-64 overflow-y-auto py-1">
                      {loading && mesajlar.length === 0 ? (
                        <div className="flex items-center justify-center gap-2 py-8 text-[11px] text-white/25">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Mesajlar yükleniyor...
                        </div>
                      ) : mesajlar.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageSquare className="w-7 h-7 text-white/10 mx-auto mb-2" />
                          <p className="text-[11px] text-white/25">Henüz mesaj yok</p>
                        </div>
                      ) : (
                        <AnimatePresence initial={false}>
                          {mesajlar.map(m => (
                            <MesajSatiri key={m.id} m={m} onlineMap={onlineMap} />
                          ))}
                        </AnimatePresence>
                      )}
                    </div>

                    {/* Online özet footer */}
                    {mesajlar.length > 0 && (
                      <div className="border-t border-white/[0.05] px-3 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[9px] text-white/25">
                          {onlineCount > 0
                            ? <><Wifi className="w-2.5 h-2.5 text-green-400" /><span className="text-green-400">{onlineCount} çevrimiçi</span></>
                            : <><WifiOff className="w-2.5 h-2.5" /><span>Kimse çevrimiçi değil</span></>
                          }
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-white/20">
                          <Clock className="w-2.5 h-2.5" />
                          30s'de bir güncelleniyor
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
