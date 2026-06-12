import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, Check, ChevronRight, X, Search, Users, Zap, Star } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const NOTIF_KEY = "ss_notif_settings";

export interface NotifSettings {
  enabled: boolean;
  type: "all" | "active" | "new_only";
  excluded: string[];
}

export function getNotifSettings(): NotifSettings | null {
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || "null"); } catch { return null; }
}
export function saveNotifSettings(s: NotifSettings) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(s));
}

const TIPLER = [
  { id: "all" as const, icon: Users, baslik: "Tüm Takip Ettiklerim", aciklama: "Takip ettiğin herkesin her aktivitesinde bildirim al." },
  { id: "active" as const, icon: Zap, baslik: "Genellikle Aktif Olan", aciklama: "Sık sık proje paylaşan ve beğenen kişilerden bildirim al." },
  { id: "new_only" as const, icon: Star, baslik: "Sadece Yeni Projeler", aciklama: "Yalnızca yeni proje paylaşımlarında bildirim al." },
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

  const handleSave = () => {
    const settings: NotifSettings = { enabled: permStatus === "granted", type: selectedType, excluded };
    saveNotifSettings(settings);
    onSave(settings);
    onClose();
  };

  const filteredFollowing = following.filter(u => u.toLowerCase().includes(search.toLowerCase()));
  const toggleExclude = (u: string) => setExcluded(prev => prev.includes(u) ? prev.filter(x => x !== u) : [...prev, u]);

  const typeLabel = TIPLER.find(t => t.id === selectedType)?.baslik || "";

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
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/15" />
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between px-5 pt-4 pb-1 shrink-0">
          <div className="flex gap-1.5">
            {[0,1,2,3].map(i => (
              <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-primary" : i < step ? "w-3 bg-primary/50" : "w-3 bg-white/10"}`} />
            ))}
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/15 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <AnimatePresence mode="wait">

            {/* ── ADIM 0: Giriş ── */}
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
                  <h2 className="font-display font-bold text-xl text-white mb-2">Masaüstü bildirimlerini ayarlayın</h2>
                  <p className="text-sm text-white/50 leading-relaxed">
                    Takip ettiğin kişiler bir şey paylaştığında, beğendiğinde veya favorilediğinde anında haberdar ol.
                  </p>
                </div>
                {permStatus === "denied" && (
                  <div className="text-xs text-red-400/80 bg-red-500/10 rounded-xl px-4 py-2 border border-red-500/20 w-full text-center">
                    Tarayıcı bildirimleri engellendi. Tarayıcı ayarlarından izin ver.
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

            {/* ── ADIM 1: Bildirim türü ── */}
            {step === 1 && (
              <motion.div key="step1"
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className="px-6 py-5 flex flex-col gap-4"
              >
                <div>
                  <h2 className="font-display font-bold text-lg text-white">Bildirim Gelme Türünü seçin</h2>
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
                  onClick={() => setStep(2)}
                  className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
                >
                  Devam Et <ChevronRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}

            {/* ── ADIM 2: Hariç tutulacaklar ── */}
            {step === 2 && (
              <motion.div key="step2"
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className="px-6 py-5 flex flex-col gap-4"
              >
                <div>
                  <h2 className="font-display font-bold text-lg text-white">Bildirim gelmesini istemediğin kişi var mı?</h2>
                  <p className="text-xs text-white/40 mt-1">Seçtiğin kişilerden bildirim almayacaksın.</p>
                </div>
                {hasExcluded === null && (
                  <div className="flex gap-3">
                    {[["Evet, var", true], ["Hayır, hepsi gelsin", false]].map(([label, val]) => (
                      <motion.button
                        key={String(val)}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setHasExcluded(val as boolean);
                          if (val) fetchFollowing();
                        }}
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
                        placeholder="Kullanıcı ara..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-white/25 outline-none focus:border-primary/40"
                      />
                    </div>
                    {followingLoading ? (
                      <div className="text-xs text-white/30 text-center py-4">Yükleniyor...</div>
                    ) : (
                      <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                        {filteredFollowing.length === 0 ? (
                          <p className="text-xs text-white/25 text-center py-3">Sonuç yok</p>
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
                      <p className="text-[10px] text-white/30">{excluded.length} kişi hariç tutuldu</p>
                    )}
                  </div>
                )}
                {hasExcluded === false && (
                  <p className="text-xs text-white/40 text-center py-2">Tüm takip ettiğin kişilerden bildirim alacaksın.</p>
                )}
                {hasExcluded !== null && (
                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setStep(3)}
                    className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
                  >
                    Devam Et <ChevronRight className="w-4 h-4" />
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* ── ADIM 3: Özet & Onayla ── */}
            {step === 3 && (
              <motion.div key="step3"
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className="px-6 py-5 flex flex-col gap-4"
              >
                <div>
                  <h2 className="font-display font-bold text-lg text-white">Tercihlerini onaylayın</h2>
                  <p className="text-xs text-white/40 mt-1">Ayarlarını kaydetmeden önce bir göz at.</p>
                </div>
                <div className="space-y-3">
                  <div className="px-4 py-3 rounded-2xl border border-white/8 bg-white/[0.03]">
                    <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1">Bildirim Türü</p>
                    <p className="text-sm font-semibold text-white">{typeLabel}</p>
                  </div>
                  <div className="px-4 py-3 rounded-2xl border border-white/8 bg-white/[0.03]">
                    <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1">Hariç Tutulanlar</p>
                    <p className="text-sm font-semibold text-white">
                      {excluded.length > 0 ? excluded.join(", ") : "Yok — hepsi bildiriyor"}
                    </p>
                  </div>
                  <div className="px-4 py-3 rounded-2xl border border-white/8 bg-white/[0.03]">
                    <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1">İzin Durumu</p>
                    <p className={`text-sm font-semibold ${permStatus === "granted" ? "text-green-400" : permStatus === "denied" ? "text-red-400" : "text-yellow-400"}`}>
                      {permStatus === "granted" ? "✅ Bildirimler açık" : permStatus === "denied" ? "❌ Tarayıcı engelledi" : "⚠️ İzin bekleniyor"}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleSave}
                  className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
                >
                  <Check className="w-4 h-4" /> Tamam, Ayarları Kaydet
                </motion.button>
                <button onClick={() => setStep(0)} className="text-[11px] text-white/25 hover:text-white/50 transition-colors text-center">
                  Baştan başla
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
