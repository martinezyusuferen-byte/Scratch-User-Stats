import { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Heart, Star, Eye, GitBranch, ArrowLeft, Search,
  ExternalLink, User, Calendar, MessageCircle, Zap,
  Play, RotateCcw, Share2, ChevronDown, ChevronUp,
  Maximize2, Award, Clock, Info, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchProje(id: string) {
  const r = await fetch(`${BASE}/api/scratch/project/${id}`);
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    const err: any = new Error(data.message || "Proje yüklenemedi");
    err.status = r.status;
    throw err;
  }
  return r.json();
}

function RollingStatValue({ value }: { value: number }) {
  const prefersReducedMotion = useReducedMotion();
  const currentValue = Math.max(0, Math.trunc(value || 0));
  const previousValueRef = useRef(Math.max(0, currentValue - 1));
  const previousValue = previousValueRef.current;

  useEffect(() => {
    previousValueRef.current = currentValue;
  }, [currentValue]);

  const formattedValue = currentValue.toLocaleString("tr-TR");

  if (prefersReducedMotion) return <span aria-hidden="true">{formattedValue}</span>;

  const reelDigits = [0, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

  return (
    <span className="inline-flex items-center tabular-nums" aria-hidden="true">
      {Array.from(formattedValue).map((character, index) => {
        if (!/\d/.test(character)) {
          return <span key={`separator-${index}`}>{character}</span>;
        }

        const digitsAfter = Array.from(formattedValue.slice(index + 1)).filter((next) => /\d/.test(next)).length;
        const placeValue = 10 ** digitsAfter;
        const previousDigit = Math.floor(previousValue / placeValue) % 10;
        const currentDigit = Math.floor(currentValue / placeValue) % 10;
        const previousPosition = 10 - previousDigit;
        const rolledOver = currentValue > previousValue && previousDigit === 9 && currentDigit === 0;
        const currentPosition = rolledOver ? 0 : 10 - currentDigit;

        return (
          <span
            key={`digit-${digitsAfter}`}
            className="inline-flex h-[1em] w-[0.62em] overflow-hidden align-[-0.12em]"
          >
            <motion.span
              initial={{ y: `-${(previousPosition * 100) / reelDigits.length}%` }}
              animate={{ y: `-${(currentPosition * 100) / reelDigits.length}%` }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: Math.min(digitsAfter, 4) * 0.025 }}
              className="inline-flex flex-col leading-none"
            >
              {reelDigits.map((digit, reelIndex) => (
                <span key={reelIndex} className="flex h-[1em] shrink-0 items-center justify-center">
                  {digit}
                </span>
              ))}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}

function StatPill({ ikon: Ikon, deger, renk, etiket, animated = false }: {
  ikon: any;
  deger: string | number;
  renk: string;
  etiket: string;
  animated?: boolean;
}) {
  const formattedValue = typeof deger === "number" ? deger.toLocaleString("tr-TR") : deger;

  return (
    <div className="flex flex-col items-center gap-1 group">
      <div className={cn("flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all",
        "bg-white/[0.06] border border-white/10 hover:border-white/20 hover:bg-white/[0.1] backdrop-blur-md")}
        style={{ color: renk }}>
        <Ikon className="w-3.5 h-3.5" />
        {animated && typeof deger === "number" ? (
          <>
            <span className="sr-only">{formattedValue}</span>
            <RollingStatValue value={deger} />
          </>
        ) : (
          <span>{formattedValue}</span>
        )}
      </div>
      <span className="text-[10px] text-white/40 group-hover:text-white/60 transition-colors">{etiket}</span>
    </div>
  );
}

function OtherProjectCard({ proje, onClick }: { proje: any; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.02, x: 4 }}
      onClick={onClick}
      className="flex gap-3 cursor-pointer group"
    >
      <div className="w-32 sm:w-36 h-20 sm:h-[78px] rounded-xl overflow-hidden shrink-0 relative bg-black/40 border border-white/[0.06] group-hover:border-primary/30 transition-all">
        {proje.thumbnail_url ? (
          <img src={proje.thumbnail_url} alt={proje.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            <Zap className="w-6 h-6 text-primary/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-primary/80 flex items-center justify-center">
            <Play className="w-3 h-3 text-white fill-white" />
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        <h4 className="text-sm font-semibold text-white/90 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {proje.title}
        </h4>
        <div className="mt-1.5 flex flex-col gap-0.5">
          <span className="text-xs text-white/40">@{proje.url?.split("/users/")[1]?.split("/")[0] || "maker"}</span>
          <div className="flex items-center gap-2 text-[11px] text-white/40">
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{(proje.views || 0).toLocaleString("tr-TR")}</span>
            <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-pink-400/60" />{(proje.loves || 0).toLocaleString("tr-TR")}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ProjeDetay() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [aramaInput, setAramaInput] = useState("");
  const [aciklamaAcik, setAciklamaAcik] = useState(false);
  const [notlarAcik, setNotlarAcik] = useState(false);
  const [embedYuklendi, setEmbedYuklendi] = useState(false);
  const [embedBaslandi, setEmbedBaslandi] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { data: proje, isLoading, error } = useQuery({
    queryKey: ["proje", id],
    queryFn: () => fetchProje(id || ""),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  const handleArama = (e: React.FormEvent) => {
    e.preventDefault();
    const v = aramaInput.trim();
    if (v) { setLocation(`/kullanici/${encodeURIComponent(v)}`); setAramaInput(""); }
  };

  const handlePaylasim = () => {
    if (navigator.share) navigator.share({ title: proje?.title, url: window.location.href });
    else navigator.clipboard.writeText(window.location.href);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="w-20 h-20 rounded-full border-4 border-white/5 border-t-primary"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="absolute inset-2 rounded-full border-4 border-white/5 border-t-accent"
          />
        </div>
        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}
          className="text-center">
          <h2 className="text-xl font-display font-bold text-white/80">Proje yükleniyor...</h2>
          <p className="text-sm text-muted-foreground mt-1">#{id}</p>
        </motion.div>
      </div>
    );
  }

  if (error || !proje) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center backdrop-blur-xl bg-white/[0.05] border border-white/10 rounded-3xl p-10">
          <div className="text-5xl mb-4">😵</div>
          <h2 className="text-2xl font-display font-bold mb-2">Proje Bulunamadı</h2>
          <p className="text-muted-foreground mb-6">Bu proje mevcut değil veya Scratch API erişimi kısıtlandı.</p>
          <button onClick={() => setLocation("/")}
            className="px-6 py-3 rounded-xl bg-primary/20 border border-primary/40 text-primary font-semibold hover:bg-primary/30 transition-colors">
            ← Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  const paylasimTarihi = proje.share_date
    ? new Date(proje.share_date).toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ─── Fon Parlamaları ─── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 rounded-full bg-accent/8 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-purple-500/6 blur-[100px]" />
      </div>

      {/* ─── HEADER ─── */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="sticky top-0 z-50 border-b border-white/[0.06] backdrop-blur-2xl bg-background/70"
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          {/* Logo */}
          <button onClick={() => setLocation("/")}
            className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary via-orange-500 to-accent flex items-center justify-center shadow-lg group-hover:shadow-primary/40 transition-shadow">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-sm font-display font-black text-white">Scratch</span>
              <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Stats</span>
            </div>
          </button>

          {/* Geri butonu */}
          {proje.creator?.username && (
            <button
              onClick={() => setLocation(`/kullanici/${proje.creator.username}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/60 hover:text-white transition-all shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden xs:block">@{proje.creator.username}</span>
            </button>
          )}

          {/* Arama */}
          <form onSubmit={handleArama} className="flex-1 max-w-xl mx-auto">
            <div className="relative flex items-center bg-white/[0.05] border border-white/[0.08] focus-within:border-primary/50 focus-within:bg-white/[0.08] rounded-full px-4 py-2 transition-all">
              <Search className="w-4 h-4 text-white/30 mr-2 shrink-0" />
              <input
                value={aramaInput}
                onChange={e => setAramaInput(e.target.value)}
                placeholder="Kullanıcı ara..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/25"
              />
              {aramaInput && (
                <button type="submit" className="ml-2 px-3 py-1 rounded-full bg-primary/80 text-white text-xs font-semibold">
                  Git
                </button>
              )}
            </div>
          </form>

          {/* Paylaş */}
          <button onClick={handlePaylasim}
            className="shrink-0 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
            <Share2 className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </motion.header>

      {/* ─── ANA İÇERİK ─── */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col xl:flex-row gap-5">

          {/* ══ SOL: Oynatıcı + Detaylar ══ */}
          <div className="flex-1 min-w-0">

            {/* Embed Oynatıcı */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative rounded-2xl overflow-hidden bg-black/60 border border-white/[0.08]"
              style={{ boxShadow: "0 0 60px rgba(249,115,22,0.08), 0 0 120px rgba(168,85,247,0.06), 0 25px 50px rgba(0,0,0,0.5)" }}
            >
              {/* Liquid Glass glow border */}
              <div className="absolute inset-0 rounded-2xl pointer-events-none z-10"
                style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.08) 0%, transparent 50%, rgba(168,85,247,0.08) 100%)", backdropFilter: "blur(0px)" }} />

              {/* Başlatma Ekranı */}
              <AnimatePresence>
                {!embedBaslandi && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center"
                    style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.85), rgba(0,0,0,0.95))" }}
                  >
                    {/* Proje Thumbnail */}
                    {proje.thumbnail_url && (
                      <img src={proje.thumbnail_url} alt={proje.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm" />
                    )}
                    <div className="relative z-10 flex flex-col items-center gap-5">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setEmbedBaslandi(true)}
                        className="w-24 h-24 rounded-full flex items-center justify-center relative group"
                        style={{ background: "radial-gradient(circle at 35% 35%, rgba(249,115,22,0.95), rgba(234,88,12,0.8))", boxShadow: "0 0 40px rgba(249,115,22,0.4), 0 0 80px rgba(249,115,22,0.2)" }}
                      >
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
                        <Play className="w-10 h-10 text-white fill-white ml-1 drop-shadow-lg" />
                        <div className="absolute -inset-3 rounded-full border-2 border-primary/30 animate-ping" />
                      </motion.button>
                      <div className="text-center">
                        <h2 className="text-xl sm:text-2xl font-display font-bold text-white drop-shadow-lg line-clamp-2 px-4">
                          {proje.title}
                        </h2>
                        <p className="text-sm text-white/50 mt-1">Bu platformda oynat</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Scratch İframe */}
              <div className="relative aspect-[4/3] sm:aspect-video w-full">
                {embedBaslandi && (
                  <motion.iframe
                    initial={{ opacity: 0 }}
                    animate={{ opacity: embedYuklendi ? 1 : 0.3 }}
                    ref={iframeRef}
                    src={proje.embed_url}
                    onLoad={() => setEmbedYuklendi(true)}
                    allowFullScreen
                    allow="autoplay"
                    className="absolute inset-0 w-full h-full"
                    title={proje.title}
                    style={{ border: "none" }}
                  />
                )}
                {embedBaslandi && !embedYuklendi && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-10 h-10 border-3 border-white/10 border-t-primary rounded-full"
                    />
                  </div>
                )}
                {!embedBaslandi && <div className="aspect-[4/3] sm:aspect-video w-full" />}
              </div>

              {/* Alt Kontrol Çubuğu */}
              {embedBaslandi && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="px-4 py-3 flex items-center justify-between bg-black/40 border-t border-white/[0.06] backdrop-blur-md"
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEmbedBaslandi(false); setEmbedYuklendi(false); }}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                      title="Yeniden Başlat"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs text-white/30">Scratch platformu üzerinde çalışıyor</span>
                  </div>
                  <a
                    href={proje.scratch_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-primary transition-colors"
                  >
                    Scratch'te Aç <ExternalLink className="w-3 h-3" />
                  </a>
                </motion.div>
              )}
            </motion.div>

            {/* Başlık + Paylaşım */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-4"
            >
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-white leading-tight">
                {proje.title}
              </h1>

              {/* İstatistikler */}
              <div className="mt-4 flex flex-wrap gap-3 items-end">
                <StatPill ikon={Eye} deger={proje.views} renk="#60a5fa" etiket="Görüntüleme" animated />
                <StatPill ikon={Heart} deger={proje.loves} renk="#f43f5e" etiket="Beğeni" animated />
                <StatPill ikon={Star} deger={proje.favorites} renk="#fbbf24" etiket="Favori" animated />
                <StatPill ikon={GitBranch} deger={proje.remixes} renk="#34d399" etiket="Remix" animated />
                {proje.comments > 0 && <StatPill ikon={MessageCircle} deger={proje.comments} renk="#a78bfa" etiket="Yorum" />}
                <div className="flex-1" />
                <button onClick={handlePaylasim}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-white/60 hover:text-white transition-all">
                  <Share2 className="w-3.5 h-3.5" /> Paylaş
                </button>
                <a href={proje.scratch_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/15 border border-primary/30 hover:bg-primary/25 text-xs text-primary transition-all font-semibold">
                  <ExternalLink className="w-3.5 h-3.5" /> Scratch'te Aç
                </a>
              </div>

              {/* Ayraç */}
              <div className="mt-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </motion.div>

            {/* Yapımcı Kartı */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 flex items-center gap-4 p-4 rounded-2xl backdrop-blur-xl border transition-all cursor-pointer group"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
                borderColor: "rgba(255,255,255,0.08)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
              onClick={() => proje.creator?.username && setLocation(`/kullanici/${proje.creator.username}`)}
              whileHover={{ scale: 1.01, borderColor: "rgba(249,115,22,0.3)" }}
            >
              <div className="relative shrink-0">
                <img
                  src={proje.creator?.avatar_url || `https://cdn2.scratch.mit.edu/get_image/user/default_60x60.png`}
                  alt={proje.creator?.username}
                  className="w-12 h-12 rounded-full border-2 border-white/10 group-hover:border-primary/40 transition-colors bg-black/40"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <User className="w-2 h-2 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white group-hover:text-primary transition-colors">
                    {proje.creator?.username || "Bilinmiyor"}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">Yapımcı</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                  {paylasimTarihi && (
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {paylasimTarihi}</span>
                  )}
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {proje.views.toLocaleString("tr-TR")} görüntüleme</span>
                </div>
              </div>
              <div className="shrink-0 text-white/20 group-hover:text-primary/60 transition-colors">
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </div>
            </motion.div>

            {/* Talimatlar */}
            {proje.instructions && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-3 rounded-2xl overflow-hidden border border-white/[0.07] backdrop-blur-xl"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)" }}
              >
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
                  onClick={() => setAciklamaAcik(!aciklamaAcik)}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
                    <Info className="w-4 h-4 text-blue-400" />
                    Talimatlar
                  </div>
                  <motion.div animate={{ rotate: aciklamaAcik ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-4 h-4 text-white/30" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {aciklamaAcik && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="px-5 pb-5 text-sm text-white/60 leading-relaxed whitespace-pre-wrap border-t border-white/[0.05]" style={{ paddingTop: 16 }}>
                        {proje.instructions}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Notlar & Emeği Geçenler */}
            {proje.notes && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-3 rounded-2xl overflow-hidden border border-white/[0.07] backdrop-blur-xl"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)" }}
              >
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
                  onClick={() => setNotlarAcik(!notlarAcik)}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
                    <FileText className="w-4 h-4 text-purple-400" />
                    Notlar & Emeği Geçenler
                  </div>
                  <motion.div animate={{ rotate: notlarAcik ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-4 h-4 text-white/30" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {notlarAcik && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="px-5 pb-5 text-sm text-white/60 leading-relaxed whitespace-pre-wrap border-t border-white/[0.05]" style={{ paddingTop: 16 }}>
                        {proje.notes}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Performans Metrikleri */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              {[
                {
                  label: "Beğeni/İzlenme",
                  val: proje.views > 0 ? `%${((proje.loves / proje.views) * 100).toFixed(2)}` : "—",
                  renk: "#f43f5e", ikon: Heart,
                  aciklama: "Dönüşüm oranı"
                },
                {
                  label: "Favori/Beğeni",
                  val: proje.loves > 0 ? `%${((proje.favorites / proje.loves) * 100).toFixed(1)}` : "—",
                  renk: "#fbbf24", ikon: Star,
                  aciklama: "Sadakat oranı"
                },
                {
                  label: "Remix/Görüntüleme",
                  val: proje.views > 0 ? `‰${((proje.remixes / proje.views) * 1000).toFixed(2)}` : "—",
                  renk: "#34d399", ikon: GitBranch,
                  aciklama: "Remix katsayısı"
                },
                {
                  label: "Paylaşım Tarihi",
                  val: paylasimTarihi || "—",
                  renk: "#a78bfa", ikon: Calendar,
                  aciklama: "İlk paylaşım"
                },
              ].map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="p-4 rounded-2xl border backdrop-blur-xl"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
                    borderColor: m.renk + "25",
                    boxShadow: `0 0 20px ${m.renk}08`
                  }}
                >
                  <m.ikon className="w-4 h-4 mb-2" style={{ color: m.renk }} />
                  <div className="text-lg font-display font-bold" style={{ color: m.renk }}>{m.val}</div>
                  <div className="text-xs font-semibold text-white/70 mt-0.5">{m.label}</div>
                  <div className="text-[10px] text-white/30 mt-0.5">{m.aciklama}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* ══ SAĞ: Sidebar ══ */}
          <motion.aside
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="xl:w-96 shrink-0"
          >
            {/* Yapımcı Profil Başlığı */}
            {proje.creator?.username && (
              <div
                className="mb-4 p-4 rounded-2xl border backdrop-blur-xl cursor-pointer group"
                style={{
                  background: "linear-gradient(135deg, rgba(249,115,22,0.06) 0%, rgba(168,85,247,0.06) 100%)",
                  borderColor: "rgba(249,115,22,0.15)",
                  boxShadow: "0 0 30px rgba(249,115,22,0.06)"
                }}
                onClick={() => setLocation(`/kullanici/${proje.creator.username}`)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <img src={proje.creator.avatar_url}
                    className="w-10 h-10 rounded-full border border-primary/30 bg-black/40" alt={proje.creator.username} />
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                      @{proje.creator.username}
                    </div>
                    <div className="text-[10px] text-white/40">Yapımcının tüm analizi için tıkla</div>
                  </div>
                  <div className="ml-auto">
                    <div className="px-2 py-1 rounded-full bg-primary/15 border border-primary/20 text-[10px] text-primary font-semibold">
                      Analiz Et →
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Diğer Popüler Projeler */}
            {proje.other_projects && proje.other_projects.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-4 h-4 text-yellow-400" />
                  <h3 className="font-display font-bold text-sm text-white/80">
                    {proje.creator?.username ? `@${proje.creator.username}` : "Yapımcının"} En Popüler Projeleri
                  </h3>
                </div>
                <div className="space-y-4">
                  {proje.other_projects.map((p: any, i: number) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.04 }}
                    >
                      <OtherProjectCard
                        proje={p}
                        onClick={() => setLocation(`/proje/${p.id}`)}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Alt bilgi */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 p-4 rounded-2xl border border-white/[0.06] backdrop-blur-xl text-center"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-bold text-white/60">ScratchStats</span>
              </div>
              <p className="text-[10px] text-white/30 leading-relaxed">
                Scratch projeleri bu platformda Scratch'in resmi embed sistemi üzerinden oynanır.
              </p>
            </motion.div>
          </motion.aside>

        </div>
      </div>
    </div>
  );
}
