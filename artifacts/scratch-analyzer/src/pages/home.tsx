import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Search, BarChart2, Target, TrendingUp, Users, Zap, Star,
  ArrowRight, Heart, Eye, Play, X, Loader2, User, Gamepad2,
  ChevronUp, ChevronDown, Flame, Clock, Sparkles,
  Music, Palette, BookOpen, Globe,
  Link2, Plus, Minus, RefreshCw, Bell,
  CheckCircle, UserPlus,
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
function getTopCategories(minScore = 1): string[] {
  const cats = loadCategories();
  return Object.entries(cats)
    .filter(([, v]) => v >= minScore)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);
}
// 80/20 keşif karışımı — tercih edilen içerik + sürpriz keşifler
function mixWithExploration(preferred: any[], pool: any[], cats: Record<string, number>): any[] {
  const topCat = Object.entries(cats).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!topCat) return preferred;
  const explorationCount = Math.max(1, Math.floor(preferred.length * 0.2));
  const explorationPool = pool.filter(p => inferCategory(p.title || "") !== topCat);
  const explorationItems = [...explorationPool].sort(() => Math.random() - 0.5).slice(0, explorationCount);
  const main = preferred.slice(0, Math.max(0, preferred.length - explorationCount));
  const result = [...main];
  explorationItems.forEach((item, i) => {
    const pos = Math.min(result.length, 4 + i * 5);
    result.splice(pos, 0, item);
  });
  return result;
}

