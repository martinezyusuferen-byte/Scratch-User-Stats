import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Search, BarChart2, Target, TrendingUp, Users, Zap, Star, ArrowRight } from "lucide-react";

const ornekKullanicilar = ["griffpatch", "Will_Wam", "ceebee", "ScratchCat"];

export default function Home() {
  const [, setLocation] = useLocation();
  const [aramaInput, setAramaInput] = useState("");

  const handleArama = (e: React.FormEvent) => {
    e.preventDefault();
    const val = aramaInput.trim();
    if (val) setLocation(`/kullanici/${encodeURIComponent(val)}`);
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
          alt="Arka plan"
          className="w-full h-full object-cover opacity-35 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-6xl px-4 sm:px-6 flex flex-col items-center py-12">
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
          className="w-full max-w-2xl mb-5"
        >
          <form onSubmit={handleArama} className="relative group">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/40 via-accent/40 to-primary/40 blur-xl opacity-0 group-focus-within:opacity-60 transition-opacity duration-500" />
            <div className="relative flex items-center bg-white/[0.06] border border-white/10 focus-within:border-primary/60 rounded-2xl px-5 py-4 transition-all duration-300 backdrop-blur-xl">
              <Search className="w-5 h-5 text-muted-foreground mr-3 shrink-0 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                value={aramaInput}
                onChange={(e) => setAramaInput(e.target.value)}
                placeholder="Scratch kullanıcı adı gir..."
                className="flex-1 bg-transparent border-none outline-none text-base text-white placeholder:text-white/30"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={!aramaInput.trim()}
                className="ml-3 px-4 py-2 rounded-xl bg-primary hover:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0"
              >
                Analiz Et <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-wrap items-center gap-2 justify-center mb-4"
        >
          <span className="text-xs text-muted-foreground">Örnek:</span>
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-16 sm:mt-20 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 w-full"
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

      </div>
    </div>
  );
}
