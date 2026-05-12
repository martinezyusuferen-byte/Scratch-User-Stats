import { useRef, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, RadarChart, PolarGrid,
  PolarAngleAxis, Radar, LineChart, Line, AreaChart, Area,
} from "recharts";
import {
  Search, Heart, Eye, Star, Repeat,
  Calendar, CheckCircle, XCircle, TrendingUp, Award,
  Zap, Users, ArrowUpRight, Share2,
  Activity, Target, Shield, Clock, Flame, Cpu,
  Sparkles, Dna, Filter, Gauge,
  BrainCircuit, Rocket, ChevronUp, ChevronDown, Minus,
  BarChart2, Trophy, Lightbulb, Telescope,
  GitBranch, Layers, Map, Crosshair, Radio, Atom,
  Thermometer, Wind, TrendingDown, LifeBuoy, Crown,
  Box, Hexagon, Circle, Triangle, Aperture, Compass,
  Globe, Package, PieChart, Hash, Percent, Calculator,
  BookOpen, Bookmark, Flag, Navigation, Radar as RadarIcon,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { CircularProgress } from "@/components/ui/circular-progress";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useGetScratchUser, useGetScratchUserProjects } from "@workspace/api-client-react";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

function Halka({ oran, renk, etiket }: { oran: number; renk: string; etiket: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
          <circle cx="18" cy="18" r="15" fill="none" stroke={renk} strokeWidth="3"
            strokeDasharray={`${Math.min(100, oran) * 0.942} 94.2`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold" style={{ color: renk }}>{oran}%</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground text-center">{etiket}</span>
    </div>
  );
}

function MiniBar({ deger, maks, renk }: { deger: number; maks: number; renk: string }) {
  const yuzde = maks > 0 ? Math.min(100, (deger / maks) * 100) : 0;
  return (
    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden w-full">
      <motion.div initial={{ width: 0 }} animate={{ width: `${yuzde}%` }}
        transition={{ duration: 1 }} className="h-full rounded-full" style={{ backgroundColor: renk }} />
    </div>
  );
}

function OncelikBadge({ oncelik }: { oncelik: string }) {
  if (oncelik === "yuksek") return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-500/20 text-red-400">Yüksek</span>;
  if (oncelik === "orta") return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-yellow-500/20 text-yellow-400">Orta</span>;
  return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-400">Düşük</span>;
}

function AracKarti({ baslik, deger, alt, ikon: Ikon, renk, aciklama, detay }: {
  baslik: string; deger: string | number; alt?: string;
  ikon: any; renk: string; aciklama?: string; detay?: string;
}) {
  return (
    <GlassCard className="p-4 hover:bg-white/[0.06] transition-all hover:scale-[1.01]">
      <div className="flex items-start justify-between mb-2">
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: renk + "20" }}>
          <Ikon className="w-4 h-4" style={{ color: renk }} />
        </div>
        {alt && <span className="text-[10px] text-muted-foreground">{alt}</span>}
      </div>
      <div className="text-xl font-display font-bold mt-1" style={{ color: renk }}>{deger}</div>
      <div className="text-xs font-semibold text-white/80 mt-0.5">{baslik}</div>
      {aciklama && <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">{aciklama}</p>}
      {detay && <div className="mt-2 px-2 py-1 rounded-md bg-white/5 text-[10px] text-white/60">{detay}</div>}
    </GlassCard>
  );
}

