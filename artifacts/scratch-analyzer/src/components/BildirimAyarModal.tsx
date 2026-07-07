import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, Check, ChevronRight, X, Search, Users, Zap, Star, Volume2 } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const NOTIF_KEY = "ss_notif_settings";

export interface NotifSettings {
  enabled: boolean;
  type: "all" | "active" | "new_only";
  excluded: string[];
  sound: string;
}

const SESLER = [
  { id: "glass_chime", label: "Kristal \u00c7an", emoji: "\ud83d\udc8e" },
  { id: "warm_bell", label: "S\u0131cak Zil", emoji: "\ud83d\udd14" },
  { id: "neon_pop", label: "Neon Patlamas\u0131", emoji: "\u26a1" },
  { id: "soft_ping", label: "Yumu\u015fak P\u0131t", emoji: "\ud83c\udfb5" },
  { id: "pixel_beep", label: "Pixel Bip", emoji: "\ud83d\udc7e" },
];

export function getNotifSettings(): NotifSettings | null {
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || "null"); } catch { return null; }
}
export function saveNotifSettings(s: NotifSettings) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(s));
}

const TIPLER = [
  { id: "all" as const, icon: Users, baslik: "T\u00fcm Takip Ettiklerim", aciklama: "Takip etti\u011fin herkesin her aktivitesinde bildirim al." },
  { id: "active" as const, icon: Zap, baslik: "Genellikle Aktif Olan", aciklama: "S\u0131k s\u0131k proje payla\u015fan ve be\u011fenen ki\u015filerden bildirim al." },
  { id: "new_only" as const, icon: Star, baslik: "Sadece Yeni Projeler", aciklama: "Yaln\u0131zca yeni proje payla\u015f\u0131mlar\u0131nda bildirim al." },
];

