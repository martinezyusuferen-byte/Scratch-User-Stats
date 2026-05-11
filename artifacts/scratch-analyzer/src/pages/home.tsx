import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, BarChart2, Target, TrendingUp, Users, Zap, Star,
  ArrowRight, Heart, Eye, Play, X, Loader2, User, Gamepad2,
  ChevronUp, ChevronDown, Flame, Clock, Sparkles, Brain,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const ornekKullanicilar = ["griffpatch", "Will_Wam", "ceebee", "ScratchCat"];

// ─── İlgi Takip Algoritması ───────────────────────────────────────────────────
const INTEREST_KEY = "ss_flick_interests";
const CATEGORY_KEY = "ss_flick_categories";
const SESSION_KEY = "ss_flick_session";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "oyun":       ["game","platformer","rpg","clicker","quiz","escape","battle","fight","run","jump","shooter","racing","puzzle"],
  "animasyon":  ["animation","animate","story","film","movie","cartoon","series","episode"],
  "müzik":      ["music","song","piano","beat","drum","melody","sound","remix","band","concert"],
  "sanat":      ["art","drawing","pixel","paint","draw","design","sketch","color","portrait"],
  "simülasyon": ["simulator","simulation","physics","engine","sandbox","sandbox","life","city","world"],
  "eğitim":     ["tutorial","learn","teach","school","math","science","code","lesson","guide","how to"],
};

function loadInterests(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(INTEREST_KEY) || "{}"); } catch { return {}; }
}
function addInterest(creator: string, delta: number) {
  const d = loadInterests();
  d[creator] = Math.min(9999, (d[creator] || 0) + delta);
  try { localStorage.setItem(INTEREST_KEY, JSON.stringify(d)); } catch {}
}
function inferCategory(title: string): string | null {
  const t = title.toLowerCase();
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    if (kws.some(k => t.includes(k))) return cat;
  }
  return null;
}
function loadCategories(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(CATEGORY_KEY) || "{}"); } catch { return {}; }
}
function addCategoryInterest(title: string, delta: number) {
  const cat = inferCategory(title);
  if (!cat) return;
  const d = loadCategories();
  d[cat] = Math.min(9999, (d[cat] || 0) + delta);
  try { localStorage.setItem(CATEGORY_KEY, JSON.stringify(d)); } catch {}
}
function topCategory(): string | null {
  const d = loadCategories();
  const top = Object.entries(d).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : null;
}
function addSessionTime(delta: number) {
  try {
    const raw = localStorage.getItem(SESSION_KEY) || "{}";
    const d = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    d[today] = (d[today] || 0) + delta;
    localStorage.setItem(SESSION_KEY, JSON.stringify(d));
  } catch {}
}
function getPersonalized(projects: any[]): any[] {
  const d = loadInterests();
  const cats = loadCategories();
  if (!Object.keys(d).length && !Object.keys(cats).length) return projects;
  return [...projects].sort((a, b) => {
    const catA = inferCategory(a.title || "");
    const catB = inferCategory(b.title || "");
    const scoreA = (d[a.creator] || 0) + (catA ? (cats[catA] || 0) * 0.5 : 0);
    const scoreB = (d[b.creator] || 0) + (catB ? (cats[catB] || 0) * 0.5 : 0);
    return scoreB - scoreA;
  });
}
function topCreator(): string | null {
  const d = loadInterests();
  const top = Object.entries(d).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : null;
}
function totalWatchSeconds(): number {
  const d = loadInterests();
  return Object.values(d).reduce((s, v) => s + v, 0);
}

// ─── Parçacık Arka Plan ───────────────────────────────────────────────────────
function Particles() {
  const particles = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 4,
    dur: Math.random() * 6 + 6,
  }));
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/30"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.7, 0],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: p.dur,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      {/* Accent orbs */}
      <motion.div
        className="absolute w-72 h-72 rounded-full bg-primary/10 blur-3xl"
        style={{ left: "10%", top: "20%" }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-60 h-60 rounded-full bg-accent/10 blur-3xl"
        style={{ right: "10%", top: "40%" }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
    </div>
  );
}

