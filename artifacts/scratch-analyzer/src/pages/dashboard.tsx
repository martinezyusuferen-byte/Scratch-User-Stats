import { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, RadarChart, PolarGrid,
  PolarAngleAxis, Radar, PieChart, Pie, Legend,
} from "recharts";
import {
  Search, Heart, Eye, Star, MessageSquare, Repeat,
  Calendar, CheckCircle, XCircle, TrendingUp, Award,
  Zap, Users, ArrowUpRight, Share2,
  Activity, Target, Shield, Clock, Flame, Cpu,
  BarChart2, Sparkles, Dna, Filter, Gauge,
  BrainCircuit, Rocket, ChevronUp, ChevronDown, Minus,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { CircularProgress } from "@/components/ui/circular-progress";
import { cn } from "@/lib/utils";
import { useGetScratchUser, useGetScratchUserProjects } from "@workspace/api-client-react";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

function BatmaGostergesi({ oran }: { oran: number }) {
  const renk = oran > 95 ? "#ef4444" : oran > 88 ? "#f97316" : oran > 80 ? "#eab308" : "#22c55e";
  const etiket = oran > 95 ? "Kritik" : oran > 88 ? "Yüksek" : oran > 80 ? "Orta" : "Düşük";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15" fill="none" stroke={renk} strokeWidth="3"
            strokeDasharray={`${oran * 0.942} 94.2`} strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold" style={{ color: renk }}>{oran}%</span>
        </div>
      </div>
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: renk + "20", color: renk }}>
        {etiket}
      </span>
    </div>
  );
}

function OncelikRengi({ oncelik }: { oncelik: string }) {
  if (oncelik === "yuksek") return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-500/20 text-red-400">Yüksek Öncelik</span>;
  if (oncelik === "orta") return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-yellow-500/20 text-yellow-400">Orta Öncelik</span>;
  return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-400">Düşük Öncelik</span>;
}