export default function BildirimAyarModal({
  connectedUser,
  onClose,
  onSave,
}: {
  connectedUser: string;
  onClose: () => void;
  onSave: (s: NotifSettings) => void;
}) {
  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState<NotifSettings["type"]>("all");
  const [hasExcluded, setHasExcluded] = useState<boolean | null>(null);
  const [following, setFollowing] = useState<string[]>([]);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [excluded, setExcluded] = useState<string[]>([]);
  const [selectedSound, setSelectedSound] = useState("glass_chime");
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [permStatus, setPermStatus] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) setPermStatus(Notification.permission);
  }, []);

  const fetchFollowing = async () => {
    setFollowingLoading(true);
    try {
      const r = await fetch(`${BASE}/api/scratch/user/${encodeURIComponent(connectedUser)}/following?limit=40`);
      const d = await r.json();
      setFollowing((d.users || []).map((u: any) => u.username || u));
    } catch { setFollowing([]); }
    finally { setFollowingLoading(false); }
  };

  const requestPermission = async () => {
    if (!("Notification" in window)) return;
    const p = await Notification.requestPermission();
    setPermStatus(p);
  };

  const playSound = (soundId: string) => {
    if (playingSound) {
      const old = document.getElementById(`preview-${playingSound}`) as HTMLAudioElement | null;
      if (old) { old.pause(); old.currentTime = 0; }
    }
    setPlayingSound(soundId);
    const audio = new Audio(`${BASE}sounds/${soundId}.mp3`);
    audio.id = `preview-${soundId}`;
    audio.volume = 0.6;
    audio.play().catch(() => {});
    audio.onended = () => setPlayingSound(null);
  };

  const handleSave = () => {
    const settings: NotifSettings = { enabled: permStatus === "granted", type: selectedType, excluded, sound: selectedSound };
    saveNotifSettings(settings);
    onSave(settings);
    onClose();
  };

  const filteredFollowing = following.filter(u => u.toLowerCase().includes(search.toLowerCase()));
  const toggleExclude = (u: string) => setExcluded(prev => prev.includes(u) ? prev.filter(x => x !== u) : [...prev, u]);
  const typeLabel = TIPLER.find(t => t.id === selectedType)?.baslik || "";
  const soundLabel = SESLER.find(s => s.id === selectedSound)?.label || "";

  const SoundStep = () => (
    <motion.div key="step1-sound"
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className="px-6 py-5 flex flex-col gap-4"
    >
      <div>
        <h2 className="font-display font-bold text-lg text-white">Bildirim sesini se\u00e7in</h2>
        <p className="text-xs text-white/40 mt-1">Her bildirimde \u00e7alacak ses tonu. \u25b6'ya bas\u0131p dinleyebilirsin.</p>
      </div>
      <div className="space-y-2">
        {SESLER.map((s, idx) => (
          <motion.button
            key={s.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelectedSound(s.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-200 text-left ${selectedSound === s.id ? "border-primary/50 bg-primary/10" : "border-white/8 bg-white/[0.03] hover:bg-white/[0.06]"}`}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-lg ${selectedSound === s.id ? "bg-primary/20" : "bg-white/5"}`}>
              {s.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${selectedSound === s.id ? "text-white" : "text-white/70"}`}>{s.label}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); playSound(s.id); }}
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors hover:bg-white/10"
              style={{ background: playingSound === s.id ? "hsl(var(--primary)/0.3)" : "rgba(255,255,255,0.08)" }}
            >
              <span className="text-xs">{playingSound === s.id ? "\u23f8" : "\u25b6"}</span>
            </button>
            {selectedSound === s.id && (
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </motion.button>
        ))}
      </div>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => setStep(2)}
        className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2"
        style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
      >
        Devam Et <ChevronRight className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );

  const TypeStep = () => (
    <motion.div key="step2"
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className="px-6 py-5 flex flex-col gap-4"
    >
      <div>
        <h2 className="font-display font-bold text-lg text-white">Bildirim Gelme T\u00fcr\u00fcn\u00fc se\u00e7in</h2>
        <p className="text-xs text-white/40 mt-1">Hangi aktivitelerden haberdar olmak istiyorsun?</p>
      </div>
      <div className="space-y-2">
        {TIPLER.map((t, idx) => (
          <motion.button
            key={t.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelectedType(t.id)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-200 text-left ${selectedType === t.id ? "border-primary/50 bg-primary/10" : "border-white/8 bg-white/[0.03] hover:bg-white/[0.06]"}`}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${selectedType === t.id ? "bg-primary/20" : "bg-white/5"}`}>
              <t.icon className={`w-4 h-4 ${selectedType === t.id ? "text-primary" : "text-white/40"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${selectedType === t.id ? "text-white" : "text-white/70"}`}>{t.baslik}</p>
              <p className="text-[11px] text-white/35 mt-0.5">{t.aciklama}</p>
            </div>
            {selectedType === t.id && (
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </motion.button>
        ))}
      </div>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => setStep(3)}
        className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2"
        style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
      >
        Devam Et <ChevronRight className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );

  const ExcludeStep = () => (
    <motion.div key="step3"
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className="px-6 py-5 flex flex-col gap-4"
    >
      <div>
        <h2 className="font-display font-bold text-lg text-white">Bildirim gelmesini istemedi\u011fin ki\u015fi var m\u0131?</h2>
        <p className="text-xs text-white/40 mt-1">Se\u00e7ti\u011fin ki\u015filerden bildirim almayacaks\u0131n.</p>
      </div>
      {hasExcluded === null && (
        <div className="flex gap-3">
          {[['Evet, var', true], ['Hay\u0131r, hepsi gelsin', false]].map(([label, val]) => (
            <motion.button
              key={String(val)}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setHasExcluded(val as boolean); if (val) fetchFollowing(); }}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold border transition-all"
              style={val ? { background: "hsl(var(--primary)/0.15)", borderColor: "hsl(var(--primary)/0.4)", color: "hsl(var(--primary))" } : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
            >
              {label as string}
            </motion.button>
          ))}
        </div>
      )}
      {hasExcluded === true && (
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Kullan\u0131c\u0131 ara..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-white/25 outline-none focus:border-primary/40"
            />
          </div>
          {followingLoading ? (
            <div className="text-xs text-white/30 text-center py-4">Y\u00fckleniyor...</div>
          ) : (
            <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
              {filteredFollowing.length === 0 ? (
                <p className="text-xs text-white/25 text-center py-3">Sonu\u00e7 yok</p>
              ) : filteredFollowing.map(u => (
                <motion.button
                  key={u}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggleExclude(u)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all ${excluded.includes(u) ? "border-red-500/40 bg-red-500/10" : "border-white/8 bg-white/[0.03] hover:bg-white/[0.06]"}`}
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-white/10 border border-white/10 shrink-0">
                    <img src={`https://cdn2.scratch.mit.edu/get_image/user/0_60x60.png`} alt={u} className="w-full h-full object-cover" />
                  </div>
                  <span className={`text-xs font-medium flex-1 ${excluded.includes(u) ? "text-red-400" : "text-white/70"}`}>{u}</span>
                  {excluded.includes(u) && <BellOff className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                </motion.button>
              ))}
            </div>
          )}
          {excluded.length > 0 && (
            <p className="text-[10px] text-white/30">{excluded.length} ki\u015fi hari\u00e7 tutuldu</p>
          )}
        </div>
      )}
      {hasExcluded === false && (
        <p className="text-xs text-white/40 text-center py-2">T\u00fcm takip etti\u011fin ki\u015filerden bildirim alacaks\u0131n.</p>
      )}
      {hasExcluded !== null && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setStep(4)}
          className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
        >
          Devam Et <ChevronRight className="w-4 h-4" />
        </motion.button>
      )}
    </motion.div>
  );

  const SummaryStep = () => (
    <motion.div key="step4"
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className="px-6 py-5 flex flex-col gap-4"
    >
      <div>
        <h2 className="font-display font-bold text-lg text-white">Tercihlerini onaylay\u0131n</h2>
        <p className="text-xs text-white/40 mt-1">Ayarlar\u0131n\u0131 kaydetmeden \u00f6nce bir g\u00f6z at.</p>
      </div>
      <div className="space-y-3">
        <div className="px-4 py-3 rounded-2xl border border-white/8 bg-white/[0.03]">
          <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1">Bildirim T\u00fcr\u00fc</p>
          <p className="text-sm font-semibold text-white">{typeLabel}</p>
        </div>
        <div className="px-4 py-3 rounded-2xl border border-white/8 bg-white/[0.03]">
          <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1">Bildirim Sesi</p>
          <div className="flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5 text-primary" />
            <p className="text-sm font-semibold text-white">{soundLabel}</p>
          </div>
        </div>
        <div className="px-4 py-3 rounded-2xl border border-white/8 bg-white/[0.03]">
          <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1">Hari\u00e7 Tutulanlar</p>
          <p className="text-sm font-semibold text-white">{excluded.length > 0 ? excluded.join(", ") : "Yok \u2014 hepsi bildiriyor"}</p>
        </div>
        <div className="px-4 py-3 rounded-2xl border border-white/8 bg-white/[0.03]">
          <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1">İzin Durumu</p>
          <p className={`text-sm font-semibold ${permStatus === "granted" ? "text-green-400" : permStatus === "denied" ? "text-red-400" : "text-yellow-400"}`}>
            {permStatus === "granted" ? "\u2705 Bildirimler a\u00e7\u0131k" : permStatus === "denied" ? "\u274c Taray\u0131c\u0131 engelledi" : "\u26a0️ İzin bekleniyor"}
          </p>
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={handleSave}
        className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2"
        style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
      >
        <Check className="w-4 h-4" /> Tamam, Ayarlar\u0131 Kaydet
      </motion.button>
      <button onClick={() => setStep(0)} className="text-[11px] text-white/25 hover:text-white/50 transition-colors text-center">
        Ba\u015ftan ba\u015fla
      </button>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
        style={{ background: "rgba(12,12,22,0.99)", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "88vh" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/15" />
        </div>
        <div className="flex items-center justify-between px-5 pt-4 pb-1 shrink-0">
          <div className="flex gap-1.5">
            {[0,1,2,3,4].map(i => (
              <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === step ? "w-5 bg-primary" : i < step ? "w-3 bg-primary/50" : "w-3 bg-white/10"}`} />
            ))}
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/15 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0"
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className="px-6 py-5 flex flex-col items-center text-center gap-4"
              >
                <motion.div
                  animate={{ scale: [1, 1.12, 1], rotate: [0, -8, 8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center mt-2"
                  style={{ background: "linear-gradient(135deg, hsl(var(--primary)/0.25), hsl(var(--accent)/0.25))", border: "2px solid hsl(var(--primary)/0.3)" }}
                >
                  <Bell className="w-9 h-9 text-primary" />
                </motion.div>
                <div>
                  <h2 className="font-display font-bold text-xl text-white mb-2">Masa\u00fcst\u00fc bildirimlerini ayarlay\u0131n</h2>
                  <p className="text-sm text-white/50 leading-relaxed">
                    Takip etti\u011fin ki\u015filer bir \u015fey payla\u015ft\u0131\u011f\u0131nda, be\u011fendi\u011finde veya favoriledi\u011finde an\u0131nda haberdar ol.
                  </p>
                </div>
                {permStatus === "denied" && (
                  <div className="text-xs text-red-400/80 bg-red-500/10 rounded-xl px-4 py-2 border border-red-500/20 w-full text-center">
                    Taray\u0131c\u0131 bildirimleri engellendi. Taray\u0131c\u0131 ayarlar\u0131ndan izin ver.
                  </div>
                )}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { requestPermission(); setStep(1); }}
                  className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 mt-2"
                  style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
                >
                  Devam Et <ChevronRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}
            {step === 1 && <SoundStep />}
            {step === 2 && <TypeStep />}
            {step === 3 && <ExcludeStep />}
            {step === 4 && <SummaryStep />}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