// ─── Flaş Oynatıcı (Tam Ekran Modal) ─────────────────────────────────────────
function FlasPlayer({
  projects, startIndex, onClose, onInterest,
}: {
  projects: any[];
  startIndex: number;
  onClose: () => void;
  onInterest: (creator: string, delta: number) => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const [playing, setPlaying] = useState(false);
  const [autoSec, setAutoSec] = useState(0);   // 0-30, resets on nav
  const AUTO_ADVANCE = 30;
  const timeRef = useRef(Date.now());
  const touchY = useRef(0);
  const [, setLocation] = useLocation();

  const proje = projects[index];

  const flush = useCallback(() => {
    if (!proje) return;
    const secs = Math.floor((Date.now() - timeRef.current) / 1000);
    if (secs > 0) {
      onInterest(proje.creator, secs);
      addCategoryInterest(proje.title || "", secs);
      addSessionTime(secs);
    }
    timeRef.current = Date.now();
  }, [proje, onInterest]);

  const goNext = useCallback(() => {
    if (index >= projects.length - 1) return;
    flush();
    setIndex(i => i + 1);
    setPlaying(false);
    setAutoSec(0);
  }, [index, projects.length, flush]);

  const goPrev = useCallback(() => {
    if (index <= 0) return;
    flush();
    setIndex(i => i - 1);
    setPlaying(false);
    setAutoSec(0);
  }, [index, flush]);

  // Auto-advance timer — 1 tick/sn, reset on index change
  useEffect(() => {
    if (playing) return; // iframe oynuyor, otomatik ilerleme yok
    setAutoSec(0);
    const id = setInterval(() => {
      setAutoSec(prev => {
        if (prev >= AUTO_ADVANCE - 1) {
          clearInterval(id);
          return AUTO_ADVANCE;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [index, playing]);

  // Auto-advance tetikle
  useEffect(() => {
    if (autoSec >= AUTO_ADVANCE && index < projects.length - 1) {
      goNext();
    }
  }, [autoSec, index, projects.length, goNext]);

  useEffect(() => {
    const kb = (e: KeyboardEvent) => {
      if (e.key === "Escape") { flush(); onClose(); }
      if (e.key === "ArrowDown") goNext();
      if (e.key === "ArrowUp") goPrev();
    };
    window.addEventListener("keydown", kb);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", kb);
      document.body.style.overflow = "";
    };
  }, [goNext, goPrev, flush, onClose]);

  if (!proje) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)" }}
      onTouchStart={e => { touchY.current = e.touches[0].clientY; }}
      onTouchEnd={e => {
        const dy = e.changedTouches[0].clientY - touchY.current;
        if (dy < -60) goNext();
        if (dy > 60) goPrev();
      }}
    >
      {/* Blurred ambient background */}
      <AnimatePresence>
        {proje.thumbnail_url && (
          <motion.div
            key={proje.id + "-bg"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
          >
            <img src={proje.thumbnail_url} alt="" className="w-full h-full object-cover blur-3xl scale-110 opacity-15" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={proje.id}
          initial={{ opacity: 0, y: 60, scale: 0.93 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -60, scale: 0.93 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="relative z-10 w-full mx-4 flex flex-col"
          style={{ maxWidth: 380, maxHeight: "96vh" }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-3 px-1">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { flush(); setLocation(`/kullanici/${proje.creator}`); onClose(); }}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0"
            >
              {proje.creator_avatar ? (
                <img src={proje.creator_avatar} className="w-9 h-9 rounded-full border-2 border-primary/60 shrink-0" alt="" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">@{proje.creator}</p>
                <p className="text-[10px] text-white/40">{index + 1} / {projects.length}</p>
              </div>
            </motion.button>
            <div className="flex-1" />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { flush(); onClose(); }}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
            >
              <X className="w-4 h-4 text-white" />
            </motion.button>
          </div>

          {/* Embed / Thumbnail area — 9:16 portrait */}
          <div
            className="relative rounded-2xl overflow-hidden bg-black"
            style={{ aspectRatio: "9/16", maxHeight: "calc(96vh - 170px)" }}
          >
            {playing ? (
              <iframe
                src={`https://scratch.mit.edu/projects/${proje.id}/embed`}
                className="w-full h-full border-0"
                title={proje.title}
                scrolling="no"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full relative">
                {proje.thumbnail_url ? (
                  <img src={proje.thumbnail_url} alt={proje.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Gamepad2 className="w-16 h-16 text-white/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => { setPlaying(true); onInterest(proje.creator, 5); }}
                    className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl shadow-primary/50"
                    style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
                  >
                    <Play className="w-9 h-9 text-white fill-white ml-1" />
                  </motion.button>
                </div>

                {/* Bottom info */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-bold text-base line-clamp-2 mb-2 drop-shadow">{proje.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-white/70">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-blue-400" />{(proje.views || 0).toLocaleString("tr-TR")}</span>
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-pink-400" />{(proje.loves || 0).toLocaleString("tr-TR")}</span>
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" />{(proje.favorites || 0).toLocaleString("tr-TR")}</span>
                  </div>
                </div>

                {/* Auto-advance progress bar */}
                {!playing && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        width: `${(autoSec / AUTO_ADVANCE) * 100}%`,
                        background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))",
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}

                {/* Progress dots + "sıradaki" hint */}
                <div className="absolute top-3 left-0 right-0 flex items-center justify-center gap-1 px-4">
                  {projects.slice(Math.max(0, index - 2), Math.min(projects.length, index + 3)).map((_, relI) => {
                    const absI = Math.max(0, index - 2) + relI;
                    return (
                      <div key={absI} className={`h-0.5 rounded-full transition-all ${absI === index ? "w-6 bg-primary" : "w-2 bg-white/30"}`} />
                    );
                  })}
                </div>

                {/* "Sıradaki" uyarısı — son 5 saniyede belir */}
                <AnimatePresence>
                  {!playing && autoSec >= AUTO_ADVANCE - 5 && index < projects.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 rounded-full text-xs font-bold text-white backdrop-blur-md flex items-center gap-2"
                      style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}
                    >
                      <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>⏭</motion.span>
                      {AUTO_ADVANCE - autoSec}s sonra sıradaki
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Bottom controls */}
          <div className="flex items-center justify-between mt-3 px-1 gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { flush(); setLocation(`/kullanici/${proje.creator}`); onClose(); }}
              className="text-xs px-3 py-2 rounded-full bg-white/8 hover:bg-primary/30 border border-white/10 text-white/70 hover:text-white transition-all flex items-center gap-1.5 truncate"
            >
              <BarChart2 className="w-3 h-3 shrink-0" /> Analiz Et
            </motion.button>
            <div className="flex items-center gap-2 shrink-0">
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={goPrev}
                disabled={index === 0}
                className="w-10 h-10 rounded-full bg-white/10 disabled:opacity-25 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <ChevronUp className="w-5 h-5 text-white" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={goNext}
                disabled={index === projects.length - 1}
                className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-25 hover:scale-105 transition-all"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
              >
                <ChevronDown className="w-5 h-5 text-white" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Flaş Kart (portre) ───────────────────────────────────────────────────────
function FlasKart({ proje, index, onClick, isPersonalized }: {
  proje: any; index: number; onClick: () => void; isPersonalized: boolean;
}) {
  const interests = loadInterests();
  const score = interests[proje.creator] || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 24, delay: index * 0.06 }}
      onClick={onClick}
      className="group cursor-pointer shrink-0"
      style={{ width: 140 }}
    >
      <div className="rounded-2xl overflow-hidden border border-white/[0.07] hover:border-primary/50 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-xl group-hover:shadow-primary/20 flex flex-col bg-black/40 backdrop-blur-sm">
        {/* Thumbnail — portrait */}
        <div className="relative overflow-hidden bg-black" style={{ aspectRatio: "9/14" }}>
          {proje.thumbnail_url ? (
            <img
              src={proje.thumbnail_url}
              alt={proje.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Personalized badge */}
          {isPersonalized && score > 2 && (
            <div className="absolute top-1.5 left-1.5">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/90 text-white">Senin için</span>
            </div>
          )}

          {/* Play icon on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          </div>

          {/* Views */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <span className="text-[10px] text-white/80 flex items-center gap-0.5">
              <Eye className="w-2.5 h-2.5 text-blue-400" />
              {proje.views >= 1000 ? `${(proje.views / 1000).toFixed(1)}B` : proje.views}
            </span>
            <span className="text-[10px] text-white/80 flex items-center gap-0.5">
              <Heart className="w-2.5 h-2.5 text-pink-400" />
              {proje.loves >= 1000 ? `${(proje.loves / 1000).toFixed(1)}B` : proje.loves}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-2">
          <p className="text-[11px] font-semibold text-white/90 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {proje.title}
          </p>
          <p className="text-[10px] text-white/40 mt-0.5 truncate">@{proje.creator}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────
type AramaDurumu = "bos" | "yukleniyor" | "proje-sonuclari" | "hata";
type FlasMode = "popular" | "trending" | "new";

export default function Home() {
  const [, setLocation] = useLocation();
  const [aramaInput, setAramaInput] = useState("");
  const [durum, setDurum] = useState<AramaDurumu>("bos");
  const [sonuclar, setSonuclar] = useState<any[]>([]);
  const [aramanAdi, setAramanAdi] = useState("");
  const [hataMesaji, setHataMesaji] = useState("");

  // Flaş state
  const [flashProjeler, setFlashProjeler] = useState<any[]>([]);
  const [flashYukleniyor, setFlashYukleniyor] = useState(true);
  const [flashMod, setFlashMod] = useState<FlasMode>("popular");
  const [flashPersonel, setFlashPersonel] = useState(false);
  const [aciKart, setAciKart] = useState<number | null>(null);
  const [interests, setInterests] = useState<Record<string, number>>(loadInterests);
  const scrollRef = useRef<HTMLDivElement>(null);

  const refreshInterests = useCallback(() => {
    setInterests(loadInterests());
  }, []);

  const handleInterest = useCallback((creator: string, delta: number) => {
    addInterest(creator, delta);
    refreshInterests();
  }, [refreshInterests]);

  // Popüler projeleri yükle
  useEffect(() => {
    setFlashYukleniyor(true);
    const modeMap: Record<FlasMode, string> = { popular: "popular", trending: "trending", new: "recent" };
    fetch(`${BASE}/api/scratch/popular?mode=${modeMap[flashMod]}&limit=20`)
      .then(r => r.json())
      .then(d => {
        let projs = d.results || [];
        if (flashPersonel) projs = getPersonalized(projs);
        setFlashProjeler(projs);
      })
      .catch(() => setFlashProjeler([]))
      .finally(() => setFlashYukleniyor(false));
  }, [flashMod, flashPersonel]);

  const temizle = () => {
    setDurum("bos");
    setSonuclar([]);
    setAramaInput("");
    setAramanAdi("");
  };

  const handleArama = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = aramaInput.trim();
    if (!val) return;
    setDurum("yukleniyor");
    setAramanAdi(val);
    try {
      const kulRes = await fetch(`${BASE}/api/scratch/user/${encodeURIComponent(val)}`);
      if (kulRes.ok) { setLocation(`/kullanici/${encodeURIComponent(val)}`); setDurum("bos"); return; }
      if (kulRes.status === 429) { setHataMesaji("Scratch API şu an yoğun. Biraz bekleyip tekrar dene."); setDurum("hata"); return; }
      const aramaRes = await fetch(`${BASE}/api/scratch/search?q=${encodeURIComponent(val)}`);
      if (!aramaRes.ok) throw new Error();
      const data = await aramaRes.json();
      setSonuclar(data.results || []);
      setDurum("proje-sonuclari");
    } catch {
      setHataMesaji("Bağlantı hatası. Lütfen tekrar dene.");
      setDurum("hata");
    }
  };

  const top = topCreator();
  const totalSec = totalWatchSeconds();

  const flashModListe: { key: FlasMode; label: string; icon: any }[] = [
    { key: "popular", label: "Popüler", icon: Flame },
    { key: "trending", label: "Trend", icon: TrendingUp },
    { key: "new", label: "Yeni", icon: Clock },
  ];

  return (
    <div className="min-h-screen relative flex flex-col items-center overflow-x-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <img
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
          alt=""
          className="w-full h-full object-cover opacity-25 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/40" />
        <Particles />
      </div>

      <div className="relative z-10 w-full max-w-6xl px-4 sm:px-6 flex flex-col items-center pt-10 pb-16">

        {/* ── Hero ── */}
        <motion.div
          className="text-center mb-8 w-full"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
        >
          <motion.div
            variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}
            transition={{ type: "spring", stiffness: 300 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}
          >
            <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
              <Zap className="w-4 h-4 text-primary" />
            </motion.div>
            <span className="text-sm font-medium text-white/80">Gelişmiş Scratch Analizi</span>
          </motion.div>

          <motion.h1
            variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="text-4xl sm:text-6xl md:text-7xl font-display font-bold mb-4 leading-tight"
          >
            Analiz Et.{" "}
            <motion.span
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              className="text-gradient inline-block"
            >
              Keşfet.
            </motion.span>{" "}
            Öne Çık.
          </motion.h1>

          <motion.p
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto"
          >
            Scratch kullanıcılarını derinlemesine analiz et, trend projeleri keşfet.
          </motion.p>
        </motion.div>

        {/* ── Arama ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 20, delay: 0.3 }}
          className="w-full max-w-2xl mb-3"
        >
          <form onSubmit={handleArama} className="relative group">
            <motion.div
              className="absolute -inset-0.5 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-md"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)/0.5), hsl(var(--accent)/0.5), hsl(var(--primary)/0.5))" }}
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <div className="relative flex items-center bg-white/[0.06] border border-white/10 focus-within:border-primary/50 rounded-2xl px-5 py-4 transition-all duration-300 backdrop-blur-xl">
              {durum === "yukleniyor" ? (
                <Loader2 className="w-5 h-5 text-primary mr-3 shrink-0 animate-spin" />
              ) : (
                <Search className="w-5 h-5 text-white/30 mr-3 shrink-0 group-focus-within:text-primary transition-colors duration-300" />
              )}
              <input
                type="text"
                value={aramaInput}
                onChange={e => setAramaInput(e.target.value)}
                placeholder="Kullanıcı adı veya proje adı gir..."
                className="flex-1 bg-transparent border-none outline-none text-base text-white placeholder:text-white/25"
                autoComplete="off"
                disabled={durum === "yukleniyor"}
              />
              <AnimatePresence>
                {aramaInput && durum !== "yukleniyor" && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    type="button"
                    onClick={temizle}
                    className="mr-2 text-white/25 hover:text-white/60 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
              </AnimatePresence>
              <motion.button
                type="submit"
                disabled={!aramaInput.trim() || durum === "yukleniyor"}
                whileTap={{ scale: 0.96 }}
                className="ml-1 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
              >
                {durum === "yukleniyor" ? "Aranıyor..." : <><span>Ara</span><ArrowRight className="w-4 h-4" /></>}
              </motion.button>
            </div>
          </form>
          <p className="text-[11px] text-white/25 text-center mt-2">
            Kullanıcı adı → profil analizi &nbsp;·&nbsp; Proje adı → proje sonuçları
          </p>
        </motion.div>

        {/* Örnek kullanıcılar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap items-center gap-2 justify-center mb-6"
        >
          <span className="text-[11px] text-white/30 flex items-center gap-1"><User className="w-3 h-3" /> Örnek:</span>
          {ornekKullanicilar.map((k, i) => (
            <motion.button
              key={k}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.55 + i * 0.07, type: "spring" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocation(`/kullanici/${k}`)}
              className="text-[11px] px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-primary/20 hover:border-primary/40 hover:text-primary transition-all duration-200"
            >
              {k}
            </motion.button>
          ))}
        </motion.div>

        {/* ── HATA ── */}
        <AnimatePresence>
          {durum === "hata" && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              <span>⚠️</span>
              <span>{hataMesaji}</span>
              <button onClick={temizle} className="ml-auto text-red-400/50 hover:text-red-400"><X className="w-4 h-4" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── PROJE ARAMA SONUÇLARI ── */}
        <AnimatePresence>
          {durum === "proje-sonuclari" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full mb-10"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-accent" />
                  <h2 className="font-display font-bold text-base text-white">
                    "<span className="text-primary">{aramanAdi}</span>" için projeler
                  </h2>
                  <span className="text-[11px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{sonuclar.length}</span>
                </div>
                <button onClick={temizle} className="text-xs text-white/30 hover:text-white flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Temizle
                </button>
              </div>
              {sonuclar.length === 0 ? (
                <div className="text-center py-10 text-white/30">
                  <Gamepad2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Sonuç bulunamadı. Farklı anahtar kelimeler dene.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {sonuclar.map((proje, i) => (
                    <motion.div
                      key={proje.id}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, delay: i * 0.05 }}
                      onClick={() => setLocation(`/proje/${proje.id}`)}
                      className="group cursor-pointer"
                    >
                      <div className="rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.06] hover:border-primary/40 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-lg group-hover:shadow-primary/10">
                        <div className="aspect-video relative overflow-hidden bg-black/40">
                          {proje.thumbnail_url && <img src={proje.thumbnail_url} alt={proje.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity w-9 h-9 rounded-full bg-primary/90 flex items-center justify-center">
                              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-semibold text-white/90 line-clamp-2 leading-snug mb-1 group-hover:text-primary transition-colors">{proje.title}</p>
                          <button onClick={e => { e.stopPropagation(); setLocation(`/kullanici/${proje.creator}`); }}
                            className="text-[11px] text-white/40 hover:text-primary transition-colors flex items-center gap-1">
                            {proje.creator_avatar && <img src={proje.creator_avatar} className="w-3.5 h-3.5 rounded-full" alt="" />}
                            @{proje.creator}
                          </button>
                          <div className="flex items-center gap-2 mt-2 text-[10px] text-white/30">
                            <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5 text-blue-400/70" />{(proje.views || 0).toLocaleString("tr-TR")}</span>
                            <span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5 text-pink-400/70" />{(proje.loves || 0).toLocaleString("tr-TR")}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FLAŞ BÖLÜMÜ ── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 22, delay: 0.65 }}
          className="w-full mb-10"
        >
          {/* Section header */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
              >
                <Zap className="w-5 h-5 text-primary" />
              </motion.div>
              <h2 className="font-display font-bold text-lg text-white">Flaş</h2>
            </div>

            <div className="flex items-center gap-1 ml-auto flex-wrap">
              {/* Mod tabları */}
              {flashModListe.map(({ key, label, icon: Icon }) => (
                <motion.button
                  key={key}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setFlashMod(key)}
                  className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-all duration-200 border ${flashMod === key ? "bg-primary/20 border-primary/50 text-primary" : "bg-white/5 border-white/10 text-white/50 hover:text-white/80"}`}
                >
                  <Icon className="w-3 h-3" /> {label}
                </motion.button>
              ))}
              {/* Kişisel toggle */}
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => setFlashPersonel(p => !p)}
                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-all duration-200 border ${flashPersonel ? "bg-accent/20 border-accent/50 text-accent" : "bg-white/5 border-white/10 text-white/50 hover:text-white/80"}`}
              >
                <Sparkles className="w-3 h-3" /> Sana Özel
              </motion.button>
            </div>
          </div>

          {/* İlgi analizi mini widget — sessiz arka plan verisi */}
          {totalSec > 5 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-4 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07]"
            >
              <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <Brain className="w-4 h-4 text-accent shrink-0" />
              </motion.div>
              <div className="text-xs text-white/50 flex flex-wrap items-center gap-x-4 gap-y-0.5">
                <span>{totalSec} sn izleme</span>
                {top && <span>En sevdiğin yapımcı: <span className="text-accent font-semibold">@{top}</span></span>}
                {(() => { const cat = topCategory(); return cat ? <span>En sevdiğin konu: <span className="text-primary font-semibold">{cat}</span></span> : null; })()}
              </div>
            </motion.div>
          )}

          {/* Kartlar — yatay kaydırma */}
          {flashYukleniyor ? (
            <div className="flex gap-3 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="shrink-0 rounded-2xl bg-white/5 animate-pulse" style={{ width: 140, aspectRatio: "9/14" }} />
              ))}
            </div>
          ) : flashProjeler.length === 0 ? (
            <div className="text-center py-10 text-white/30">
              <Gamepad2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Proje yüklenemedi.</p>
            </div>
          ) : (
            <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {flashProjeler.map((proje, i) => {
                const interests_ = loadInterests();
                const isPersonalized = flashPersonel && (interests_[proje.creator] || 0) > 2;
                return (
                  <FlasKart
                    key={proje.id}
                    proje={proje}
                    index={i}
                    isPersonalized={isPersonalized}
                    onClick={() => setAciKart(i)}
                  />
                );
              })}
            </div>
          )}

          {/* Mobile swipe hint */}
          <p className="text-[10px] text-white/20 text-center mt-2 sm:hidden">
            Kartlara dokun · Oynatıcıda kaydır veya ok tuşlarını kullan
          </p>
        </motion.div>

        {/* ── ÖZELLİK KARTLARI ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 w-full"
        >
          {[
            { icon: BarChart2, baslik: "Derin İstatistikler", aciklama: "Görüntüleme, beğeni ve etkileşim metrikleri." },
            { icon: Target, baslik: "Batma Oranı", aciklama: "Kaç kişinin beğenmeden geçtiğini öğren." },
            { icon: TrendingUp, baslik: "Büyüme Analizi", aciklama: "Aylık aktivite, trendler ve kıyaslama." },
            { icon: Users, baslik: "Topluluk Etkisi", aciklama: "Takipçi/takip oranı ve topluluk konumu." },
            { icon: Star, baslik: "Proje Puanlama", aciklama: "Özel algoritmamızla etki skoru hesaplama." },
            { icon: Zap, baslik: "Büyüme Önerileri", aciklama: "Daha fazla kişiye ulaşmak için ipuçları." },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 250, delay: 0.9 + i * 0.08 }}
              whileHover={{ y: -4, transition: { type: "spring", stiffness: 400 } }}
              className="flex flex-col items-center text-center p-4 sm:p-5 rounded-2xl border border-white/[0.05] hover:border-primary/20 hover:bg-white/[0.04] transition-colors cursor-default"
              style={{ background: "rgba(255,255,255,0.015)" }}
            >
              <motion.div
                whileHover={{ scale: 1.15, rotate: 5 }}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center mb-3"
                style={{ background: "rgba(var(--primary)/0.15)", border: "1px solid rgba(var(--primary)/0.2)" }}
              >
                <f.icon className="w-5 h-5 text-primary" />
              </motion.div>
              <h3 className="font-display font-semibold text-sm mb-1">{f.baslik}</h3>
              <p className="text-[12px] text-muted-foreground leading-relaxed">{f.aciklama}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── FLAŞ OYNATICI ── */}
      <AnimatePresence>
        {aciKart !== null && (
          <FlasPlayer
            projects={flashProjeler}
            startIndex={aciKart}
            onClose={() => { setAciKart(null); refreshInterests(); }}
            onInterest={handleInterest}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
