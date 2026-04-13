import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, BarChart2, Target, TrendingUp, Users, Zap, Star,
  ArrowRight, Heart, Eye, Play, X, Loader2, User, Gamepad2,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const ornekKullanicilar = ["griffpatch", "Will_Wam", "ceebee", "ScratchCat"];

type AramaDurumu = "bos" | "yukleniyor" | "proje-sonuclari" | "hata";

export default function Home() {
  const [, setLocation] = useLocation();
  const [aramaInput, setAramaInput] = useState("");
  const [durum, setDurum] = useState<AramaDurumu>("bos");
  const [sonuclar, setSonuclar] = useState<any[]>([]);
  const [aramanAdi, setAramanAdi] = useState("");
  const [hataMesaji, setHataMesaji] = useState("");

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
      // 1. Önce kullanıcıyı dene
      const kullaniciRes = await fetch(`${BASE}/api/scratch/user/${encodeURIComponent(val)}`);

      if (kullaniciRes.ok) {
        // Kullanıcı bulundu → profile git
        setLocation(`/kullanici/${encodeURIComponent(val)}`);
        setDurum("bos");
        return;
      }

      if (kullaniciRes.status === 429) {
        setHataMesaji("Scratch API şu an çok meşgul, biraz bekleyip tekrar dene.");
        setDurum("hata");
        return;
      }

      // 2. Kullanıcı bulunamadı (404) → proje ara
      const aramaRes = await fetch(`${BASE}/api/scratch/search?q=${encodeURIComponent(val)}`);
      if (!aramaRes.ok) throw new Error("Arama başarısız");

      const data = await aramaRes.json();
      setSonuclar(data.results || []);
      setDurum("proje-sonuclari");
    } catch {
      setHataMesaji("Bağlantı hatası. Lütfen tekrar dene.");
      setDurum("hata");
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
          alt="Arka plan"
          className="w-full h-full object-cover opacity-35 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-6xl px-4 sm:px-6 flex flex-col items-center py-12">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-white/80">Gelişmiş Scratch Analizi</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-bold mb-5 leading-tight">
            Analiz Et. Geliş. <br />
            <span className="text-gradient">Scratch'te Öne Çık.</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Herhangi bir Scratch kullanıcısının derinlemesine istatistiklerini, etkileşim metriklerini ve büyüme önerilerini görüntüle.
          </p>
        </motion.div>

        {/* Arama Çubuğu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-2xl mb-3"
        >
          <form onSubmit={handleArama} className="relative group">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/40 via-accent/40 to-primary/40 blur-xl opacity-0 group-focus-within:opacity-60 transition-opacity duration-500" />
            <div className="relative flex items-center bg-white/[0.06] border border-white/10 focus-within:border-primary/60 rounded-2xl px-5 py-4 transition-all duration-300 backdrop-blur-xl">
              {durum === "yukleniyor" ? (
                <Loader2 className="w-5 h-5 text-primary mr-3 shrink-0 animate-spin" />
              ) : (
                <Search className="w-5 h-5 text-muted-foreground mr-3 shrink-0 group-focus-within:text-primary transition-colors" />
              )}
              <input
                type="text"
                value={aramaInput}
                onChange={(e) => setAramaInput(e.target.value)}
                placeholder="Kullanıcı adı veya proje adı gir..."
                className="flex-1 bg-transparent border-none outline-none text-base text-white placeholder:text-white/30"
                autoComplete="off"
                disabled={durum === "yukleniyor"}
              />
              {aramaInput && durum !== "yukleniyor" && (
                <button type="button" onClick={temizle} className="mr-2 text-white/30 hover:text-white/60 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={!aramaInput.trim() || durum === "yukleniyor"}
                className="ml-1 px-4 py-2 rounded-xl bg-primary hover:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0"
              >
                {durum === "yukleniyor" ? "Aranıyor..." : (<>Ara <ArrowRight className="w-4 h-4" /></>)}
              </button>
            </div>
          </form>

          {/* İpucu */}
          <p className="text-xs text-white/30 text-center mt-2">
            Kullanıcı adı yazarsan profil analizine, proje adı yazarsan proje sonuçlarına gidersin
          </p>
        </motion.div>

        {/* Örnek Butonlar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-wrap items-center gap-2 justify-center mb-6"
        >
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <User className="w-3 h-3" /> Örnek kullanıcı:
          </span>
          {ornekKullanicilar.map((k) => (
            <button
              key={k}
              onClick={() => setLocation(`/kullanici/${k}`)}
              className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-primary/20 hover:border-primary/40 hover:text-primary transition-all duration-200"
            >
              {k}
            </button>
          ))}
        </motion.div>

        {/* ── HATA MESAJI ── */}
        <AnimatePresence>
          {durum === "hata" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-2xl mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              <span className="text-lg">⚠️</span>
              <span>{hataMesaji}</span>
              <button onClick={temizle} className="ml-auto text-red-400/60 hover:text-red-400">
                <X className="w-4 h-4" />
              </button>
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
              className="w-full mb-8"
            >
              {/* Başlık */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-accent" />
                  <h2 className="font-display font-bold text-lg text-white">
                    "<span className="text-primary">{aramanAdi}</span>" için proje sonuçları
                  </h2>
                  <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{sonuclar.length} sonuç</span>
                </div>
                <button onClick={temizle}
                  className="text-xs text-white/40 hover:text-white flex items-center gap-1 transition-colors">
                  <X className="w-3.5 h-3.5" /> Temizle
                </button>
              </div>

              {sonuclar.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">"{aramanAdi}" için hiçbir proje bulunamadı.</p>
                  <p className="text-xs mt-1 opacity-60">Farklı anahtar kelimeler dene.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {sonuclar.map((proje, i) => (
                    <motion.div
                      key={proje.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: i * 0.04 }}
                      onClick={() => setLocation(`/proje/${proje.id}`)}
                      className="group cursor-pointer"
                    >
                      <div className="rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.07] hover:border-primary/40 hover:bg-white/[0.06] transition-all duration-300 group-hover:-translate-y-1 flex flex-col"
                        style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
                        {/* Thumbnail */}
                        <div className="aspect-video relative overflow-hidden bg-black/40">
                          {proje.thumbnail_url ? (
                            <img src={proje.thumbnail_url} alt={proje.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                              <Gamepad2 className="w-8 h-8 text-white/20" />
                            </div>
                          )}
                          {/* Oynat Overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              whileHover={{ scale: 1.1 }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center shadow-lg"
                            >
                              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                            </motion.div>
                          </div>
                        </div>

                        {/* Bilgi */}
                        <div className="p-3 flex-1 flex flex-col gap-2">
                          <h3 className="text-sm font-semibold text-white/90 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                            {proje.title}
                          </h3>
                          {proje.creator && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setLocation(`/kullanici/${proje.creator}`); }}
                              className="flex items-center gap-1.5 w-fit hover:opacity-80 transition-opacity"
                            >
                              {proje.creator_avatar ? (
                                <img src={proje.creator_avatar} className="w-4 h-4 rounded-full bg-black/40" alt={proje.creator} />
                              ) : (
                                <User className="w-3 h-3 text-white/40" />
                              )}
                              <span className="text-[11px] text-white/50 hover:text-primary transition-colors">@{proje.creator}</span>
                            </button>
                          )}
                          <div className="mt-auto flex items-center gap-3 text-[11px] text-white/40">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3 text-blue-400/70" />
                              {(proje.views || 0).toLocaleString("tr-TR")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3 text-pink-400/70" />
                              {(proje.loves || 0).toLocaleString("tr-TR")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400/70" />
                              {(proje.favorites || 0).toLocaleString("tr-TR")}
                            </span>
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

        {/* ── ÖZELLİK KARTLARI (sadece sonuç yokken göster) ── */}
        <AnimatePresence>
          {durum === "bos" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="mt-10 sm:mt-14 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 w-full"
            >
              {[
                { icon: BarChart2, baslik: "Derin İstatistikler", aciklama: "Görüntüleme, beğeni ve gerçek etkileşim metrikleri." },
                { icon: Target, baslik: "Batma Oranı", aciklama: "İçeriğini kaç kişinin beğenmeden terk ettiğini öğren." },
                { icon: TrendingUp, baslik: "Büyüme Analizi", aciklama: "Aylık aktivite, trendler ve performans kıyaslaması." },
                { icon: Users, baslik: "Topluluk Etkisi", aciklama: "Takipçi/takip oranı ve topluluk içindeki konumun." },
                { icon: Star, baslik: "Proje Puanlama", aciklama: "Özel algoritmamızla genel etki skoru hesaplaması." },
                { icon: Zap, baslik: "Büyüme Önerileri", aciklama: "Daha fazla kullanıcıya ulaşmak için somut ipuçları." },
              ].map((ozellik, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 + i * 0.1 }}
                  className="flex flex-col items-center text-center p-4 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-primary/20 hover:bg-white/[0.04] transition-all"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                    <ozellik.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-sm sm:text-base mb-1">{ozellik.baslik}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{ozellik.aciklama}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
