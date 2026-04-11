import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Search, BarChart2, Target, TrendingUp, Users, Zap, Star, Shield, Lock, Sparkles, ArrowRight, Bot, Eye, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const ornekKullanicilar = ["griffpatch", "Will_Wam", "ceebee", "ScratchCat"];

export default function Home() {
  const [username, setUsername] = useState("");
  const [hesapBagli, setHesapBagli] = useState(false);
  const [baglanYukleniyor, setBaglanYukleniyor] = useState(false);
  const [, setLocation] = useLocation();

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setLocation(`/kullanici/${encodeURIComponent(username.trim())}`);
    }
  };

  const handleBagla = async () => {
    if (!username.trim()) return;
    setBaglanYukleniyor(true);
    await new Promise((r) => setTimeout(r, 1200));
    setHesapBagli(true);
    setBaglanYukleniyor(false);
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full mb-6"
        >
          <div className="glass-panel neon-glow rounded-3xl p-5 sm:p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-display font-bold">YouTube Studio tarzı ana panel</h2>
                <p className="text-sm text-muted-foreground">Hesabını bağla, gizlilik notlarını gör ve derin analiz panelini aç.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border", hesapBagli ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-white/5 text-white/70 border-white/10")}>
                {hesapBagli ? "Hesap bağlandı" : "Bağlantı bekleniyor"}
              </div>
              <div className="text-xs text-muted-foreground hidden sm:block">Giriş olmadan da genel analiz görülebilir</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-10"
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
            Herhangi bir Scratch kullanıcısının derinlemesine istatistiklerini, etkileşim metriklerini, büyüme önerilerini ve proje potansiyelini görüntüle.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          onSubmit={handleAnalyze}
          className="w-full max-w-2xl relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500" />
          <div className="relative flex items-center bg-background/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl">
            <div className="pl-3 sm:pl-4 pr-2">
              <Search className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Scratch kullanıcı adı gir..."
              className="flex-1 bg-transparent border-none outline-none text-base sm:text-xl text-white placeholder:text-white/30 px-2 py-3 sm:py-4 font-display"
              required
            />
            <button
              type="submit"
              disabled={!username.trim()}
              className={cn(
                "px-5 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 whitespace-nowrap",
                username.trim()
                  ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(255,107,0,0.4)] hover:bg-primary/90 hover:scale-105"
                  : "bg-white/10 text-white/30 cursor-not-allowed"
              )}
            >
              Analiz Et
            </button>
          </div>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="w-full max-w-2xl mt-4"
        >
          <div className="glass-panel rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Gizlilik ve bağlantı</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Hesabı doğrudan Scratch bağlantısıyla analiz ediyoruz. Şifre istemiyoruz; sadece genel profil verileri çekilir.
                  </p>
                </div>
              </div>
              <button
                onClick={handleBagla}
                disabled={!username.trim() || baglanYukleniyor}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {baglanYukleniyor ? "Bağlanıyor..." : hesapBagli ? "Yeniden bağla" : "Hesabımı bağla"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: Lock, baslik: "Güvenli", aciklama: "Şifre saklanmaz." },
                { icon: Eye, baslik: "Şeffaf", aciklama: "Ne çektiğimizi açıklar." },
                { icon: Heart, baslik: "Kontrollü", aciklama: "İstediğinde kaldırırsın." },
              ].map((k, i) => (
                <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                    <k.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{k.baslik}</div>
                    <div className="text-xs text-muted-foreground">{k.aciklama}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-5 flex flex-wrap items-center gap-2 justify-center"
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.15 }}
          className="mt-8 w-full grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {[
            { label: "Son Projeniz", value: "Viral", note: "En yüksek etkileşimli proje öne çıkar" },
            { label: "Tahmini Büyüme", value: "+18%", note: "Düzenli paylaşım varsa daha da artar" },
            { label: "Topluluk Sinyali", value: "Güçlü", note: "Takipçi / favori oranı yüksek hesaplar" },
          ].map((m, i) => (
            <div key={i} className="glass-panel rounded-2xl p-5">
              <div className="text-xs text-muted-foreground">{m.label}</div>
              <div className="mt-2 text-3xl font-display font-bold text-gradient">{m.value}</div>
              <div className="mt-2 text-sm text-muted-foreground">{m.note}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