export default function Dashboard() {
  const { username } = useParams<{ username: string }>();
  const [, setLocation] = useLocation();
  const [aramaInput, setAramaInput] = useState("");
  const raporRef = useRef<HTMLDivElement>(null);

  const { data: analiz, isLoading, error } = useGetScratchUser(username || "");
  const { data: projelerData, isLoading: projelerYukleniyor, error: projelerHata } = useGetScratchUserProjects(username || "", { limit: 9 });

  const handleArama = (e: React.FormEvent) => {
    e.preventDefault();
    if (aramaInput.trim()) {
      setLocation(`/kullanici/${encodeURIComponent(aramaInput.trim())}`);
      setAramaInput("");
    }
  };

  const handlePaylasim = () => {
    if (navigator.share) navigator.share({ title: `${username} - Scratch Analizi`, url: window.location.href });
    else navigator.clipboard.writeText(window.location.href);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-16 h-16 border-4 border-white/10 border-t-primary rounded-full" />
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-display font-bold animate-pulse text-white/80">
            {username} analiz ediliyor...
          </h2>
          <p className="text-sm text-muted-foreground mt-2">Veriler toplanıyor, lütfen bekleyin</p>
        </div>
      </div>
    );
  }

  if (error || !analiz) {
    const errData = (error as any)?.data;
    const isRateLimit = (error as any)?.status === 429 || errData?.error === "rate_limited";
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <GlassCard className="max-w-md w-full p-8 text-center" gradient>
          {isRateLimit ? (
            <>
              <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⏳</span>
              </div>
              <h2 className="text-2xl font-display font-bold mb-2 text-yellow-400">Scratch API Meşgul</h2>
              <p className="text-muted-foreground mb-4">Scratch sunucuları şu an çok fazla istek aldı. 1–2 dakika bekleyip tekrar dene.</p>
              <p className="text-xs text-white/30 mb-8">Bu geçici bir durumdur.</p>
            </>
          ) : (
            <>
              <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h2 className="text-2xl font-display font-bold mb-2">Kullanıcı Bulunamadı</h2>
              <p className="text-muted-foreground mb-8">
                "{username}" adlı Scratch profili bulunamadı. Kullanıcı adının doğru yazıldığından emin ol.
              </p>
            </>
          )}
          <div className="flex flex-col gap-3">
            <button onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 transition-colors font-semibold">
              ↻ Tekrar Dene
            </button>
            <button onClick={() => setLocation("/")}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-semibold">
              ← Ana Sayfaya Dön
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  const s = analiz.stats;
  const sc = analiz.score;
  const adv = analiz.advanced;
  const sup = (analiz as any).superlative || {};

  // ── 60 ARAÇ: Gerçek Hesaplamalar ──────────────────────────────────
  const gunBasi = s.days_on_scratch > 0 ? (s.total_views / s.days_on_scratch).toFixed(1) : "0";
  const ayBasi = s.days_on_scratch > 0 ? (s.total_views / (s.days_on_scratch / 30)).toFixed(0) : "0";
  const favBegeniOrani = s.total_loves > 0 ? Math.round((s.total_favorites / s.total_loves) * 100) : 0;
  const etkileşimBaşina = s.total_projects > 0 ? Math.round((s.total_loves + s.total_favorites + s.total_remixes) / s.total_projects) : 0;
  const goruntulemeBasina = s.total_projects > 0 ? Math.round(s.total_views / s.total_projects) : 0;
  const remixOrani = s.total_views > 0 ? (s.total_remixes / s.total_views * 1000).toFixed(2) : "0";
  const tahmini3Ay = Math.round(s.followers * Math.pow(1 + (adv.tahmini_aylik_buyume / 100), 3));
  const tahmini6Ay = Math.round(s.followers * Math.pow(1 + (adv.tahmini_aylik_buyume / 100), 6));
  const tahmini12Ay = Math.round(s.followers * Math.pow(1 + (adv.tahmini_aylik_buyume / 100), 12));
  const icerikVerimliligi = s.total_projects > 0
    ? Math.round((s.total_loves + s.total_favorites) / s.total_projects)
    : 0;
  const takipciProjeBasi = s.total_projects > 0 ? (s.followers / s.total_projects).toFixed(1) : "0";
  const yillar = Math.floor(s.days_on_scratch / 365);
  const gunler = s.days_on_scratch % 365;
  const aktifAy = (analiz.activity?.aylik_projeler || []).filter((m: any) => m.sayi > 0).length;
  const toplam12Ay = (analiz.activity?.aylik_projeler || []).length;
  const aktiflikYuzdesi = toplam12Ay > 0 ? Math.round((aktifAy / toplam12Ay) * 100) : 0;
  const puan = sc.genel;
  const liderlik = puan >= 80 ? "🏆 Top %5" : puan >= 65 ? "⭐ Top %20" : puan >= 50 ? "🔵 Top %40" : "🟢 Gelişmekte";
  const potansiyel = Math.round(
    (s.etkilesim_orani * 4) + (s.love_to_view_ratio * 1000) +
    (s.projects_per_month * 5) + (s.followers > 0 ? Math.log10(s.followers) * 10 : 0)
  );
  const viralKatsayi = s.total_views > 0
    ? ((s.total_loves + s.total_remixes) / s.total_views * 100).toFixed(3)
    : "0";
  const haftaBasiProje = (s.projects_per_month / 4).toFixed(2);
  const hesapGucEndeksi = Math.round(
    (sc.etkilesim * 0.3) + (sc.topluluk * 0.25) + (sc.yaraticilik * 0.25) + (sc.tutarlilik * 0.2)
  );
  const goruntulemeYogYuzdesi = s.total_views > 0 && (sup.proje_tierleri || []).length > 0
    ? (() => {
        const sProje = (sup.proje_tierleri || []).find((t: any) => t.tier === "S");
        return sProje ? sProje.oran : 0;
      })()
    : 0;
  const begeniBirikim = s.total_loves;
  const favoriteBirikim = s.total_favorites;
  const toplamEtkilesim = s.total_loves + s.total_favorites + s.total_remixes;
  const algScore = sup.algoritma_uyumu?.skor || 0;
  const baslikOpt = sup.baslik_optimizasyon?.skor || 0;
  const hayranGuc = sup.hayran_guc_endeksi?.oran || 0;
  const momentumDegisim = sup.proje_momentum?.degisim_yuzdesi || 0;
  const dominantTur = sup.dominant_tur || adv.onerilen_tur || "Genel";
  const kelimeDna = (sup.kelime_dna || []).slice(0, 5).map((k: any) => k.kelime).join(", ") || "—";
  const goruntulemeHizi = s.days_on_scratch > 0
    ? (s.total_views / s.days_on_scratch * 7).toFixed(0)
    : "0";
  const sProjeCount = (sup.proje_tierleri || []).find((t: any) => t.tier === "S")?.sayi || 0;
  const aProjeCount = (sup.proje_tierleri || []).find((t: any) => t.tier === "A")?.sayi || 0;
  const dProjeCount = (sup.proje_tierleri || []).find((t: any) => t.tier === "D")?.sayi || 0;
  const projeBasari = s.total_projects > 0
    ? Math.round(((s.total_projects - dProjeCount) / s.total_projects) * 100)
    : 0;
  const begelenIzlenme = s.total_loves > 0 ? Math.round(s.total_views / s.total_loves) : 0;
  const ortalamaSadakat = favBegeniOrani;
  const buyumeIvmesi = adv.tahmini_aylik_buyume;
  const icerikDensitesi = s.days_on_scratch > 0
    ? (s.total_projects / (s.days_on_scratch / 7)).toFixed(2)
    : "0";
  const kesfedilmeSansi = algScore >= 75 ? "Yüksek" : algScore >= 50 ? "Orta" : algScore >= 30 ? "Düşük" : "Çok Düşük";
  const toplulukGucu = adv.topluluk_etkisi;
  const topProjeLoves = adv.en_iyi_proje?.loves || 0;
  const topProjeViews = adv.en_iyi_proje?.views || 0;
  const topProjeBegeniOrani = topProjeViews > 0 ? ((topProjeLoves / topProjeViews) * 100).toFixed(2) : "0";
  const yorumAcikMi = (analiz.profile as any).comments_allowed !== false ? "✅ Açık" : "🚫 Kapalı";
  const icerikCesitliligi = (sup.icerik_dagilimi || []).filter((k: any) => k.sayi > 0).length;
  const aciklamaKalitesi = sup.basari_dna?.aciklama_olan_oran || 0;
  const basariFormulu = sup.basari_dna?.basari_formulu || "—";
  const buyumeHizi = adv.hesap_yaslanma_hizi;
  const yuzdelikDilim = sup.topluluk_konumlama?.yuzdelik_dilim || "—";
  const goruntulemeKiyasi = sup.topluluk_konumlama?.goruntuleme_kiyasi || 0;
  const begeniKiyasi = sup.topluluk_konumlama?.begeni_kiyasi || 0;
  const prjeKiyasi = sup.topluluk_konumlama?.proje_kiyasi || 0;
  const rekabetUstunlugu = goruntulemeKiyasi >= 2 && begeniKiyasi >= 2 ? "Güçlü Üstünlük" :
    goruntulemeKiyasi >= 1 ? "Ortalamanın Üstü" : "Gelişim Gerekli";

  const radarVerisi = [
    { konu: "Etkileşim", deger: sc.etkilesim },
    { konu: "Yaratıcılık", deger: sc.yaraticilik },
    { konu: "Topluluk", deger: sc.topluluk },
    { konu: "Tutarlılık", deger: sc.tutarlilik },
    { konu: "Büyüme", deger: sc.buyume_potansiyeli },
  ];

  return (
    <div ref={raporRef} className="min-h-screen pb-20">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer group shrink-0" onClick={() => setLocation("/")}>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <span className="font-display font-bold text-base sm:text-xl tracking-tight hidden xs:block">
              Scratch<span className="text-primary">Analiz</span>
            </span>
          </div>
          <form onSubmit={handleArama} className="flex-1 max-w-md mx-auto">
            <div className="relative flex items-center bg-black/20 border border-white/10 focus-within:border-primary/50 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 transition-colors">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground mr-2 shrink-0" />
              <input type="text" value={aramaInput} onChange={(e) => setAramaInput(e.target.value)}
                placeholder="Başka kullanıcı ara..."
                className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-white placeholder:text-white/40" />
            </div>
          </form>
          <button onClick={handlePaylasim}
            className="shrink-0 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10" title="Paylaş">
            <Share2 className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 mt-4 sm:mt-6">
        {(analiz as any).data_quality === "rate_limited" && (
          <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-400">
            <span className="text-xl shrink-0">⏳</span>
            <div>
              <span className="font-semibold">Scratch API geçici olarak yoğun.</span>{" "}
              <span className="text-yellow-400/70">İstatistikler kısmi olabilir. 1–2 dakika bekleyip sayfayı yenile.</span>
            </div>
            <button onClick={() => window.location.reload()} className="ml-auto shrink-0 px-3 py-1 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-xs font-semibold transition-colors">
              Yenile
            </button>
          </div>
        )}

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4 sm:space-y-6">

          {/* ── YT STUDIO ÖZET KARTLARI ── */}
          <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Toplam Görüntüleme", val: s.total_views.toLocaleString("tr-TR"), sub: `${gunBasi}/gün`, bar: "from-blue-500 to-cyan-400", c: "text-blue-400" },
              { label: "Toplam Beğeni", val: s.total_loves.toLocaleString("tr-TR"), sub: `${s.average_loves_per_project} proje başına`, bar: "from-pink-500 to-rose-400", c: "text-pink-400" },
              { label: "Etkileşim Oranı", val: `%${s.etkilesim_orani}`, sub: s.etkilesim_orani >= 5 ? "Mükemmel" : s.etkilesim_orani >= 2 ? "İyi" : "Geliştirilmeli", bar: "from-emerald-500 to-green-400", c: "text-emerald-400" },
              { label: "İçerik Hızı", val: adv.hesap_yaslanma_hizi, sub: `${s.projects_per_month} proje/ay`, bar: "from-purple-500 to-fuchsia-400", c: "text-purple-400" },
            ].map((card, i) => (
              <GlassCard key={i} className="p-4 sm:p-5 overflow-hidden relative">
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.bar}`} />
                <div className="text-xs text-muted-foreground">{card.label}</div>
                <div className={cn("mt-2 text-2xl sm:text-3xl font-display font-bold", card.c)}>{card.val}</div>
                <div className="mt-1 text-xs text-muted-foreground">{card.sub}</div>
              </GlassCard>
            ))}
          </motion.div>

          {/* ── PROFİL + SKOR + RADAR ── */}
          <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Profil */}
            <GlassCard gradient className="md:col-span-4 p-5 sm:p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-primary/20 to-transparent" />
              <img src={analiz.profile.avatar_url} alt={analiz.profile.username}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-background shadow-xl mx-auto relative z-10 bg-black/50" />
              <div className="relative z-10">
                <h1 className="text-2xl sm:text-3xl font-display font-bold mt-3">
                  {analiz.profile.username}
                  {analiz.profile.scratch_team && <Shield className="inline w-5 h-5 text-blue-400 ml-2 mb-1" />}
                </h1>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary/20 text-primary border border-primary/30">
                    {analiz.insights.icerik_turu}
                  </span>
                  <span className={cn("px-2.5 py-1 text-xs font-semibold rounded-full border",
                    analiz.activity.aktif_mi ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30")}>
                    {analiz.activity.aktif_mi ? "🟢 Aktif" : "⚫ Pasif"}
                  </span>
                </div>
                {analiz.profile.bio && (
                  <p className="mt-3 text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">{analiz.profile.bio}</p>
                )}
                {analiz.profile.country && <p className="mt-1 text-xs text-muted-foreground">📍 {analiz.profile.country}</p>}
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
                  <div>
                    <div className="text-lg sm:text-xl font-bold">{s.followers.toLocaleString("tr-TR")}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Takipçi</div>
                  </div>
                  <div className="border-x border-white/10">
                    <div className="text-lg sm:text-xl font-bold">{s.following.toLocaleString("tr-TR")}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Takip</div>
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-bold">{s.total_projects}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Proje</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  <Calendar className="inline w-3 h-3 mr-1" />
                  Katılım: {new Date(analiz.profile.join_date).toLocaleDateString("tr-TR", { year: "numeric", month: "long" })}
                </div>
              </div>
            </GlassCard>

            {/* Skor */}
            <GlassCard className="md:col-span-4 p-5 sm:p-6 flex flex-col items-center">
              <div className="flex justify-between items-center w-full mb-4">
                <h3 className="font-display font-semibold text-base sm:text-lg text-white/80">Genel Skor</h3>
                <span className="text-xl sm:text-2xl">{sc.rutbe_ikonu}</span>
              </div>
              <CircularProgress value={sc.genel} size={140} strokeWidth={11} color="hsl(var(--primary))" />
              <div className="mt-4 text-center">
                <div className="text-xl sm:text-2xl font-display font-bold text-gradient">{sc.rutbe}</div>
                <div className="text-xs text-muted-foreground mt-1">Üreticilerin en iyi %{sc.yuzdeLik}'i</div>
              </div>
              <div className="w-full mt-5 space-y-3">
                {[
                  { etiket: "Etkileşim", deger: sc.etkilesim, renk: "bg-pink-500" },
                  { etiket: "Yaratıcılık", deger: sc.yaraticilik, renk: "bg-purple-500" },
                  { etiket: "Topluluk", deger: sc.topluluk, renk: "bg-blue-500" },
                  { etiket: "Tutarlılık", deger: sc.tutarlilik, renk: "bg-green-500" },
                ].map((sk) => (
                  <div key={sk.etiket}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{sk.etiket}</span>
                      <span className="font-bold">{sk.deger}/100</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${sk.deger}%` }}
                        transition={{ duration: 1, delay: 0.5 }} className={cn("h-full rounded-full", sk.renk)} />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Radar */}
            <GlassCard className="md:col-span-4 p-5 sm:p-6 flex flex-col">
              <h3 className="font-display font-semibold text-base sm:text-lg text-white/80 mb-4">Performans Radarı</h3>
              <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarVerisi}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="konu" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
                    <Radar name="Skor" dataKey="deger" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-white/5 text-center">
                  <div className="text-xs text-muted-foreground">Karşılaştırma</div>
                  <div className="text-sm font-bold text-primary mt-0.5">{adv.karsilastirma_skoru}</div>
                </div>
                <div className="p-2 rounded-lg bg-white/5 text-center">
                  <div className="text-xs text-muted-foreground">Topluluk Etkisi</div>
                  <div className="text-sm font-bold text-accent mt-0.5">{adv.topluluk_etkisi}</div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* ── TEMEL İSTATİSTİKLER ── */}
          <motion.div variants={item}>
            <h2 className="font-display font-bold text-lg sm:text-xl mb-3 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-primary" /> Temel İstatistikler
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { etiket: "Toplam Görüntüleme", deger: s.total_views, ikon: Eye, renk: "text-blue-400", bg: "bg-blue-400/10" },
                { etiket: "Toplam Beğeni", deger: s.total_loves, ikon: Heart, renk: "text-pink-400", bg: "bg-pink-400/10" },
                { etiket: "Favoriler", deger: s.total_favorites, ikon: Star, renk: "text-yellow-400", bg: "bg-yellow-400/10" },
                { etiket: "Toplam Remix", deger: s.total_remixes, ikon: GitBranch, renk: "text-green-400", bg: "bg-green-400/10" },
                { etiket: "Proje/Ay", deger: s.projects_per_month.toFixed(1), ikon: TrendingUp, renk: "text-primary", bg: "bg-primary/10" },
                { etiket: "Gün/Scratch", deger: s.days_on_scratch, ikon: Calendar, renk: "text-violet-400", bg: "bg-violet-400/10" },
              ].map((stat, i) => (
                <GlassCard key={i} className="p-3 sm:p-4 hover:bg-white/[0.06] transition-colors">
                  <div className={cn("p-1.5 rounded-lg w-fit mb-2", stat.bg)}>
                    <stat.ikon className={cn("w-4 h-4", stat.renk)} />
                  </div>
                  <div className="text-lg sm:text-2xl font-bold font-display">
                    {typeof stat.deger === "number" ? stat.deger.toLocaleString("tr-TR") : stat.deger}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{stat.etiket}</div>
                </GlassCard>
              ))}
            </div>
          </motion.div>

          {/* ── DETAYLI METRİKLER ── */}
          <motion.div variants={item}>
            <h2 className="font-display font-bold text-lg sm:text-xl mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" /> Detaylı Metrikler
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Batma Oranı */}
              <GlassCard className="p-5 flex flex-col items-center text-center">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5 self-start">
                  <Flame className="w-4 h-4 text-red-400" /> Batma Oranı
                </h4>
                <Halka oran={s.batma_orani}
                  renk={s.batma_orani > 95 ? "#ef4444" : s.batma_orani > 88 ? "#f97316" : s.batma_orani > 80 ? "#eab308" : "#22c55e"}
                  etiket={s.batma_orani > 95 ? "Kritik" : s.batma_orani > 88 ? "Yüksek" : s.batma_orani > 80 ? "Orta" : "Düşük"} />
                <p className="text-xs text-muted-foreground mt-3">
                  İzleyicilerin <strong className="text-white">{s.batma_orani}%</strong>'i beğenmeden terk ediyor
                </p>
              </GlassCard>

              {/* Etkileşim Oranı */}
              <GlassCard className="p-5">
                <h4 className="font-semibold text-sm mb-4 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-green-400" /> Etkileşim Oranı
                </h4>
                <div className="text-3xl sm:text-4xl font-display font-bold text-green-400 mb-1">%{s.etkilesim_orani}</div>
                <p className="text-xs text-muted-foreground mb-4">(Beğeni + Favori) / Görüntüleme</p>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, s.etkilesim_orani * 10)}%` }}
                    transition={{ duration: 1.2 }} className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" />
                </div>
                <div className="mt-3 text-xs text-muted-foreground">Hedef: <strong className="text-white">%5+</strong></div>
              </GlassCard>

              {/* Takip Oranı */}
              <GlassCard className="p-5">
                <h4 className="font-semibold text-sm mb-4 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-400" /> Takip Oranı
                </h4>
                <div className="text-3xl sm:text-4xl font-display font-bold text-blue-400 mb-1">
                  {s.takip_orani > 99 ? "99+" : s.takip_orani.toFixed(1)}x
                </div>
                <p className="text-xs text-muted-foreground mb-4">Takipçi / Takip Edilen</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-white/5 text-center">
                    <div className="text-sm font-bold">{s.followers.toLocaleString("tr-TR")}</div>
                    <div className="text-[10px] text-muted-foreground">Takipçi</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 text-center">
                    <div className="text-sm font-bold">{s.following.toLocaleString("tr-TR")}</div>
                    <div className="text-[10px] text-muted-foreground">Takip</div>
                  </div>
                </div>
              </GlassCard>

              {/* Hesap Gelişimi */}
              <GlassCard className="p-5">
                <h4 className="font-semibold text-sm mb-4 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-400" /> Hesap Gelişimi
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Scratch'te</span>
                    <span className="font-bold text-sm">{yillar} yıl {gunler} gün</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Büyüme Hızı</span>
                    <span className="font-bold text-sm text-purple-400">{adv.hesap_yaslanma_hizi}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Tahmini Aylık Büyüme</span>
                    <span className="font-bold text-sm text-green-400">+%{adv.tahmini_aylik_buyume}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Günlük Ort. Görüntüleme</span>
                    <span className="font-bold text-sm">{s.gunluk_ortalama_goruntuleme.toLocaleString("tr-TR")}</span>
                  </div>
                </div>
              </GlassCard>

              {/* Proje Kalitesi */}
              <GlassCard className="p-5">
                <h4 className="font-semibold text-sm mb-4 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-yellow-400" /> Proje Kalitesi
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Güçlü Projeler (1K+ görüntüleme)</span>
                      <span className="font-bold text-green-400">%{adv.guclu_proje_orani}</span>
                    </div>
                    <MiniBar deger={adv.guclu_proje_orani} maks={100} renk="#22c55e" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Zayıf Projeler (&lt;100 görüntüleme)</span>
                      <span className="font-bold text-red-400">%{adv.zayif_proje_orani}</span>
                    </div>
                    <MiniBar deger={adv.zayif_proje_orani} maks={100} renk="#ef4444" />
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs text-muted-foreground">Önerilen Proje Türü</span>
                    <span className="font-bold text-xs text-primary">{adv.onerilen_tur}</span>
                  </div>
                </div>
              </GlassCard>

              {/* Remix Analizi */}
              <GlassCard className="p-5">
                <h4 className="font-semibold text-sm mb-4 flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4 text-teal-400" /> Remix Analizi
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Toplam Remix</span>
                    <span className="font-bold">{s.total_remixes.toLocaleString("tr-TR")}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Proje Başına Remix</span>
                    <span className="font-bold">{s.remix_rate.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">1000 görüntülemede remix</span>
                    <span className="font-bold text-teal-400">{adv.remix_edilme_orani}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Remix Oranı (‰)</span>
                    <span className="font-bold text-teal-400">{remixOrani}‰</span>
                  </div>
                </div>
              </GlassCard>
            </div>
          </motion.div>

          {/* ── AKTİVİTE GRAFİĞİ ── */}
          <motion.div variants={item}>
            <GlassCard className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                <h3 className="font-display font-semibold text-base sm:text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" /> Aylık Aktivite (Son 12 Ay)
                </h3>
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Aktif Ay: {aktifAy}/{toplam12Ay}
                </span>
              </div>
              <div className="h-48 sm:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analiz.activity.aylik_projeler} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="ay" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false}
                      tickFormatter={(v) => v.substring(5)} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                    <RechartsTooltip cursor={{ fill: "rgba(255,255,255,0.04)" }}
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(v: any) => [`${v} proje`, "Paylaşım"]} />
                    <Bar dataKey="sayi" radius={[4, 4, 0, 0]}>
                      {analiz.activity.aylik_projeler.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.sayi > 0 ? "hsl(var(--primary))" : "rgba(255,255,255,0.06)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </motion.div>

          {/* ══════════════════════════════════════════════════════════════════
               60 ANALİTİK ARAÇ — Gerçek Hesaplamalar
          ══════════════════════════════════════════════════════════════════ */}

          {/* Kategori 1: Büyüme & Tahmin */}
          <motion.div variants={item}>
            <h2 className="font-display font-bold text-lg sm:text-xl mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span className="text-gradient">Büyüme & Tahmin Araçları</span>
              <span className="text-xs text-muted-foreground font-normal ml-1">(10 araç)</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <AracKarti baslik="3 Ay Sonra Takipçi" deger={tahmini3Ay.toLocaleString("tr-TR")} ikon={TrendingUp}
                renk="#22c55e" aciklama="Mevcut büyüme hızına göre projeksiyon" />
              <AracKarti baslik="6 Ay Sonra Takipçi" deger={tahmini6Ay.toLocaleString("tr-TR")} ikon={Rocket}
                renk="#10b981" aciklama="Bileşik büyüme modeli" />
              <AracKarti baslik="12 Ay Sonra Takipçi" deger={tahmini12Ay.toLocaleString("tr-TR")} ikon={Globe}
                renk="#059669" aciklama="1 yıllık büyüme tahmini" />
              <AracKarti baslik="Aylık Büyüme Hızı" deger={`+%${adv.tahmini_aylik_buyume}`} ikon={ChevronUp}
                renk="#34d399" aciklama="Etkileşim + paylaşım hızı kombinasyonu" />
              <AracKarti baslik="Viral Katsayısı" deger={viralKatsayi} ikon={Zap}
                renk="#f59e0b" alt="‰" aciklama="(Beğeni + Remix) / Görüntüleme × 100" />
              <AracKarti baslik="Haftalık Proje Hızı" deger={haftaBasiProje} ikon={Activity}
                renk="#6366f1" alt="proje/hafta" aciklama="Ortalama haftalık yayın hızın" />
              <AracKarti baslik="İçerik Yoğunluğu" deger={`${icerikDensitesi}`} ikon={Layers}
                renk="#8b5cf6" alt="proje/hafta" aciklama="Scratch hayatın boyunca haftalık yayın ortalaması" />
              <AracKarti baslik="Büyüme İvmesi" deger={buyumeIvmesi > 5 ? "🚀 Hızlı" : buyumeIvmesi > 2 ? "📈 Stabil" : "🐢 Yavaş"} ikon={Navigation}
                renk="#a78bfa" aciklama={`Aylık %${buyumeIvmesi} büyüme hızı`} />
              <AracKarti baslik="Hesap Güç Endeksi" deger={`${hesapGucEndeksi}/100`} ikon={Trophy}
                renk="#f97316" aciklama="Etkileşim + Topluluk + Yaratıcılık + Tutarlılık" />
              <AracKarti baslik="Topluluk Liderliği" deger={liderlik} ikon={Crown}
                renk="#fbbf24" aciklama="Scratch üreticileri arasındaki konumun" />
            </div>
          </motion.div>

          {/* Kategori 2: Proje Performans */}
          <motion.div variants={item}>
            <h2 className="font-display font-bold text-lg sm:text-xl mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              <span className="text-gradient">Proje Performans Araçları</span>
              <span className="text-xs text-muted-foreground font-normal ml-1">(10 araç)</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <AracKarti baslik="Proje Başına Görüntüleme" deger={goruntulemeBasina.toLocaleString("tr-TR")} ikon={Eye}
                renk="#3b82f6" aciklama="Ortalama proje görüntüleme sayısı" />
              <AracKarti baslik="Proje Başına Etkileşim" deger={etkileşimBaşina} ikon={Heart}
                renk="#ec4899" aciklama="(Beğeni + Fav + Remix) / Proje sayısı" />
              <AracKarti baslik="Beğeni Dönüşüm Oranı" deger={`%${(s.love_to_view_ratio * 100).toFixed(2)}`} ikon={Percent}
                renk="#f43f5e" aciklama="Her 100 görüntülemede beğeni sayısı" />
              <AracKarti baslik="Favori Dönüşüm Oranı" deger={`%${favBegeniOrani}`} ikon={Bookmark}
                renk="#f59e0b" aciklama="Beğenenlerin kaçı favoriledî" />
              <AracKarti baslik="Proje Başarı Oranı" deger={`%${projeBasari}`} ikon={CheckCircle}
                renk="#22c55e" aciklama="Düşük performanslı olmayan projelerin oranı" />
              <AracKarti baslik="En İyi Proje Oran" deger={`%${topProjeBegeniOrani}`} ikon={Star}
                renk="#eab308" alt="beğeni/görüntüleme"
                aciklama={adv.en_iyi_proje ? `"${adv.en_iyi_proje.title.substring(0, 20)}…" projesi` : "Veri yok"}
                detay={adv.en_iyi_proje ? `${topProjeLoves.toLocaleString("tr-TR")} beğeni` : ""} />
              <AracKarti baslik="S-Tier Proje Sayısı" deger={`${sProjeCount} proje`} ikon={Trophy}
                renk="#ffd700" aciklama="Efsane sınıf (S-Tier) proje sayısı" />
              <AracKarti baslik="A-Tier Proje Sayısı" deger={`${aProjeCount} proje`} ikon={Award}
                renk="#ff6b35" aciklama="Mükemmel sınıf (A-Tier) proje sayısı" />
              <AracKarti baslik="Verimlilik Skoru" deger={`${s.verimlilik_skoru}/100`} ikon={Gauge}
                renk="#06b6d4" aciklama="(Beğeni + Fav) / Proje sayısı × normalize" />
              <AracKarti baslik="1 Beğeni Başına İzlenme" deger={`${begelenIzlenme}x`} ikon={Calculator}
                renk="#8b5cf6" aciklama="Her beğeni için kaç görüntüleme gerekiyor" />
            </div>
          </motion.div>

          {/* Kategori 3: İçerik Strateji */}
          <motion.div variants={item}>
            <h2 className="font-display font-bold text-lg sm:text-xl mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-orange-400" />
              <span className="text-gradient">İçerik Strateji Araçları</span>
              <span className="text-xs text-muted-foreground font-normal ml-1">(10 araç)</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <AracKarti baslik="Dominant İçerik Türü" deger={dominantTur} ikon={Layers}
                renk="#06b6d4" aciklama="Proje başlıklarından tespit edilen ana tür" />
              <AracKarti baslik="İçerik Çeşitliliği" deger={`${icerikCesitliligi} kategori`} ikon={Filter}
                renk="#8b5cf6" aciklama="Kaç farklı içerik kategorisinde proje var" />
              <AracKarti baslik="Kelime DNA" deger={kelimeDna} ikon={Dna}
                renk="#a855f7" aciklama="En sık geçen anahtar kelimeler" />
              <AracKarti baslik="Başlık Optimizasyon" deger={`${baslikOpt}/100`} ikon={Flag}
                renk="#84cc16" aciklama="Başlıkların keşfedilebilirlik puanı"
                detay={sup.baslik_optimizasyon?.seviye || ""} />
              <AracKarti baslik="Açıklama Kalitesi" deger={`%${aciklamaKalitesi}`} ikon={BookOpen}
                renk="#22d3ee" aciklama="En iyi projelerde açıklama bulunanların oranı" />
              <AracKarti baslik="Başarı Formülü" deger={basariFormulu} ikon={BrainCircuit}
                renk="#f472b6" aciklama="En iyi projelerin ortak özelliği" />
              <AracKarti baslik="İçerik Tutarlılığı" deger={analiz.insights.icerik_tutarliligi} ikon={CheckCircle}
                renk="#34d399" aciklama={`Aylık ${s.projects_per_month} proje hızına göre`} />
              <AracKarti baslik="En İyi Paylaşım Zamanı" deger="Cum–Cts 17–21" ikon={Clock}
                renk="#60a5fa" aciklama="Scratch kullanıcı trafiği zirve saatleri" />
              <AracKarti baslik="Büyüme Trendi" deger={analiz.insights.buyume_trendi} ikon={TrendingUp}
                renk="#4ade80" aciklama="Son 3 ay vs önceki 3 ay karşılaştırması" />
              <AracKarti baslik="Proje Türü Önerisi" deger={adv.onerilen_tur} ikon={Lightbulb}
                renk="#fb923c" aciklama="Etkileşim verilerine göre en iyi tür" />
            </div>
          </motion.div>

          {/* Kategori 4: Topluluk & Ağ */}
          <motion.div variants={item}>
            <h2 className="font-display font-bold text-lg sm:text-xl mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-gradient">Topluluk & Ağ Araçları</span>
              <span className="text-xs text-muted-foreground font-normal ml-1">(10 araç)</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <AracKarti baslik="Topluluk Konumu" deger={yuzdelikDilim} ikon={Map}
                renk="#3b82f6" aciklama="Tüm Scratch yapımcıları arasındaki yüzdelik dilim" />
              <AracKarti baslik="Hayran Sadakat Endeksi" deger={`%${ortalamaSadakat}`} ikon={Heart}
                renk="#f43f5e" aciklama="Favori/Beğeni oranı — sadık hayran göstergesi"
                detay={sup.hayran_guc_endeksi?.seviye || ""} />
              <AracKarti baslik="Görüntüleme Rekabeti" deger={`${goruntulemeKiyasi}x`} ikon={Telescope}
                renk="#8b5cf6" aciklama="Ortalama Scratch kullanıcısına kıyasla görüntüleme" />
              <AracKarti baslik="Beğeni Rekabeti" deger={`${begeniKiyasi}x`} ikon={Heart}
                renk="#ec4899" aciklama="Ortalama Scratch kullanıcısına kıyasla beğeni" />
              <AracKarti baslik="Proje Rekabeti" deger={`${prjeKiyasi}x`} ikon={Package}
                renk="#06b6d4" aciklama="Ortalama Scratch kullanıcısına kıyasla proje sayısı" />
              <AracKarti baslik="Rekabet Üstünlüğü" deger={rekabetUstunlugu} ikon={Crosshair}
                renk="#f59e0b" aciklama="Görüntüleme + beğeni rekabet analizi" />
              <AracKarti baslik="Takipçi / Proje Verimi" deger={`${takipciProjeBasi}`} ikon={Users}
                renk="#34d399" aciklama="Her proje başına ortalama takipçi kazanımı" />
              <AracKarti baslik="Aktivasyon Yüzdesi" deger={`%${aktiflikYuzdesi}`} ikon={Radio}
                renk="#a78bfa" aciklama={`Son 12 ayın ${aktifAy} ayı aktif geçirildi`} />
              <AracKarti baslik="Yorum Durumu" deger={yorumAcikMi} ikon={Atom}
                renk="#22d3ee" aciklama="Projelerde yorum açık/kapalı durumu" />
              <AracKarti baslik="Topluluk Gücü" deger={toplulukGucu} ikon={Globe}
                renk="#60a5fa" aciklama="Topluluk skoru 100 üzerinden kategorisi" />
            </div>
          </motion.div>

          {/* Kategori 5: Platform & Algoritma */}
          <motion.div variants={item}>
            <h2 className="font-display font-bold text-lg sm:text-xl mb-4 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <span className="text-gradient">Platform & Algoritma Araçları</span>
              <span className="text-xs text-muted-foreground font-normal ml-1">(10 araç)</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <AracKarti baslik="Algoritma Uyum Skoru" deger={`${algScore}/100`} ikon={Cpu}
                renk="#6366f1" aciklama="Scratch Keşfet algoritmasına uyumluluk"
                detay={sup.algoritma_uyumu?.durum || ""} />
              <AracKarti baslik="Keşfedilme Şansı" deger={kesfedilmeSansi} ikon={Telescope}
                renk="#8b5cf6" aciklama="Keşfet sayfasına çıkma olasılığı" />
              <AracKarti baslik="Algoritma İyileştirme" deger={sup.algoritma_uyumu?.iyilestirme?.substring(0, 30) || "—"} ikon={Rocket}
                renk="#a78bfa" aciklama="En kritik algoritma iyileştirme aksiyonu" />
              <AracKarti baslik="Viral Potansiyel" deger={`${sup.viral_potansiyel?.skor || 0}/100`} ikon={Zap}
                renk="#f97316" aciklama="Beğeni hızı × Remix çarpanı × Etkileşim"
                detay={sup.viral_potansiyel?.seviye || ""} />
              <AracKarti baslik="Haftalık Görüntüleme" deger={goruntulemeHizi} ikon={Eye}
                renk="#3b82f6" alt="görüntüleme/hafta" aciklama="Tüm zamanları haftaya bölerek hesaplandı" />
              <AracKarti baslik="Proje Momentumu" deger={momentumDegisim > 0 ? `+%${momentumDegisim}` : `%${momentumDegisim}`} ikon={momentumDegisim >= 0 ? ChevronUp : ChevronDown}
                renk={momentumDegisim >= 0 ? "#22c55e" : "#ef4444"}
                aciklama="Son projeler vs. eski projeler beğeni farkı"
                detay={sup.proje_momentum?.yorum || ""} />
              <AracKarti baslik="İçerik Momentum" deger={analiz.insights.buyume_trendi} ikon={TrendingUp}
                renk="#34d399" aciklama="Son 3 aylık aktivite trendi" />
              <AracKarti baslik="Görüntüleme Yoğunluğu" deger={`%${goruntulemeYogYuzdesi}`} ikon={Hexagon}
                renk="#f59e0b" alt="S-Tier" aciklama="Görüntülemelerin S-Tier projelerde yoğunlaşma oranı" />
              <AracKarti baslik="Aylık Görüntüleme" deger={parseInt(ayBasi).toLocaleString("tr-TR")} ikon={BarChart2}
                renk="#60a5fa" aciklama="Tüm projelerin toplam aylık görüntüleme ortalaması" />
              <AracKarti baslik="Potansiyel Skor" deger={`${Math.min(100, potansiyel)}/100`} ikon={Sparkles}
                renk="#fbbf24" aciklama="Etkileşim + büyüme hızı + takipçi logu bileşik skoru" />
            </div>
          </motion.div>

          {/* Kategori 6: Derinlemesine İleri Analiz */}
          <motion.div variants={item}>
            <h2 className="font-display font-bold text-lg sm:text-xl mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-400" />
              <span className="text-gradient">Derinlemesine İleri Analiz Araçları</span>
              <span className="text-xs text-muted-foreground font-normal ml-1">(10 araç)</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <AracKarti baslik="Toplam Etkileşim" deger={toplamEtkilesim.toLocaleString("tr-TR")} ikon={Activity}
                renk="#ec4899" aciklama="Beğeni + Favori + Remix toplamı" />
              <AracKarti baslik="İçerik Verimliliği" deger={icerikVerimliligi} ikon={Triangle}
                renk="#f43f5e" alt="etkileşim/proje" aciklama="(Beğeni + Fav) proje başına ortalama" />
              <AracKarti baslik="Günlük Ort. Görüntüleme" deger={gunBasi} ikon={Clock}
                renk="#3b82f6" alt="görüntüleme/gün" aciklama="Toplam görüntüleme / Scratch'te geçirilen gün" />
              <AracKarti baslik="Beğeni Birikimi" deger={begeniBirikim.toLocaleString("tr-TR")} ikon={Heart}
                renk="#f43f5e" aciklama="Tüm zamanların kümülatif beğeni sayısı" />
              <AracKarti baslik="Favori Birikimi" deger={favoriteBirikim.toLocaleString("tr-TR")} ikon={Star}
                renk="#eab308" aciklama="Tüm zamanların kümülatif favori sayısı" />
              <AracKarti baslik="Proje Başarı Oranı" deger={`%${projeBasari}`} ikon={Circle}
                renk="#22c55e" aciklama="Düşük performanslı olmayan projelerin yüzdesi" />
              <AracKarti baslik="Hesap Olgunluk" deger={`${yillar}y ${gunler}g`} ikon={Aperture}
                renk="#a78bfa" aciklama="Scratch'e katılım üzerinden geçen süre" />
              <AracKarti baslik="Aktivite Serisi" deger={`${analiz.activity.aktivite_serisi} ay`} ikon={Flame}
                renk="#f97316" aciklama="Son 12 ayda aktif olunan tahmini ay sayısı" />
              <AracKarti baslik="Karşılaştırma Skor" deger={adv.karsilastirma_skoru} ikon={Compass}
                renk="#06b6d4" aciklama="Tüm yapımcılara göre genel sıralama" />
              <AracKarti baslik="İçerik Hızı Etiketi" deger={buyumeHizi} ikon={Wind}
                renk="#34d399" aciklama="Proje paylaşım sıklığına göre hesap tipi" />
            </div>
          </motion.div>

          {/* ── DEDİKÇE DAHA DERİN: 12 SÜPER ÖZELLİK ── */}
          {sup && Object.keys(sup).length > 0 && (
            <motion.div variants={item}>
              <h2 className="font-display font-bold text-lg sm:text-xl mb-4 flex items-center gap-2">
                <Atom className="w-5 h-5 text-yellow-400" /> Scratch'in Yapamadığı 12 Analiz
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                {sup.viral_potansiyel && (
                  <GlassCard className="p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-bl-full" />
                    <h4 className="font-semibold text-sm mb-4 flex items-center gap-1.5">
                      <Rocket className="w-4 h-4 text-orange-400" /> Viral Potansiyel Motoru
                    </h4>
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-20 shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                          <circle cx="18" cy="18" r="15" fill="none"
                            stroke={sup.viral_potansiyel.skor >= 75 ? "#f97316" : sup.viral_potansiyel.skor >= 55 ? "#eab308" : "#6366f1"}
                            strokeWidth="3" strokeDasharray={`${sup.viral_potansiyel.skor * 0.942} 94.2`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-base font-bold">{sup.viral_potansiyel.skor}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-orange-400 text-sm mb-1">{sup.viral_potansiyel.seviye}</div>
                        {(sup.viral_potansiyel.faktorler || []).map((f: string, i: number) => (
                          <div key={i} className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <div className="w-1 h-1 rounded-full bg-orange-400/60 shrink-0" /> {f}
                          </div>
                        ))}
                      </div>
                    </div>
                  </GlassCard>
                )}

                {sup.kelime_dna && sup.kelime_dna.length > 0 && (
                  <GlassCard className="p-5">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                      <Dna className="w-4 h-4 text-purple-400" /> İçerik Kelime DNA'sı
                    </h4>
                    <p className="text-[10px] text-muted-foreground mb-3">Proje başlıklarında en çok geçen kelimeler</p>
                    <div className="flex flex-wrap gap-1.5">
                      {sup.kelime_dna.map((k: { kelime: string; sayi: number }, i: number) => {
                        const boyut = i === 0 ? "text-base font-black" : i < 3 ? "text-sm font-bold" : i < 6 ? "text-xs font-semibold" : "text-[10px]";
                        const stil = i === 0 ? "bg-purple-500/30 text-purple-300" : i < 3 ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-white/60";
                        return (
                          <span key={i} className={cn("px-2 py-1 rounded-full border border-white/10", boyut, stil)}>
                            {k.kelime} <span className="opacity-60 text-[9px]">×{k.sayi}</span>
                          </span>
                        );
                      })}
                    </div>
                  </GlassCard>
                )}

                {sup.icerik_dagilimi && sup.icerik_dagilimi.length > 0 && (
                  <GlassCard className="p-5">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                      <Filter className="w-4 h-4 text-cyan-400" /> İçerik Kategori Dağılımı
                    </h4>
                    <p className="text-[10px] text-muted-foreground mb-2">Dominant Tür: <strong className="text-white">{sup.dominant_tur}</strong></p>
                    <div className="space-y-2">
                      {sup.icerik_dagilimi.map((k: { kategori: string; sayi: number; oran: number }, i: number) => {
                        const renkler = ["bg-cyan-500", "bg-violet-500", "bg-pink-500", "bg-amber-500", "bg-teal-500", "bg-slate-500"];
                        return (
                          <div key={i}>
                            <div className="flex justify-between text-[10px] mb-0.5">
                              <span className="text-muted-foreground">{k.kategori}</span>
                              <span className="font-bold">{k.sayi} proje (%{k.oran})</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/5">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${k.oran}%` }}
                                transition={{ duration: 0.8, delay: i * 0.1 }}
                                className={cn("h-full rounded-full", renkler[i % renkler.length])} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </GlassCard>
                )}

                {sup.etkilesim_hunisi && (
                  <GlassCard className="p-5">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-green-400" /> Etkileşim Şelale Hunisi
                    </h4>
                    <p className="text-[10px] text-muted-foreground mb-3">Her aşamada kaç kişi devam ediyor?</p>
                    {[
                      { etiket: "👁 Görüntüleme", oran: 100, renk: "bg-blue-500" },
                      { etiket: "❤ Beğeni", oran: sup.etkilesim_hunisi.begeni_orani, renk: "bg-pink-500" },
                      { etiket: "⭐ Favori", oran: sup.etkilesim_hunisi.favori_orani, renk: "bg-yellow-500" },
                      { etiket: "🔁 Remix", oran: sup.etkilesim_hunisi.remix_orani, renk: "bg-teal-500" },
                    ].map((h, i) => (
                      <div key={i} className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] text-muted-foreground w-20 shrink-0">{h.etiket}</span>
                        <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, h.oran)}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                            className={cn("h-full rounded-full", h.renk)} />
                        </div>
                        <span className="text-[10px] font-bold w-12 text-right">{typeof h.oran === "number" ? h.oran.toFixed(1) : h.oran}%</span>
                      </div>
                    ))}
                  </GlassCard>
                )}

                {sup.proje_tierleri && (
                  <GlassCard className="p-5">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-yellow-400" /> Proje Tier Sınıflaması
                    </h4>
                    <p className="text-[10px] text-muted-foreground mb-3">S (efsane) → D (düşük) sistemi</p>
                    <div className="flex gap-2 flex-wrap">
                      {sup.proje_tierleri.filter((t: any) => t.sayi > 0).map((t: any) => (
                        <div key={t.tier} className="flex flex-col items-center gap-1 flex-1 min-w-[40px]">
                          <div className="text-xs font-black px-3 py-1 rounded-lg border"
                            style={{ color: t.renk, borderColor: t.renk + "50", backgroundColor: t.renk + "15" }}>
                            {t.tier}
                          </div>
                          <span className="text-base font-bold">{t.sayi}</span>
                          <span className="text-[10px] text-muted-foreground">%{t.oran}</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {sup.buyume_projeksiyonu && (
                  <GlassCard className="p-5">
                    <h4 className="font-semibold text-sm mb-1 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-400" /> Büyüme Projeksiyonu
                    </h4>
                    <p className="text-[10px] text-muted-foreground mb-3">Büyüme Hızı: <strong className="text-white">{sup.buyume_hizi_etiketi}</strong></p>
                    <div className="space-y-2">
                      {sup.buyume_projeksiyonu.map((p: { ay: string; tahmini_takipci: number }, i: number) => (
                        <div key={i} className="flex justify-between items-center bg-white/5 rounded-lg px-3 py-2">
                          <span className="text-xs text-muted-foreground">{p.ay} sonra</span>
                          <span className="font-bold text-emerald-400 text-sm">~{p.tahmini_takipci.toLocaleString("tr-TR")} takipçi</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {sup.basari_dna && (
                  <GlassCard className="p-5">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                      <BrainCircuit className="w-4 h-4 text-pink-400" /> Başarı DNA'sı
                    </h4>
                    <p className="text-[10px] text-muted-foreground mb-3">En iyi 5 projenin ortak özellikleri</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Ort. Başlık Uzunluğu</span>
                        <span className="font-bold">{sup.basari_dna.ortalama_baslik_uzunlugu} karakter</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Ort. Açıklama Uzunluğu</span>
                        <span className="font-bold">{sup.basari_dna.ortalama_aciklama_uzunlugu} karakter</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Açıklama Olan Proje</span>
                        <span className="font-bold text-green-400">%{sup.basari_dna.aciklama_olan_oran}</span>
                      </div>
                    </div>
                    <div className="mt-3 bg-pink-500/10 border border-pink-500/20 rounded-lg p-2.5">
                      <div className="text-[10px] font-bold text-pink-400 mb-1">🔑 Başarı Formülü</div>
                      <div className="text-xs text-white/80">{sup.basari_dna.basari_formulu}</div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">💡 {sup.basari_dna.ipucu}</p>
                  </GlassCard>
                )}

                {sup.hayran_guc_endeksi && (
                  <GlassCard className="p-5">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-rose-400" /> Hayran Güç Endeksi
                    </h4>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-display font-black text-rose-400">%{sup.hayran_guc_endeksi.oran}</div>
                      <div>
                        <div className="font-bold text-sm">{sup.hayran_guc_endeksi.seviye}</div>
                        <div className="text-[10px] text-muted-foreground">Favori/Beğeni Oranı</div>
                      </div>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/5">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, sup.hayran_guc_endeksi.oran)}%` }}
                        transition={{ duration: 1.2 }} className="h-full rounded-full bg-gradient-to-r from-rose-600 to-pink-400" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3">{sup.hayran_guc_endeksi.aciklama}</p>
                  </GlassCard>
                )}

                {sup.algoritma_uyumu && (
                  <GlassCard className="p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl" />
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-indigo-400" /> Scratch Algoritma Uyumu
                    </h4>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-3xl font-display font-black text-indigo-400">{sup.algoritma_uyumu.skor}/100</div>
                      <div className="flex-1">
                        <div className="text-xs font-bold">{sup.algoritma_uyumu.durum}</div>
                        <div className="h-1.5 rounded-full bg-white/5 mt-1">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${sup.algoritma_uyumu.skor}%` }}
                            transition={{ duration: 1 }} className="h-full rounded-full bg-indigo-500" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-2.5">
                      <div className="text-[10px] font-bold text-indigo-400 mb-1">🎯 İyileştirme</div>
                      <div className="text-xs">{sup.algoritma_uyumu.iyilestirme}</div>
                    </div>
                  </GlassCard>
                )}

                {sup.proje_momentum && (
                  <GlassCard className="p-5">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-amber-400" /> Proje Momentum
                    </h4>
                    <p className="text-[10px] text-muted-foreground mb-3">Son projeler vs. eski projeler</p>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-white/5 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-muted-foreground">Yeni Proje Ort.</div>
                        <div className="text-sm font-bold text-amber-400">{sup.proje_momentum.yeni_proje_ort_begeni} ❤</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-muted-foreground">Eski Proje Ort.</div>
                        <div className="text-sm font-bold">{sup.proje_momentum.eski_proje_ort_begeni} ❤</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {sup.proje_momentum.degisim_yuzdesi > 0
                        ? <ChevronUp className="w-4 h-4 text-green-400" />
                        : sup.proje_momentum.degisim_yuzdesi < 0
                        ? <ChevronDown className="w-4 h-4 text-red-400" />
                        : <Minus className="w-4 h-4 text-gray-400" />}
                      <span className={cn("font-bold text-sm",
                        sup.proje_momentum.degisim_yuzdesi > 0 ? "text-green-400" :
                        sup.proje_momentum.degisim_yuzdesi < 0 ? "text-red-400" : "text-gray-400")}>
                        %{Math.abs(sup.proje_momentum.degisim_yuzdesi)} fark
                      </span>
                      <span className="text-xs text-muted-foreground">{sup.proje_momentum.yorum}</span>
                    </div>
                  </GlassCard>
                )}

                {sup.topluluk_konumlama && (
                  <GlassCard className="p-5">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-teal-400" /> Topluluk Konumlandırması
                    </h4>
                    <div className="text-center mb-3">
                      <div className="inline-block px-4 py-1.5 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 font-bold text-sm">
                        {sup.topluluk_konumlama.yuzdelik_dilim}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[
                        { etiket: "Proje sayısı", kiyasi: sup.topluluk_konumlama.proje_kiyasi },
                        { etiket: "Görüntüleme", kiyasi: sup.topluluk_konumlama.goruntuleme_kiyasi },
                        { etiket: "Beğeni", kiyasi: sup.topluluk_konumlama.begeni_kiyasi },
                      ].map((k, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{k.etiket}</span>
                          <span className={cn("font-bold", (k.kiyasi || 0) >= 2 ? "text-green-400" : "text-white")}>
                            Ort. × {k.kiyasi}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3 bg-white/5 rounded-lg p-2">{sup.topluluk_konumlama.ozet}</p>
                  </GlassCard>
                )}

                {sup.baslik_optimizasyon && (
                  <GlassCard className="p-5">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4 text-lime-400" /> Başlık Optimizasyon Skoru
                    </h4>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-4xl font-display font-black text-lime-400">{sup.baslik_optimizasyon.skor}</div>
                      <div>
                        <div className={cn("text-sm font-bold",
                          sup.baslik_optimizasyon.seviye === "Mükemmel" ? "text-green-400" :
                          sup.baslik_optimizasyon.seviye === "İyi" ? "text-lime-400" :
                          sup.baslik_optimizasyon.seviye === "Orta" ? "text-yellow-400" : "text-red-400")}>
                          {sup.baslik_optimizasyon.seviye}
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 mt-1 w-24">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${sup.baslik_optimizasyon.skor}%` }}
                            transition={{ duration: 1 }} className="h-full rounded-full bg-lime-500" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-lime-500/10 border border-lime-500/20 rounded-lg p-2.5">
                      <div className="text-[10px] font-bold text-lime-400 mb-1">💡 Tavsiye</div>
                      <div className="text-xs">{sup.baslik_optimizasyon.ipucu}</div>
                    </div>
                  </GlassCard>
                )}

              </div>
            </motion.div>
          )}

          {/* ── GÜÇLÜ / GELİŞTİRİLECEK ── */}
          <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassCard className="p-5 border-green-500/20">
              <h3 className="font-display font-semibold text-base flex items-center gap-2 mb-4 text-green-400">
                <CheckCircle className="w-5 h-5" /> Güçlü Yönler
              </h3>
              <ul className="space-y-2.5">
                {analiz.insights.guclu_yonler.map((str: string, i: number) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                    <span className="text-white/90">{str}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
            <GlassCard className="p-5 border-red-500/20">
              <h3 className="font-display font-semibold text-base flex items-center gap-2 mb-4 text-red-400">
                <XCircle className="w-5 h-5" /> Geliştirilecek Yönler
              </h3>
              <ul className="space-y-2.5">
                {analiz.insights.gelistirilecek_yonler.map((weak: string, i: number) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    <span className="text-white/90">{weak}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </motion.div>

          {/* ── BÜYÜME ÖNERİLERİ ── */}
          <motion.div variants={item}>
            <h2 className="font-display font-bold text-lg sm:text-xl mb-4 mt-2 flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-primary" /> Büyüme Önerileri
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {analiz.insights.buyume_onerileri.map((ipucu: any, i: number) => (
                <GlassCard key={i} className="p-4 sm:p-5 flex flex-col border-white/5 hover:border-accent/40 transition-colors">
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-accent">{ipucu.kategori}</span>
                    <OncelikBadge oncelik={ipucu.oncelik} />
                  </div>
                  <p className="text-white font-medium text-sm mb-4 leading-relaxed">{ipucu.oneri}</p>
                  <div className="mt-auto bg-white/5 rounded-lg p-3 text-xs text-muted-foreground border border-white/5">
                    <strong className="text-white/70 block mb-1">Beklenen Etki:</strong> {ipucu.etki}
                  </div>
                </GlassCard>
              ))}
            </div>
          </motion.div>

          {/* ── EN İYİ PROJELER ── */}
          <motion.div variants={item} className="pb-10">
            <div className="flex justify-between items-end mb-4 mt-2">
              <h2 className="font-display font-bold text-lg sm:text-xl flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" /> En İyi Projeler
              </h2>
              <a href={`https://scratch.mit.edu/users/${username}/#projects`} target="_blank" rel="noreferrer"
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                Tümünü Gör <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
            {projelerYukleniyor ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                {[1, 2, 3].map((n) => <div key={n} className="h-48 bg-white/5 rounded-xl border border-white/10" />)}
              </div>
            ) : projelerHata ? (
              <GlassCard className="p-6 flex items-center gap-4 border-yellow-500/20 bg-yellow-500/5">
                <span className="text-3xl shrink-0">⏳</span>
                <div>
                  <p className="text-sm font-semibold text-yellow-400">Projeler şu an yüklenemiyor</p>
                  <p className="text-xs text-white/40 mt-0.5">Scratch API geçici olarak meşgul. Diğer analiz verileri gösteriliyor.</p>
                </div>
                <button onClick={() => window.location.reload()} className="ml-auto shrink-0 text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  Yenile
                </button>
              </GlassCard>
            ) : projelerData?.projects && projelerData.projects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projelerData.projects.map((proje) => {
                  const atilmaSaati = proje.share_date
                    ? new Date(proje.share_date).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
                    : "";
                  return (
                    <div key={proje.id} className="group block cursor-pointer" onClick={() => setLocation(`/proje/${proje.id}`)}>
                    <GlassCard className="overflow-hidden h-full hover:border-primary/50 transition-all duration-300 flex flex-col group-hover:-translate-y-1">
                      <div className="aspect-video relative bg-black/50 w-full overflow-hidden">
                        {proje.thumbnail_url ? (
                          <img src={proje.thumbnail_url} alt={proje.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                            <span className="text-white/30 font-display font-bold text-sm">Resim Yok</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                          <span className="text-xs font-bold text-primary">Platformda Oynat →</span>
                          {atilmaSaati && <span className="text-[10px] text-white/70 bg-black/40 px-2 py-1 rounded-full">Saat {atilmaSaati}</span>}
                        </div>
                      </div>
                      <div className="p-3 sm:p-4 flex-1 flex flex-col">
                        <h4 className="font-bold text-white/90 line-clamp-1 text-sm mb-3">{proje.title}</h4>
                        <div className="mt-auto grid grid-cols-3 gap-1 text-xs text-muted-foreground font-medium">
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-pink-400 shrink-0" />{proje.loves.toLocaleString("tr-TR")}</span>
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-blue-400 shrink-0" />{proje.views.toLocaleString("tr-TR")}</span>
                          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 shrink-0" />{proje.favorites.toLocaleString("tr-TR")}</span>
                        </div>
                      </div>
                    </GlassCard>
                    </div>
                  );
                })}
              </div>
            ) : (
              <GlassCard className="p-8 text-center text-muted-foreground">Bu kullanıcıya ait proje bulunamadı.</GlassCard>
            )}
          </motion.div>

        </motion.div>
      </main>
    </div>
  );
}