export default function Dashboard() {
  const { username } = useParams<{ username: string }>();
  const [, setLocation] = useLocation();
  const [aramaInput, setAramaInput] = useState("");
  const raporRef = useRef<HTMLDivElement>(null);

  // Yorum / oturum token state
  const [yorumModalAcik, setYorumModalAcik] = useState(false);
  const [sessionToken, setSessionToken] = useState("");
  const [yorumVerisi, setYorumVerisi] = useState<{ total_comments: number; proje_yorumlar: Array<{id:number;title:string;yorumlar:number}> } | null>(null);
  const [yorumYukleniyor, setYorumYukleniyor] = useState(false);
  const [yorumHata, setYorumHata] = useState<string | null>(null);

  const { data: analiz, isLoading, error } = useGetScratchUser(username || "");
  const { data: projelerData, isLoading: projelerYukleniyor } = useGetScratchUserProjects(username || "", { limit: 9 });

  const handleArama = (e: React.FormEvent) => {
    e.preventDefault();
    if (aramaInput.trim()) {
      setLocation(`/kullanici/${encodeURIComponent(aramaInput.trim())}`);
      setAramaInput("");
    }
  };

  const handlePaylasim = () => {
    if (navigator.share) {
      navigator.share({ title: `${username} - Scratch Analizi`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleYorumBaglan = async () => {
    if (!sessionToken.trim()) return;
    setYorumYukleniyor(true);
    setYorumHata(null);
    try {
      const res = await fetch(
        `/api/scratch/user/${encodeURIComponent(username || "")}/authenticated-stats?token=${encodeURIComponent(sessionToken.trim())}`
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Bağlantı başarısız");
      }
      const d = await res.json();
      setYorumVerisi(d);
      setYorumModalAcik(false);
    } catch (e: any) {
      setYorumHata(e.message || "Hata oluştu. Token'ı kontrol et.");
    } finally {
      setYorumYukleniyor(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-16 h-16 border-4 border-white/10 border-t-primary rounded-full"
        />
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
              <p className="text-muted-foreground mb-4">
                Scratch sunucuları şu an çok fazla istek aldı. 1–2 dakika bekleyip tekrar dene.
              </p>
              <p className="text-xs text-white/30 mb-8">Bu geçici bir durumdur, kullanıcı adı doğruysa veriler gelecektir.</p>
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
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 transition-colors font-semibold"
            >
              ↻ Tekrar Dene
            </button>
            <button
              onClick={() => setLocation("/")}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-semibold"
            >
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

  const radarVerisi = [
    { konu: "Etkileşim", deger: sc.etkilesim },
    { konu: "Yaratıcılık", deger: sc.yaraticilik },
    { konu: "Topluluk", deger: sc.topluluk },
    { konu: "Tutarlılık", deger: sc.tutarlilik },
    { konu: "Büyüme", deger: sc.buyume_potansiyeli },
  ];

  return (
    <div ref={raporRef} className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div
            className="flex items-center gap-2 cursor-pointer group shrink-0"
            onClick={() => setLocation("/")}
          >
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
              <input
                type="text"
                value={aramaInput}
                onChange={(e) => setAramaInput(e.target.value)}
                placeholder="Başka kullanıcı ara..."
                className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-white placeholder:text-white/40"
              />
            </div>
          </form>

          <button
            onClick={handlePaylasim}
            className="shrink-0 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
            title="Paylaş"
          >
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

          {/* Profil + Skor — üst bölüm */}
          <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-12 gap-4">

            {/* Profil Kartı */}
            <GlassCard gradient className="md:col-span-4 p-5 sm:p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-primary/20 to-transparent" />
              <img
                src={analiz.profile.avatar_url}
                alt={analiz.profile.username}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-background shadow-xl mx-auto relative z-10 bg-black/50"
              />
              <div className="relative z-10">
                <h1 className="text-2xl sm:text-3xl font-display font-bold mt-3">
                  {analiz.profile.username}
                  {analiz.profile.scratch_team && (
                    <Shield className="inline w-5 h-5 text-blue-400 ml-2 mb-1" />
                  )}
                </h1>

                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary/20 text-primary border border-primary/30">
                    {analiz.insights.icerik_turu}
                  </span>
                  <span className={cn(
                    "px-2.5 py-1 text-xs font-semibold rounded-full border",
                    analiz.activity.aktif_mi
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                  )}>
                    {analiz.activity.aktif_mi ? "🟢 Aktif" : "⚫ Pasif"}
                  </span>
                </div>

                {analiz.profile.bio && (
                  <p className="mt-3 text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {analiz.profile.bio}
                  </p>
                )}

                {analiz.profile.country && (
                  <p className="mt-1 text-xs text-muted-foreground">📍 {analiz.profile.country}</p>
                )}

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

            {/* Genel Skor */}
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
                ].map((skor) => (
                  <div key={skor.etiket}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{skor.etiket}</span>
                      <span className="font-bold">{skor.deger}/100</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${skor.deger}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={cn("h-full rounded-full", skor.renk)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Radar Grafiği */}
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

          {/* ── İSTATİSTİK IZGARASI ── */}
          <motion.div variants={item}>
            <h2 className="font-display font-bold text-lg sm:text-xl mb-3 flex items-center gap-2">
              <BarChart2Icon className="w-5 h-5 text-primary" /> Temel İstatistikler
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {[
                { etiket: "Toplam Görüntüleme", deger: s.total_views, ikon: Eye, renk: "text-blue-400", arkaplan: "bg-blue-400/10" },
                { etiket: "Toplam Beğeni", deger: s.total_loves, ikon: Heart, renk: "text-pink-400", arkaplan: "bg-pink-400/10" },
                { etiket: "Favoriler", deger: s.total_favorites, ikon: Star, renk: "text-yellow-400", arkaplan: "bg-yellow-400/10" },
                { etiket: "Toplam Remix", deger: s.total_remixes, ikon: Repeat, renk: "text-green-400", arkaplan: "bg-green-400/10" },
                { etiket: "Proje/Ay", deger: s.projects_per_month, ikon: TrendingUp, renk: "text-primary", arkaplan: "bg-primary/10", format: "sabit" },
              ].map((stat, i) => (
                <GlassCard key={i} className="p-3 sm:p-4 hover:bg-white/[0.06] transition-colors">
                  <div className={cn("p-1.5 rounded-lg w-fit mb-2", stat.arkaplan)}>
                    <stat.ikon className={cn("w-4 h-4", stat.renk)} />
                  </div>
                  <div className="text-lg sm:text-2xl font-bold font-display">
                    {stat.format === "sabit"
                      ? Number(stat.deger).toFixed(1)
                      : Number(stat.deger).toLocaleString("tr-TR")}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{stat.etiket}</div>
                </GlassCard>
              ))}
              {/* Yorumlar - Scratch public API kısıtlı */}
              <GlassCard className="p-3 sm:p-4 hover:bg-white/[0.06] transition-colors border-orange-500/10">
                <div className="p-1.5 rounded-lg w-fit mb-2 bg-orange-400/10">
                  <MessageSquare className="w-4 h-4 text-orange-400" />
                </div>
                <div className="text-lg sm:text-2xl font-bold font-display text-orange-400/70">—</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Yorumlar</div>
                <div className="text-[9px] text-orange-400/60 mt-0.5">API kısıtlı</div>
              </GlassCard>
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
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-red-400" /> Batma Oranı
                </h4>
                <BatmaGostergesi oran={s.batma_orani} />
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  İzleyicilerin <strong className="text-white">{s.batma_orani}%</strong>'i projeyi beğenmeden terk ediyor
                </p>
              </GlassCard>

              {/* Etkileşim Oranı */}
              <GlassCard className="p-5">
                <h4 className="font-semibold text-sm mb-4 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-green-400" /> Etkileşim Oranı
                </h4>
                <div className="text-3xl sm:text-4xl font-display font-bold text-green-400 mb-1">
                  %{s.etkilesim_orani}
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  (Beğeni + Favori + Yorum) / Görüntüleme
                </p>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, s.etkilesim_orani * 10)}%` }}
                    transition={{ duration: 1.2 }}
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                  />
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Kaliteli etkileşim için hedef: <strong className="text-white">%5+</strong>
                </div>
              </GlassCard>

              {/* Takip Oranı */}
              <GlassCard className="p-5">
                <h4 className="font-semibold text-sm mb-4 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-400" /> Takip Oranı
                </h4>
                <div className="text-3xl sm:text-4xl font-display font-bold text-blue-400 mb-1">
                  {s.takip_orani > 99 ? "99+" : s.takip_orani.toFixed(1)}x
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Takipçi / Takip Edilen
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2">
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

              {/* Yorum Analizi */}
              <GlassCard className="p-5">
                <h4 className="font-semibold text-sm mb-4 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-orange-400" /> Yorum Analizi
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Toplam Yorum</span>
                    {yorumVerisi ? (
                      <span className="font-bold text-sm text-orange-400">{yorumVerisi.total_comments.toLocaleString("tr-TR")}</span>
                    ) : (
                      <span className="font-bold text-sm text-muted-foreground/50 italic text-xs">Giriş gerekli</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Yorum Durumu</span>
                    <span className="font-bold text-sm text-green-400">
                      {(analiz.profile as any).comments_allowed !== false ? "✅ Açık" : "🚫 Kapalı"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Aktivite Seviyesi</span>
                    <span className="font-bold text-sm text-accent">{analiz.insights.etkilesim_kalitesi}</span>
                  </div>
                  {yorumVerisi && yorumVerisi.proje_yorumlar.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {yorumVerisi.proje_yorumlar.slice(0, 3).map(p => (
                        <div key={p.id} className="flex justify-between items-center text-[11px]">
                          <span className="text-muted-foreground truncate max-w-[130px]">{p.title}</span>
                          <span className="text-orange-400 font-semibold">{p.yorumlar} yorum</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => setYorumModalAcik(true)}
                    className="w-full mt-1 py-2 text-xs font-semibold rounded-lg bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 transition-all"
                  >
                    {yorumVerisi ? "🔄 Yenile" : "🔐 Scratch Oturumu ile Yorumları Gör"}
                  </button>
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
                    <span className="font-bold text-sm">{Math.floor(s.days_on_scratch / 365)} yıl {s.days_on_scratch % 365} gün</span>
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
                    <div className="h-1.5 rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${adv.guclu_proje_orani}%` }}
                        transition={{ duration: 1 }}
                        className="h-full bg-green-500 rounded-full"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Zayıf Projeler (&lt;100 görüntüleme)</span>
                      <span className="font-bold text-red-400">%{adv.zayif_proje_orani}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${adv.zayif_proje_orani}%` }}
                        transition={{ duration: 1 }}
                        className="h-full bg-red-500 rounded-full"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs text-muted-foreground">Önerilen Proje Türü</span>
                    <span className="font-bold text-xs text-primary">{adv.onerilen_tur}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">1000 Görüntülemede Remix</span>
                    <span className="font-bold text-xs">{adv.remix_edilme_orani}</span>
                  </div>
                </div>
              </GlassCard>
            </div>
          </motion.div>

          {/* ── EK 9 DETAYLI BİLGİ KARTLARI ── */}
          <motion.div variants={item}>
            <h2 className="font-display font-bold text-lg sm:text-xl mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" /> Ek Analiz Kartları
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

              {/* 1 - Büyüme Trendi */}
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="font-semibold text-sm">Büyüme Trendi</span>
                </div>
                <div className="text-2xl font-bold">{analiz.insights.buyume_trendi}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Son 3 aylık aktivite önceki 3 ayla karşılaştırıldı
                </p>
              </GlassCard>

              {/* 2 - En İyi Paylaşım Zamanı */}
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-sm">En İyi Paylaşım Zamanı</span>
                </div>
                <div className="text-sm font-bold text-blue-400">{analiz.insights.en_iyi_paylasim_zamani}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Scratch kullanıcı trafiği bu saatlerde zirveye ulaşır
                </p>
              </GlassCard>

              {/* 3 - İçerik Tutarlılığı */}
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  <span className="font-semibold text-sm">İçerik Tutarlılığı</span>
                </div>
                <div className="text-2xl font-bold text-purple-400">{analiz.insights.icerik_tutarliligi}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Aylık {s.projects_per_month} proje paylaşım hızına göre
                </p>
              </GlassCard>

              {/* 4 - Beğeni/Görüntüleme Oranı */}
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-pink-400" />
                  <span className="font-semibold text-sm">Beğeni/Görüntüleme Oranı</span>
                </div>
                <div className="text-2xl font-bold text-pink-400">
                  %{(s.love_to_view_ratio * 100).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Her 100 görüntülemede {(s.love_to_view_ratio * 100).toFixed(1)} beğeni
                </p>
              </GlassCard>

              {/* 5 - Ortalama Proje Performansı */}
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="font-semibold text-sm">Ort. Proje Performansı</span>
                </div>
                <div className="space-y-1.5 mt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Beğeni/Proje</span>
                    <span className="font-bold">{s.average_loves_per_project}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Görüntüleme/Proje</span>
                    <span className="font-bold">{s.average_views_per_project.toLocaleString("tr-TR")}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Verimlilik Skoru</span>
                    <span className="font-bold text-yellow-400">{s.verimlilik_skoru}/100</span>
                  </div>
                </div>
              </GlassCard>

              {/* 6 - Remix Analizi */}
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Repeat className="w-4 h-4 text-teal-400" />
                  <span className="font-semibold text-sm">Remix Analizi</span>
                </div>
                <div className="space-y-1.5 mt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Toplam Remix</span>
                    <span className="font-bold">{s.total_remixes.toLocaleString("tr-TR")}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Proje Başına Remix</span>
                    <span className="font-bold">{s.remix_rate.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">1000 görüntülemede</span>
                    <span className="font-bold text-teal-400">{adv.remix_edilme_orani}</span>
                  </div>
                </div>
              </GlassCard>

              {/* 7 - Aktivite Serisi */}
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="font-semibold text-sm">Aktivite Serisi</span>
                </div>
                <div className="text-3xl font-bold text-orange-400">{analiz.activity.aktivite_serisi}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Son 12 ayda aktif olan ay sayısı
                </p>
                {analiz.activity.son_proje_tarihi && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Son proje: {new Date(analiz.activity.son_proje_tarihi).toLocaleDateString("tr-TR")}
                  </p>
                )}
              </GlassCard>

              {/* 8 - En Popüler Proje */}
              {adv.en_iyi_proje && (
                <GlassCard className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-yellow-400" />
                    <span className="font-semibold text-sm">En Çok Beğenilen</span>
                  </div>
                  <a href={adv.en_iyi_proje.url} target="_blank" rel="noreferrer"
                    className="block group">
                    <div className="text-sm font-bold line-clamp-1 group-hover:text-primary transition-colors">
                      {adv.en_iyi_proje.title} <ArrowUpRight className="inline w-3 h-3" />
                    </div>
                  </a>
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    <span><Heart className="inline w-3 h-3 text-pink-400 mr-0.5" />{adv.en_iyi_proje.loves.toLocaleString("tr-TR")}</span>
                    <span><Eye className="inline w-3 h-3 text-blue-400 mr-0.5" />{adv.en_iyi_proje.views.toLocaleString("tr-TR")}</span>
                  </div>
                </GlassCard>
              )}

              {/* 9 - En Çok İzlenen */}
              {adv.en_cok_izlenen && (
                <GlassCard className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-blue-400" />
                    <span className="font-semibold text-sm">En Çok İzlenen</span>
                  </div>
                  <a href={adv.en_cok_izlenen.url} target="_blank" rel="noreferrer"
                    className="block group">
                    <div className="text-sm font-bold line-clamp-1 group-hover:text-primary transition-colors">
                      {adv.en_cok_izlenen.title} <ArrowUpRight className="inline w-3 h-3" />
                    </div>
                  </a>
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    <span><Eye className="inline w-3 h-3 text-blue-400 mr-0.5" />{adv.en_cok_izlenen.views.toLocaleString("tr-TR")}</span>
                    <span><Heart className="inline w-3 h-3 text-pink-400 mr-0.5" />{adv.en_cok_izlenen.loves.toLocaleString("tr-TR")}</span>
                  </div>
                </GlassCard>
              )}
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
                  Seri: {analiz.activity.aktivite_serisi} ay
                </span>
              </div>
              <div className="h-48 sm:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analiz.activity.aylik_projeler} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="ay"
                      stroke="rgba(255,255,255,0.4)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => v.substring(5)}
                    />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                    <RechartsTooltip
                      cursor={{ fill: "rgba(255,255,255,0.04)" }}
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(v: any) => [`${v} proje`, "Paylaşım"]}
                    />
                    <Bar dataKey="sayi" radius={[4, 4, 0, 0]}>
                      {analiz.activity.aylik_projeler.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.sayi > 0 ? "hsl(var(--primary))" : "rgba(255,255,255,0.06)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </motion.div>

          {/* ══════════════════════════════════════════════════════
               12 SÜPER ÖZELLİK — Scratch'in yapamadığı analizler
          ══════════════════════════════════════════════════════ */}
          {sup && Object.keys(sup).length > 0 && (
            <motion.div variants={item}>
              <h2 className="font-display font-bold text-lg sm:text-xl mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" /> Derinlemesine Analiz
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* 1 — VİRAL POTANSİYEL MOTORU */}
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
                            stroke={sup.viral_potansiyel.skor >= 75 ? "#f97316" : sup.viral_potansiyel.skor >= 55 ? "#eab308" : sup.viral_potansiyel.skor >= 35 ? "#6366f1" : "#6b7280"}
                            strokeWidth="3" strokeDasharray={`${sup.viral_potansiyel.skor * 0.942} 94.2`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-base font-bold">{sup.viral_potansiyel.skor}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-orange-400 text-sm mb-1">{sup.viral_potansiyel.seviye}</div>
                        {(sup.viral_potansiyel.faktorler || []).slice(0, 3).map((f: string, i: number) => (
                          <div key={i} className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <div className="w-1 h-1 rounded-full bg-orange-400/60 shrink-0" /> {f}
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3 bg-white/5 rounded-lg p-2">
                      Beğeni hızı × Remix çarpanı × Etkileşim zinciri faktörleriyle hesaplandı
                    </p>
                  </GlassCard>
                )}

                {/* 2 — KELIME DNA'SI */}
                {sup.kelime_dna && sup.kelime_dna.length > 0 && (
                  <GlassCard className="p-5">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                      <Dna className="w-4 h-4 text-purple-400" /> İçerik Kelime DNA'sı
                    </h4>
                    <p className="text-[10px] text-muted-foreground mb-3">Proje başlıklarında en çok geçen kelimeler</p>
                    <div className="flex flex-wrap gap-1.5">
                      {sup.kelime_dna.map((k: { kelime: string; sayi: number }, i: number) => {
                        const boyut = i === 0 ? "text-base font-black" : i < 3 ? "text-sm font-bold" : i < 6 ? "text-xs font-semibold" : "text-[10px]";
                        const opasite = i === 0 ? "bg-purple-500/30 text-purple-300" : i < 3 ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-white/60";
                        return (
                          <span key={i} className={cn("px-2 py-1 rounded-full border border-white/10", boyut, opasite)}>
                            {k.kelime} <span className="opacity-60 text-[9px]">×{k.sayi}</span>
                          </span>
                        );
                      })}
                    </div>
                  </GlassCard>
                )}

                {/* 3 — İÇERİK KATEGORİ DAĞILIMI */}
                {sup.icerik_dagilimi && sup.icerik_dagilimi.length > 0 && (
                  <GlassCard className="p-5">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                      <Filter className="w-4 h-4 text-cyan-400" /> İçerik Kategori Dağılımı
                    </h4>
                    <p className="text-[10px] text-muted-foreground mb-2">
                      Dominant Tür: <strong className="text-white">{sup.dominant_tur}</strong>
                    </p>
                    <div className="space-y-2">
                      {sup.icerik_dagilimi.map((k: { kategori: string; sayi: number; oran: number }, i: number) => {
                        const renkler = ["bg-cyan-500","bg-violet-500","bg-pink-500","bg-amber-500","bg-teal-500","bg-slate-500"];
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

                {/* 4 — ETKİLEŞİM ŞELALE HUNİSİ */}
                {sup.etkilesim_hunisi && (
                  <GlassCard className="p-5">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-green-400" /> Etkileşim Şelale Hunisi
                    </h4>
                    <p className="text-[10px] text-muted-foreground mb-3">Her aşamada kaç kişi devam ediyor?</p>
                    {[
                      { etiket: "👁 Görüntüleme", sayi: sup.etkilesim_hunisi.goruntulemeler, oran: 100, renk: "bg-blue-500" },
                      { etiket: "❤ Beğeni", sayi: sup.etkilesim_hunisi.begeniler, oran: sup.etkilesim_hunisi.begeni_orani, renk: "bg-pink-500" },
                      { etiket: "⭐ Favori", sayi: sup.etkilesim_hunisi.favoriler, oran: sup.etkilesim_hunisi.favori_orani, renk: "bg-yellow-500" },
                      { etiket: "🔁 Remix", sayi: sup.etkilesim_hunisi.remixler, oran: sup.etkilesim_hunisi.remix_orani, renk: "bg-teal-500" },
                      { etiket: "💬 Yorum", sayi: sup.etkilesim_hunisi.yorumlar, oran: sup.etkilesim_hunisi.yorum_orani, renk: "bg-orange-500" },
                    ].map((h, i) => (
                      <div key={i} className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] text-muted-foreground w-20 shrink-0">{h.etiket}</span>
                        <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden relative">
                          <motion.div initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, h.oran)}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                            className={cn("h-full rounded-full", h.renk)} />
                        </div>
                        <span className="text-[10px] font-bold w-10 text-right">{h.oran?.toFixed ? h.oran.toFixed(1) : h.oran}%</span>
                      </div>
                    ))}
                  </GlassCard>
                )}

                {/* 5 — PROJE TİER SİSTEMİ */}
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
                    <p className="text-[10px] text-muted-foreground mt-3 bg-white/5 rounded-lg p-2">
                      Görüntüleme × Beğeni/görüntüleme oranına göre hesaplandı
                    </p>
                  </GlassCard>
                )}

                {/* 6 — BÜYÜME HIZI + 12 AYLIK PROJEKSİYON */}
                {sup.buyume_projeksiyonu && (
                  <GlassCard className="p-5">
                    <h4 className="font-semibold text-sm mb-1 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-400" /> Büyüme Projeksiyonu
                    </h4>
                    <p className="text-[10px] text-muted-foreground mb-3">
                      Büyüme Hızı: <strong className="text-white">{sup.buyume_hizi_etiketi}</strong>
                    </p>
                    <div className="space-y-2">
                      {sup.buyume_projeksiyonu.map((p: { ay: string; tahmini_takipci: number }, i: number) => (
                        <div key={i} className="flex justify-between items-center bg-white/5 rounded-lg px-3 py-2">
                          <span className="text-xs text-muted-foreground">{p.ay} sonra</span>
                          <span className="font-bold text-emerald-400 text-sm">
                            ~{p.tahmini_takipci.toLocaleString("tr-TR")} takipçi
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Mevcut etkileşim oranına göre ileriye dönük tahmin
                    </p>
                  </GlassCard>
                )}

                {/* 7 — BAŞARI DNA'SI */}
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

                {/* 8 — HAYRAN GÜÇ ENDEKSİ */}
                {sup.hayran_guc_endeksi && (
                  <GlassCard className="p-5">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-rose-400" /> Hayran Güç Endeksi
                    </h4>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-display font-black text-rose-400">
                        %{sup.hayran_guc_endeksi.oran}
                      </div>
                      <div>
                        <div className="font-bold text-sm">{sup.hayran_guc_endeksi.seviye}</div>
                        <div className="text-[10px] text-muted-foreground">Favori/Beğeni Oranı</div>
                      </div>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/5">
                      <motion.div initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, sup.hayran_guc_endeksi.oran)}%` }}
                        transition={{ duration: 1.2 }}
                        className="h-full rounded-full bg-gradient-to-r from-rose-600 to-pink-400" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
                      {sup.hayran_guc_endeksi.aciklama}
                    </p>
                  </GlassCard>
                )}

                {/* 9 — SCRATCH ALGORİTMA UYUMU */}
                {sup.algoritma_uyumu && (
                  <GlassCard className="p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl" />
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-indigo-400" /> Scratch Algoritma Uyumu
                    </h4>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-3xl font-display font-black text-indigo-400">
                        {sup.algoritma_uyumu.skor}/100
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold">{sup.algoritma_uyumu.durum}</div>
                        <div className="h-1.5 rounded-full bg-white/5 mt-1">
                          <motion.div initial={{ width: 0 }}
                            animate={{ width: `${sup.algoritma_uyumu.skor}%` }}
                            transition={{ duration: 1 }}
                            className="h-full rounded-full bg-indigo-500" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-2.5">
                      <div className="text-[10px] font-bold text-indigo-400 mb-1">🎯 İyileştirme</div>
                      <div className="text-xs">{sup.algoritma_uyumu.iyilestirme}</div>
                    </div>
                  </GlassCard>
                )}

                {/* 10 — PROJE MOMENTUM */}
                {sup.proje_momentum && (
                  <GlassCard className="p-5">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-amber-400" /> Proje Momentum Analizi
                    </h4>
                    <p className="text-[10px] text-muted-foreground mb-3">
                      Son projeler vs. eski projeler performans farkı
                    </p>
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

                {/* 11 — TOPLULUK KONUMLANDIRMASI */}
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
                    <p className="text-[10px] text-muted-foreground mt-3 bg-white/5 rounded-lg p-2">
                      {sup.topluluk_konumlama.ozet}
                    </p>
                  </GlassCard>
                )}

                {/* 12 — BAŞLIK OPTİMİZASYON SKORU */}
                {sup.baslik_optimizasyon && (
                  <GlassCard className="p-5">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4 text-lime-400" /> Başlık Optimizasyon Skoru
                    </h4>
                    <p className="text-[10px] text-muted-foreground mb-3">
                      Proje başlıklarının keşfedilebilirlik analizi
                    </p>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-4xl font-display font-black text-lime-400">
                        {sup.baslik_optimizasyon.skor}
                      </div>
                      <div>
                        <div className={cn("text-sm font-bold",
                          sup.baslik_optimizasyon.seviye === "Mükemmel" ? "text-green-400" :
                          sup.baslik_optimizasyon.seviye === "İyi" ? "text-lime-400" :
                          sup.baslik_optimizasyon.seviye === "Orta" ? "text-yellow-400" : "text-red-400")}>
                          {sup.baslik_optimizasyon.seviye}
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 mt-1 w-24">
                          <motion.div initial={{ width: 0 }}
                            animate={{ width: `${sup.baslik_optimizasyon.skor}%` }}
                            transition={{ duration: 1 }}
                            className="h-full rounded-full bg-lime-500" />
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
                    <OncelikRengi oncelik={ipucu.oncelik} />
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
              <a
                href={`https://scratch.mit.edu/users/${username}/#projects`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                Tümünü Gör <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>

            {projelerYukleniyor ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-48 bg-white/5 rounded-xl border border-white/10" />
                ))}
              </div>
            ) : projelerData?.projects && projelerData.projects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projelerData.projects.map((proje) => (
                  <a
                    key={proje.id}
                    href={proje.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group block"
                  >
                    <GlassCard className="overflow-hidden h-full hover:border-primary/50 transition-all duration-300 flex flex-col group-hover:-translate-y-1">
                      <div className="aspect-video relative bg-black/50 w-full overflow-hidden">
                        {proje.thumbnail_url ? (
                          <img
                            src={proje.thumbnail_url}
                            alt={proje.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                            <span className="text-white/30 font-display font-bold text-sm">Resim Yok</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                          <span className="text-xs font-bold text-primary">Scratch'te Aç →</span>
                        </div>
                      </div>
                      <div className="p-3 sm:p-4 flex-1 flex flex-col">
                        <h4 className="font-bold text-white/90 line-clamp-1 text-sm mb-3">{proje.title}</h4>
                        <div className="mt-auto grid grid-cols-3 gap-1 text-xs text-muted-foreground font-medium">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-pink-400 shrink-0" />
                            {proje.loves.toLocaleString("tr-TR")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3 text-blue-400 shrink-0" />
                            {proje.views.toLocaleString("tr-TR")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 shrink-0" />
                            {proje.favorites.toLocaleString("tr-TR")}
                          </span>
                        </div>
                      </div>
                    </GlassCard>
                  </a>
                ))}
              </div>
            ) : (
              <GlassCard className="p-8 text-center text-muted-foreground">
                Bu kullanıcıya ait proje bulunamadı.
              </GlassCard>
            )}
          </motion.div>

        </motion.div>
      </main>

      {/* Scratch Oturum Token Modalı */}
      {yorumModalAcik && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setYorumModalAcik(false); }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <GlassCard className="p-6" gradient>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-bold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-orange-400" />
                  Scratch Oturumu ile Yorumları Gör
                </h3>
                <button onClick={() => setYorumModalAcik(false)} className="text-muted-foreground hover:text-white transition-colors text-xl">✕</button>
              </div>

              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-2">
                <p className="text-xs font-semibold text-blue-400">Nasıl yapılır? (3 adım)</p>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Tarayıcında <strong className="text-white">scratch.mit.edu</strong>'ya giriş yap</li>
                  <li>F12 → Application → Cookies → scratch.mit.edu</li>
                  <li><strong className="text-orange-400">scratchsessionsid</strong> değerini kopyala ve buraya yapıştır</li>
                </ol>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={sessionToken}
                  onChange={e => setSessionToken(e.target.value)}
                  placeholder="scratchsessionsid değerini buraya yapıştır..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 placeholder:text-white/20 font-mono"
                />
                {yorumHata && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">{yorumHata}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setYorumModalAcik(false)}
                    className="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-semibold transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleYorumBaglan}
                    disabled={!sessionToken.trim() || yorumYukleniyor}
                    className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
                  >
                    {yorumYukleniyor ? "Yükleniyor..." : "Bağlan"}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground/50 text-center">
                  Token sadece yorum verilerini çekmek için kullanılır, saklanmaz.
                </p>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Inline BarChart2 icon
function BarChart2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" x2="18" y1="20" y2="10" />
      <line x1="12" x2="12" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="14" />
    </svg>
  );
}
