import { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, RadarChart, PolarGrid,
  PolarAngleAxis, Radar,
} from "recharts";
import {
  Search, Heart, Eye, Star, MessageSquare, Repeat,
  Calendar, CheckCircle, XCircle, TrendingUp, Award,
  Zap, Users, ArrowUpRight, Download, Share2,
  Activity, Target, Shield, Clock, Flame,
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
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
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
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <GlassCard className="max-w-md w-full p-8 text-center" gradient>
          <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold mb-2">Kullanıcı Bulunamadı</h2>
          <p className="text-muted-foreground mb-8">
            "{username}" adlı Scratch profili bulunamadı. Kullanıcı adının doğru yazıldığından emin ol.
          </p>
          <button
            onClick={() => setLocation("/")}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-semibold"
          >
            ← Ana Sayfaya Dön
          </button>
        </GlassCard>
      </div>
    );
  }

  const s = analiz.stats;
  const sc = analiz.score;
  const adv = analiz.advanced;

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
                { etiket: "Alınan Yorumlar", deger: s.total_comments, ikon: MessageSquare, renk: "text-orange-400", arkaplan: "bg-orange-400/10" },
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
                    <span className="font-bold text-sm">{s.total_comments.toLocaleString("tr-TR")}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Proje Başına Yorum</span>
                    <span className="font-bold text-sm">{s.yorum_orani}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Aktivite Seviyesi</span>
                    <span className="font-bold text-sm text-accent">{analiz.insights.etkilesim_kalitesi}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Yorum/Beğeni Oranı</span>
                    <span className="font-bold text-sm">
                      {s.total_loves > 0 ? ((s.total_comments / s.total_loves) * 100).toFixed(1) : 0}%
                    </span>
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