// Kategori → arama sorgusu haritası
const CAT_QUERY: Record<string, string> = {
  oyun: "platformer game", animasyon: "animation story", müzik: "music song",
  sanat: "art drawing", simülasyon: "simulator world", eğitim: "tutorial learn",
};
const CAT_ICON: Record<string, any> = {
  oyun: Gamepad2, animasyon: Play, müzik: Music, sanat: Palette, simülasyon: Globe, eğitim: BookOpen,
};
const CAT_EMOJI: Record<string, string> = {
  oyun: "🎮", animasyon: "🎬", müzik: "🎵", sanat: "🎨", simülasyon: "🌍", eğitim: "📚",
};

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
  projects, startIndex, onClose, onInterest, onNearEnd,
}: {
  projects: any[];
  startIndex: number;
  onClose: () => void;
  onInterest: (creator: string, delta: number) => void;
  onNearEnd: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const [playing, setPlaying] = useState(false);
  const [autoSec, setAutoSec] = useState(0);
  const AUTO_ADVANCE = 30;
  const timeRef = useRef(Date.now());
  const nearEndFired = useRef(false);
  const touchY = useRef(0);
  const [, setLocation] = useLocation();

  const proje = projects[index];

  // TikTok tamamlama oranı skoru — kullanıcı görmez, arka planda çalışır
  const flush = useCallback(() => {
    if (!proje) return;
    const secs = Math.floor((Date.now() - timeRef.current) / 1000);
    const pct = secs / AUTO_ADVANCE;
    // Tamamlama oranına göre ağırlıklı skor (TikTok havuz mantığı)
    let score = 0;
    if (secs < 3)       score = -1;  // hızlı atlama → negatif sinyal
    else if (pct < 0.4) score = 1;   // kısa izleme → zayıf ilgi
    else if (pct < 0.7) score = 3;   // yarıdan fazla → ilgi var
    else                score = 6;   // neredeyse/tam tamamlama → güçlü ilgi
    if (score !== 0) {
      onInterest(proje.creator, score);
      addCategoryInterest(proje.title || "", score);
    }
    addSessionTime(Math.max(0, secs));
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

  // Sessiz "daha fazla yükle" — listenin sonuna yaklaşınca tetikle
  useEffect(() => {
    if (!nearEndFired.current && index >= projects.length - 4) {
      nearEndFired.current = true;
      onNearEnd();
    }
  }, [index, projects.length, onNearEnd]);

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

// ─── Onboarding Modal ───
const CONNECTED_KEY = "ss_connected_user";
const FOLLOWING_KEY = "ss_following";

function getConnectedUser(): string | null {
  try { return localStorage.getItem(CONNECTED_KEY); } catch { return null; }
}
function setConnectedUser(user: string | null) {
  if (user) localStorage.setItem(CONNECTED_KEY, user);
  else localStorage.removeItem(CONNECTED_KEY);
}
function getFollowing(): string[] {
  try { return JSON.parse(localStorage.getItem(FOLLOWING_KEY) || "[]"); } catch { return []; }
}
function addFollowing(username: string) {
  const list = getFollowing();
  if (!list.includes(username)) {
    list.push(username);
    try { localStorage.setItem(FOLLOWING_KEY, JSON.stringify(list)); } catch {}
  }
}
function removeFollowing(username: string) {
  const list = getFollowing().filter(u => u !== username);
  try { localStorage.setItem(FOLLOWING_KEY, JSON.stringify(list)); } catch {}
}
function relativeTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "az önce";
  if (m < 60) return `${m} dakika önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} saat önce`;
  const g = Math.floor(h / 24);
  return `${g} gün önce`;
}

function BaglaModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0); // 0=intro, 1=input, 2=loading, 3=success
  const [username, setUsername] = useState("");
  const [hata, setHata] = useState("");
  const [, setLocation] = useLocation();

  const handleBagla = async () => {
    const val = username.trim().toLowerCase();
    if (!val) return;
    setStep(2); setHata("");
    try {
      const res = await fetch(`${BASE}/api/scratch/user/${encodeURIComponent(val)}`);
      if (!res.ok) {
        setHata("Bu kullanıcı adı bulunamadı.");
        setStep(1); return;
      }
      const data = await res.json();
      setConnectedUser(val);
      // Default: takip ettiği kişileri ekle
      try {
        const fRes = await fetch(`${BASE}/api/scratch/user/${encodeURIComponent(val)}/following`);
        const fData = await fRes.json();
        if (fData.following?.length) {
          fData.following.slice(0, 8).forEach((u: any) => addFollowing(u.username));
        }
      } catch {}
      setStep(3);
      setTimeout(() => { onClose(); window.location.reload(); }, 1800);
    } catch {
      setHata("Bağlantı hatası. Tekrar dene.");
      setStep(1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        className="w-full max-w-md rounded-3xl overflow-hidden relative"
        style={{ background: "rgba(15,15,25,0.95)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}
      >
        {/* Ambient background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute w-96 h-96 rounded-full opacity-20"
            style={{ left: "-50%", top: "-20%", background: "radial-gradient(circle, hsl(var(--primary)), transparent)" }}
            animate={{ x: [0, 40, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute w-80 h-80 rounded-full opacity-15"
            style={{ right: "-30%", bottom: "-10%", background: "radial-gradient(circle, hsl(var(--accent)), transparent)" }}
            animate={{ x: [0, -30, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 10, repeat: Infinity, delay: 2 }}
          />
        </div>

        <div className="relative px-6 py-8">
          {/* Close */}
          <button onClick={onClose} className="absolute top-4 right-4 text-white/25 hover:text-white/60 transition-colors">
            <X className="w-5 h-5" />
          </button>

          {step === 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex items-center justify-center mb-5">
                <motion.div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
                  animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Link2 className="w-9 h-9 text-white" />
                </motion.div>
              </div>
              <h2 className="text-2xl font-display font-bold text-white text-center mb-2">Hesabını Bağla</h2>
              <p className="text-sm text-white/40 text-center mb-6 leading-relaxed">
                Takip ettiğin kişilerin yeni projelerini keşfet. 
                <br/>Scratch analizin şimdi daha sosyal.
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep(1)}
                className="w-full py-3.5 rounded-xl font-semibold text-white"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
              >
                Başlat
              </motion.button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-xl font-display font-bold text-white mb-1">Kullanıcı adın</h2>
              <p className="text-sm text-white/40 mb-5">Scratch profil adını gir.</p>
              <div className="flex items-center bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 mb-4 focus-within:border-primary/40 transition-colors">
                <span className="text-white/30 text-sm mr-2">@</span>
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="scratchkullanici"
                  className="flex-1 bg-transparent border-none outline-none text-white text-sm"
                  autoComplete="off"
                  onKeyDown={e => e.key === "Enter" && handleBagla()}
                  autoFocus
                />
              </div>
              {hata && <p className="text-xs text-red-400 mb-3">{hata}</p>}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleBagla}
                className="w-full py-3.5 rounded-xl font-semibold text-white"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
              >
                Bağla
              </motion.button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div className="flex flex-col items-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-12 h-12 rounded-full border-3 border-white/10 border-t-primary mb-4"
              />
              <p className="text-sm text-white/50">Profillin kontrol ediliyor...</p>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-6">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, delay: 0.1 }}
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
              >
                <CheckCircle className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-lg font-bold text-white mb-1">Başarılı!</h3>
              <p className="text-sm text-white/50">Hesabın bağlandı. Yönlendiriliyor...</p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Mobil TikTok Flaş Oynatıcı ──────────────────────────────────────────────
function MobilFlasOynatici({
  projeler, onInterest, onNearEnd,
  flashMod, setFlashMod, flashModListe, flashYukleniyor,
}: {
  projeler: any[];
  onInterest: (creator: string, delta: number) => void;
  onNearEnd: () => void;
  flashMod: FlasMode;
  setFlashMod: (m: FlasMode) => void;
  flashModListe: { key: FlasMode; label: string; icon: any; emoji?: string }[];
  flashYukleniyor: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [autoSec, setAutoSec] = useState(0);
  const AUTO_ADVANCE = 25;
  const timeRef = useRef(Date.now());
  const nearEndFired = useRef(false);
  const [, setLocation] = useLocation();
  const dragY = useMotionValue(0);

  const proje = projeler[index];

  const flush = useCallback(() => {
    if (!proje) return;
    const secs = Math.floor((Date.now() - timeRef.current) / 1000);
    const pct = secs / AUTO_ADVANCE;
    let score = 0;
    if (secs < 3)       score = -1;
    else if (pct < 0.4) score = 1;
    else if (pct < 0.7) score = 3;
    else                score = 6;
    if (score !== 0) { onInterest(proje.creator, score); addCategoryInterest(proje.title || "", score); }
    addSessionTime(Math.max(0, secs));
    timeRef.current = Date.now();
  }, [proje, onInterest]);

  const goNext = useCallback(() => {
    if (index >= projeler.length - 1) return;
    flush(); setDirection(1); setIndex(i => i + 1); setPlaying(false); setAutoSec(0);
  }, [index, projeler.length, flush]);

  const goPrev = useCallback(() => {
    if (index <= 0) return;
    flush(); setDirection(-1); setIndex(i => i - 1); setPlaying(false); setAutoSec(0);
  }, [index, flush]);

  useEffect(() => {
    if (!nearEndFired.current && index >= projeler.length - 4) {
      nearEndFired.current = true; onNearEnd();
    }
  }, [index, projeler.length, onNearEnd]);

  useEffect(() => {
    if (playing) return;
    setAutoSec(0);
    const id = setInterval(() => {
      setAutoSec(prev => {
        if (prev >= AUTO_ADVANCE - 1) { clearInterval(id); return AUTO_ADVANCE; }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [index, playing]);

  useEffect(() => {
    if (autoSec >= AUTO_ADVANCE && index < projeler.length - 1) goNext();
  }, [autoSec, index, projeler.length, goNext]);

  // mod değişince index sıfırla
  useEffect(() => { setIndex(0); setPlaying(false); setAutoSec(0); nearEndFired.current = false; }, [flashMod]);

  if (flashYukleniyor) {
    return (
      <div className="flex items-center justify-center" style={{ height: "100svh" }}>
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-10 h-10 border-2 border-white/10 border-t-primary rounded-full" />
          <p className="text-xs text-white/30">Flaş yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!proje) {
    return (
      <div className="flex items-center justify-center text-white/30" style={{ height: "100svh" }}>
        <p className="text-sm">İçerik bulunamadı.</p>
      </div>
    );
  }

  const slideVariants = {
    enter:  (dir: number) => ({ y: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { y: "0%", opacity: 1 },
    exit:   (dir: number) => ({ y: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <div className="relative overflow-hidden w-full" style={{ height: "100svh" }}>

      {/* Bulanık ortam arka planı */}
      <AnimatePresence>
        {proje.thumbnail_url && (
          <motion.img key={proje.id + "-mbg"}
            src={proje.thumbnail_url} alt=""
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 w-full h-full object-cover blur-3xl scale-125 opacity-[0.18] pointer-events-none select-none"
          />
        )}
      </AnimatePresence>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "rgba(0,0,0,0.45)" }} />

      {/* Sekme başlığı */}
      <div className="absolute top-0 left-0 right-0 z-30 pt-3 pb-2 px-3" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)" }}>
        <div className="flex items-center gap-1.5 justify-center">
          <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}>
            <Zap className="w-4 h-4 text-primary" />
          </motion.div>
          <span className="font-display font-bold text-sm text-white mr-1">Flaş</span>
          {flashModListe.map(({ key, label, icon: Icon, emoji }) => {
            const isActive = flashMod === key;
            return (
              <motion.button key={key} whileTap={{ scale: 0.9 }}
                onClick={() => setFlashMod(key)}
                className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border transition-all ${isActive ? "border-primary/60 text-white" : "bg-black/30 border-white/10 text-white/45"}`}
                style={isActive ? { background: "linear-gradient(135deg, hsl(var(--primary)/0.35), hsl(var(--accent)/0.25))", backdropFilter: "blur(8px)" } : { backdropFilter: "blur(8px)" }}
              >
                <AnimatePresence mode="wait">
                  <motion.span key={`mi-${key}-${label}`} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex items-center">
                    {emoji ? <span className="text-[10px]">{emoji}</span> : <Icon className="w-3 h-3" />}
                  </motion.span>
                </AnimatePresence>
                <AnimatePresence mode="wait">
                  <motion.span key={`ml-${key}-${label}`} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.15 }} className="capitalize">{label}</motion.span>
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Otomatik ilerleme progress bar */}
      {!playing && (
        <div className="absolute top-[52px] left-0 right-0 h-0.5 bg-white/10 z-30">
          <motion.div className="h-full" transition={{ duration: 0.4 }}
            style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))", width: `${(autoSec / AUTO_ADVANCE) * 100}%` }} />
        </div>
      )}

      {/* Ana kart — drag ile kaydır */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={proje.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 340, damping: 36, mass: 0.85 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.1}
          style={{ y: dragY, touchAction: "none" }}
          onDragEnd={(_, { offset, velocity }) => {
            const swipe = Math.abs(offset.y) > 55 || Math.abs(velocity.y) > 350;
            if (!swipe) { dragY.set(0); return; }
            if (offset.y < 0) goNext();
            else goPrev();
            dragY.set(0);
          }}
          className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
        >
          {playing ? (
            /* ── Oynatma modu ── */
            <div className="w-full h-full flex flex-col bg-black">
              <iframe
                src={`https://scratch.mit.edu/projects/${proje.id}/embed`}
                className="w-full flex-1 border-0"
                title={proje.title}
                scrolling="no"
                allowFullScreen
              />
              <div className="px-4 py-3 flex items-center justify-between" style={{ background: "rgba(0,0,0,0.9)" }}>
                <div className="min-w-0 mr-3">
                  <p className="text-xs font-bold text-white truncate">@{proje.creator}</p>
                  <p className="text-[10px] text-white/40 truncate">{proje.title}</p>
                </div>
                <motion.button whileTap={{ scale: 0.88 }} onClick={() => setPlaying(false)}
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <X className="w-4 h-4 text-white" />
                </motion.button>
              </div>
            </div>
          ) : (
            /* ── Önizleme modu ── */
            <div className="relative w-full h-full">
              {proje.thumbnail_url ? (
                <img src={proje.thumbnail_url} alt={proje.title} className="w-full h-full object-cover pointer-events-none" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Gamepad2 className="w-24 h-24 text-white/10" />
                </div>
              )}

              {/* Degrade katmanlar */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/10 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent pointer-events-none" />

              {/* Merkez oynat butonu */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                <motion.button
                  whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                  onClick={() => { setPlaying(true); onInterest(proje.creator, 5); }}
                  className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl shadow-primary/60"
                  style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
                >
                  <Play className="w-9 h-9 text-white fill-white ml-1" />
                </motion.button>
              </div>

              {/* Sağ kenar — TikTok aksiyonlar */}
              <div className="absolute right-3 bottom-32 flex flex-col items-center gap-4 pointer-events-auto z-10">
                {[
                  { icon: Eye, val: proje.views, color: "text-blue-400" },
                  { icon: Heart, val: proje.loves, color: "text-pink-400" },
                  { icon: Star, val: proje.favorites, color: "text-yellow-400" },
                ].map(({ icon: Icon, val, color }, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <span className="text-[10px] text-white/70 font-medium">
                      {(val || 0) >= 1000 ? `${((val || 0) / 1000).toFixed(1)}B` : (val || 0)}
                    </span>
                  </div>
                ))}
                <div className="flex flex-col items-center gap-1">
                  <motion.button whileTap={{ scale: 0.88 }}
                    onClick={() => setLocation(`/kullanici/${proje.creator}`)}
                    className="w-11 h-11 rounded-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, hsl(var(--primary)/0.4), hsl(var(--accent)/0.3))", backdropFilter: "blur(8px)", border: "1px solid hsl(var(--primary)/0.4)" }}>
                    <BarChart2 className="w-5 h-5 text-primary" />
                  </motion.button>
                  <span className="text-[10px] text-white/40">Analiz</span>
                </div>
              </div>

              {/* Alt bilgi alanı */}
              <div className="absolute bottom-0 left-0 right-16 px-4 pb-6 pt-20 pointer-events-auto"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 100%)" }}>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setLocation(`/kullanici/${proje.creator}`)}
                  className="flex items-center gap-2 mb-2">
                  {proje.creator_avatar ? (
                    <img src={proje.creator_avatar} className="w-8 h-8 rounded-full border-2 border-primary/60 shrink-0" alt="" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <span className="text-sm font-bold text-white">@{proje.creator}</span>
                </motion.button>
                <h3 className="text-base font-bold text-white leading-snug line-clamp-2 mb-3">{proje.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-white/30">{index + 1} / {projeler.length}</span>
                  <span className="text-[11px] text-white/15">·</span>
                  <motion.span className="text-[11px] text-white/20" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}>↑↓ kaydır</motion.span>
                </div>
              </div>

              {/* "Sıradaki" uyarısı */}
              <AnimatePresence>
                {!playing && autoSec >= AUTO_ADVANCE - 5 && index < projeler.length - 1 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 rounded-full text-xs font-bold text-white flex items-center gap-2 pointer-events-none"
                    style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.12)" }}>
                    <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>⏭</motion.span>
                    {AUTO_ADVANCE - autoSec}s sonra sıradaki
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Aşağı ok ipucu */}
              {index < projeler.length - 1 && (
                <motion.div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none z-10"
                  animate={{ y: [0, 5, 0], opacity: [0.3, 0.7, 0.3] }} transition={{ repeat: Infinity, duration: 1.4 }}>
                  <ChevronDown className="w-5 h-5 text-white" />
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* İlerleme noktaları — sağ üst */}
      <div className="absolute top-[60px] right-3 z-30 flex flex-col gap-1 pointer-events-none">
        {projeler.slice(Math.max(0, index - 2), Math.min(projeler.length, index + 4)).map((_, relI) => {
          const absI = Math.max(0, index - 2) + relI;
          return (
            <div key={absI} className={`rounded-full transition-all ${absI === index ? "w-1.5 h-4 bg-primary" : "w-1 h-1.5 bg-white/25"}`} />
          );
        })}
      </div>
    </div>
  );
}

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────
type AramaDurumu = "bos" | "yukleniyor" | "proje-sonuclari" | "hata";
type FlasMode = "popular" | "trending" | "new" | "personal";

// Geniş keyword havuzu — rotasyon için
const FLASH_POOL = [
  "platformer", "animation", "music", "art", "quiz", "clicker",
  "minecraft", "rpg", "simulator", "drawing", "story", "battle",
  "escape", "racing", "puzzle", "shooter", "adventure", "pixel",
  "anime", "funny", "horror", "math", "rhythm", "snake", "garden",
  "cats", "space", "castle", "ocean", "wizard", "robot", "ninja",
];

function pickFlashKeywords(n = 3): string[] {
  return [...FLASH_POOL].sort(() => Math.random() - 0.5).slice(0, n);
}

function mergeUnique(lists: any[][], seen: Set<number>): any[] {
  const result: any[] = [];
  lists.flat().forEach(p => {
    if (!seen.has(p.id)) { seen.add(p.id); result.push(p); }
  });
  return result;
}

// Paralel arama — farklı keyword ve offset ile zengin içerik havuzu
async function fetchFlashPool(queries: string[], seen: Set<number>, mode = "popular"): Promise<any[]> {
  const offset = Math.floor(Math.random() * 4) * 16; // 0, 16, 32, 48
  const results = await Promise.all(
    queries.map(q =>
      fetch(`${BASE}/api/scratch/search?q=${encodeURIComponent(q)}&mode=${mode}&offset=${offset}&limit=16`)
        .then(r => r.json()).catch(() => ({ results: [] }))
    )
  );
  return mergeUnique(results.map(d => d.results || []), seen);
}

export default function Home() {
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();
  const [aramaInput, setAramaInput] = useState("");
  const [durum, setDurum] = useState<AramaDurumu>("bos");
  const [sonuclar, setSonuclar] = useState<any[]>([]);
  const [aramanAdi, setAramanAdi] = useState("");
  const [hataMesaji, setHataMesaji] = useState("");

  // Sosyal feed state
  const [connectedUser, setConnectedUser] = useState<string | null>(() => getConnectedUser());
  const [feed, setFeed] = useState<any[]>([]);
  const [feedYukleniyor, setFeedYukleniyor] = useState(false);
  const [showBagla, setShowBagla] = useState(false);

  // Flaş state
  const [flashProjeler, setFlashProjeler] = useState<any[]>([]);
  const [flashYukleniyor, setFlashYukleniyor] = useState(true);
  const [flashMod, setFlashMod] = useState<FlasMode>("popular");
  const [learnedCats, setLearnedCats] = useState<string[]>(() => getTopCategories(1));
  const [aciKart, setAciKart] = useState<number | null>(null);
  const loadingMore = useRef(false);
  const seenIds = useRef<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInterest = useCallback((creator: string, delta: number) => {
    addInterest(creator, delta);
    setLearnedCats(getTopCategories(1));
  }, []);

  // Feed yukleme
  useEffect(() => {
    if (!connectedUser) return;
    setFeedYukleniyor(true);
    fetch(`${BASE}/api/scratch/feed/${encodeURIComponent(connectedUser)}`)
      .then(r => r.json())
      .then(d => {
        const list = (d.activities || []).map((a: any) => ({
          ...a,
          actorAvatar: a.actor_avatar || a.actorAvatar,
          projectTitle: a.project?.title || a.projectTitle,
          projectId: a.project?.id || a.projectId,
          targetUser: a.targetUser,
          timeAgo: a.timeAgo || relativeTime(a.created_at),
        }));
        setFeed(list);
      })
      .catch(() => setFeed([]))
      .finally(() => setFeedYukleniyor(false));
  }, [connectedUser]);

  // Onboarding: ilk ziyaret
  useEffect(() => {
    if (!connectedUser && !localStorage.getItem("ss_onboarding_dismissed")) {
      const t = setTimeout(() => setShowBagla(true), 2000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [connectedUser]);

  // Flaş içerik yükleme — paralel çok-keyword arama ile taze içerik
  useEffect(() => {
    let cancelled = false;
    setFlashYukleniyor(true);
    seenIds.current.clear();

    const doLoad = async () => {
      try {
        let projs: any[] = [];
        if (flashMod === "personal") {
          // Personal: öğrenilen top 2 kategori + 1 keşif keyword
          const cats = learnedCats.slice(0, 2);
          const queries = [
            ...cats.map(c => CAT_QUERY[c] || c),
            pickFlashKeywords(1)[0],
          ];
          projs = await fetchFlashPool(queries, seenIds.current, "popular");
        } else {
          const modeQ = flashMod === "new" ? "recent" : flashMod === "trending" ? "trending" : "popular";
          const keywords = pickFlashKeywords(3);
          projs = await fetchFlashPool(keywords, seenIds.current, modeQ);
        }
        if (cancelled) return;
        const cats = loadCategories();
        let sorted = Object.keys(cats).length > 0 ? getPersonalized(projs) : projs;
        if (flashMod === "personal" && Object.keys(cats).length > 0) {
          sorted = mixWithExploration(sorted, projs, cats);
        }
        setFlashProjeler(sorted);
      } catch {
        if (!cancelled) setFlashProjeler([]);
      } finally {
        if (!cancelled) setFlashYukleniyor(false);
      }
    };

    doLoad();
    return () => { cancelled = true; };
  }, [flashMod, learnedCats.join(",")]);

  // Sonsuz kaydırma — farklı keyword rotasyonu ile taze içerik
  const loadMore = useCallback(() => {
    if (loadingMore.current) return;
    loadingMore.current = true;
    const cats = loadCategories();
    const topCats = getTopCategories(1).slice(0, 2);
    // Öğrenilen kategoriler + rastgele keşif keyword'ları
    const catQueries = topCats.map(c => CAT_QUERY[c] || c);
    const exploreQuery = pickFlashKeywords(1)[0];
    const queries = [...catQueries, exploreQuery].slice(0, 3);
    const offset = Math.floor(Math.random() * 6) * 16;

    Promise.all(
      queries.map(q =>
        fetch(`${BASE}/api/scratch/search?q=${encodeURIComponent(q)}&offset=${offset}&limit=14`)
          .then(r => r.json()).catch(() => ({ results: [] }))
      )
    ).then(results => {
      const fresh = mergeUnique(results.map(d => d.results || []), seenIds.current);
      if (fresh.length === 0) return;
      const sorted = Object.keys(cats).length > 0 ? getPersonalized(fresh) : fresh;
      const mixed = Object.keys(cats).length > 0 ? mixWithExploration(sorted, fresh, cats) : sorted;
      setFlashProjeler(prev => [...prev, ...mixed]);
    }).catch(() => {}).finally(() => { loadingMore.current = false; });
  }, []);

  const temizle = () => {
    setDurum("bos");
    setSonuclar([]);
    setAramaInput("");
    setAramanAdi("");
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
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

  // Dinamik sekme listesi — öğrenilen kategoriye göre smooth morph
  const topCat = learnedCats[0] || null;
  const flashModListe: { key: FlasMode; label: string; icon: any; emoji?: string }[] = [
    {
      key: "popular",
      label: "Popüler",
      icon: topCat ? (CAT_ICON[topCat] || Flame) : Flame,
      emoji: topCat ? CAT_EMOJI[topCat] : undefined,
    },
    { key: "trending", label: "Trend", icon: TrendingUp },
    { key: "new", label: "Yeni", icon: Clock },
    {
      key: "personal",
      label: topCat ? topCat.charAt(0).toUpperCase() + topCat.slice(1) : "Sana Özel",
      icon: topCat ? (CAT_ICON[topCat] || Sparkles) : Sparkles,
      emoji: topCat ? CAT_EMOJI[topCat] : undefined,
    },
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

        {/* Rate limit ekranı kaldırıldı — API server artık kendi şekilde çözüm üretiyor */}

        {/* ── NELER OLUP BİTİYOR? ── */}
        {connectedUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, delay: 0.35 }}
            className="w-full max-w-2xl mb-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
                <Bell className="w-4 h-4 text-primary" />
              </motion.div>
              <h2 className="font-display font-bold text-sm text-white">Neler olup bitiyor?</h2>
              <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{feed.length}</span>
              <button
                onClick={() => setShowBagla(true)}
                className="ml-auto text-[10px] text-white/30 hover:text-primary transition-colors flex items-center gap-1"
              >
                <Link2 className="w-3 h-3" /> Hesabını değiştir
              </button>
            </div>
            {feedYukleniyor ? (
              <div className="flex items-center gap-2 text-xs text-white/30 py-4">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Yükleniyor...
              </div>
            ) : feed.length === 0 ? (
              <div className="text-xs text-white/25 py-3">Takip ettiğin kişilerden henüz aktivite yok.</div>
            ) : (
              <div className="space-y-2">
                {feed.map((a: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, type: "spring", stiffness: 300 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] transition-colors cursor-pointer"
                    onClick={() => {
                      if (a.projectId) setLocation(`/proje/${a.projectId}`);
                      else if (a.targetUser) setLocation(`/kullanici/${a.targetUser}`);
                    }}
                  >
                    <img src={a.actorAvatar} alt="" className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/80 truncate">
                        <span className="font-semibold text-primary">{a.actor}</span>
                        {" "}
                        {a.type === "share" && <>"<span className="text-accent">{a.projectTitle}</span>" projesini paylaştı</>}
                        {a.type === "follow" && <>artık <span className="text-accent">{a.targetUser}</span> kullanıcısını takip ediyor</>}
                        {a.type === "love" && <>"<span className="text-accent">{a.projectTitle}</span>" projesini beğendi</>}
                        {a.type === "favorite" && <>"<span className="text-accent">{a.projectTitle}</span>" projesini favoriledi</>}
                      </p>
                      <p className="text-[10px] text-white/25 mt-0.5">{a.timeAgo}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {!connectedUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, delay: 0.35 }}
            className="w-full max-w-2xl mb-6"
          >
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer hover:bg-white/[0.05] transition-colors"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
              onClick={() => setShowBagla(true)}
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1], rotate: [0, 8, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
              >
                <UserPlus className="w-4 h-4 text-white" />
              </motion.div>
              <div>
                <p className="text-xs font-semibold text-white">Hesabını bağla</p>
                <p className="text-[10px] text-white/30">Takip ettiğin kişilerin aktivitelerini gör.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/20 ml-auto" />
            </div>
          </motion.div>
        )}

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

        {/* ── FLAŞ BÖLÜMÜ — mobil TikTok feed ── */}
        {isMobile && (
          <div className="w-full -mx-4 mb-8">
            <MobilFlasOynatici
              projeler={flashProjeler}
              onInterest={handleInterest}
              onNearEnd={loadMore}
              flashMod={flashMod}
              setFlashMod={setFlashMod}
              flashModListe={flashModListe}
              flashYukleniyor={flashYukleniyor}
            />
          </div>
        )}

        {/* ── FLAŞ BÖLÜMÜ — masaüstü (yatay scroll) ── */}
        {!isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 22, delay: 0.65 }}
            className="w-full mb-10"
          >
            {/* Section header */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
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
                {flashModListe.map(({ key, label, icon: Icon, emoji }) => {
                  const isActive = flashMod === key;
                  return (
                    <motion.button
                      key={key}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => setFlashMod(key)}
                      className={`relative flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-all duration-300 border overflow-hidden ${isActive ? "border-primary/50 text-white shadow-md shadow-primary/15" : "bg-white/5 border-white/10 text-white/50 hover:text-white/80 hover:border-white/20"}`}
                      style={isActive ? { background: "linear-gradient(135deg, hsl(var(--primary)/0.22), hsl(var(--accent)/0.15))" } : undefined}
                    >
                      <AnimatePresence mode="wait">
                        <motion.span key={`icon-${key}-${label}`} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.18 }} className="flex items-center shrink-0">
                          {emoji ? <span className="text-[11px]">{emoji}</span> : <Icon className="w-3 h-3" />}
                        </motion.span>
                      </AnimatePresence>
                      <AnimatePresence mode="wait">
                        <motion.span key={`label-${key}-${label}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }} className="capitalize">{label}</motion.span>
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </div>
            </div>

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
                <p className="text-sm">Yeni içerik aranıyor...</p>
              </div>
            ) : (
              <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                {flashProjeler.map((proje, i) => {
                  const interests_ = loadInterests();
                  const isPersonalized = flashMod === "personal" && (interests_[proje.creator] || 0) > 2;
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
          </motion.div>
        )}

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
            onClose={() => setAciKart(null)}
            onInterest={handleInterest}
            onNearEnd={loadMore}
          />
        )}
      </AnimatePresence>

      {/* ── BAĞLA MODAL ── */}
      <AnimatePresence>
        {showBagla && (
          <BaglaModal onClose={() => {
            setShowBagla(false);
            localStorage.setItem("ss_onboarding_dismissed", "1");
          }} />
        )}
      </AnimatePresence>
    </div>
  );
}
