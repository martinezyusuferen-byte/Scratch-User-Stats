import { Router, type IRouter } from "express";

const router: IRouter = Router();

const SCRATCH_API = "https://api.scratch.mit.edu";
const SCRATCH_CDN = "https://cdn2.scratch.mit.edu";

// ── Basit bellek önbelleği (5 dakika TTL) ──
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function cacheGet(key: string) {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > CACHE_TTL) { cache.delete(key); return null; }
  return e.data;
}
function cacheSet(key: string, data: any) {
  if (cache.size > 200) {
    const oldest = Array.from(cache.keys())[0];
    cache.delete(oldest);
  }
  cache.set(key, { data, ts: Date.now() });
}

async function doFetch(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { "User-Agent": "ScratchAnalyzer/1.0", "Accept": "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    const err = new Error(`Scratch API error: ${res.status}`);
    (err as any).status = res.status;
    throw err;
  }
  const data = await res.json();
  // Scratch bazen HTTP 200 ile rate limit mesajı döndürür: {"response":"Too many requests"}
  if (data && typeof data === "object" && !Array.isArray(data) && "response" in data) {
    const responseText = String(data.response);
    const errStatus = responseText.toLowerCase().includes("not found") ? 404 : 429;
    const err = new Error(`Scratch API: ${data.response}`);
    (err as any).status = errStatus;
    throw err;
  }
  // Scratch 200 ile 404: {"code":"NotFound"}
  if (data && typeof data === "object" && !Array.isArray(data) && (data as any).code === "NotFound") {
    const err = new Error("Scratch: NotFound");
    (err as any).status = 404;
    throw err;
  }
  return data;
}

async function fetchScratch(url: string): Promise<any> {
  const cached = cacheGet(url);
  if (cached) return cached;

  try {
    const data = await doFetch(url);
    cacheSet(url, data);
    return data;
  } catch (e: any) {
    if (e?.status === 429) {
      // Rate limit — 2 saniye bekle ve bir kez daha dene
      await new Promise(r => setTimeout(r, 2000));
      const data2 = await doFetch(url);
      cacheSet(url, data2);
      return data2;
    }
    throw e;
  }
}

function hesaplaRutbe(skor: number) {
  if (skor >= 90) return { rutbe: "Efsane", rutbe_ikonu: "🏆" };
  if (skor >= 78) return { rutbe: "Yıldız Yapımcı", rutbe_ikonu: "⭐" };
  if (skor >= 62) return { rutbe: "Yükselen Yıldız", rutbe_ikonu: "🚀" };
  if (skor >= 46) return { rutbe: "Aktif Yapımcı", rutbe_ikonu: "🎨" };
  if (skor >= 30) return { rutbe: "Kaşif", rutbe_ikonu: "🔍" };
  return { rutbe: "Başlangıç", rutbe_ikonu: "🌱" };
}

function hesaplaSkor(istatistikler: any) {
  const {
    followers, total_projects, total_loves, total_views,
    love_to_view_ratio, projects_per_month, batma_orani,
    etkilesim_orani, verimlilik_skoru,
  } = istatistikler;

  let etkilesim = 0;
  if (love_to_view_ratio > 0) etkilesim += Math.min(35, love_to_view_ratio * 3500);
  if (etkilesim_orani > 0) etkilesim += Math.min(35, etkilesim_orani * 2);
  if (batma_orani < 90) etkilesim += Math.min(30, (90 - batma_orani) / 3);
  etkilesim = Math.round(Math.min(100, etkilesim));

  let topluluk = 0;
  if (followers > 0) topluluk += Math.min(55, Math.log10(followers + 1) * 22);
  topluluk += Math.min(25, (istatistikler.takip_orani || 1) * 5);
  if (istatistikler.total_remixes > 0)
    topluluk += Math.min(20, (istatistikler.total_remixes / total_projects) * 20);
  topluluk = Math.round(Math.min(100, topluluk));

  let yaraticilik = 0;
  if (total_projects > 0) yaraticilik += Math.min(40, Math.log10(total_projects + 1) * 22);
  if (projects_per_month > 0) yaraticilik += Math.min(30, projects_per_month * 12);
  yaraticilik += Math.min(30, verimlilik_skoru);
  yaraticilik = Math.round(Math.min(100, yaraticilik));

  let tutarlilik = 0;
  if (projects_per_month >= 1) tutarlilik += 40;
  else tutarlilik += projects_per_month * 40;
  if (istatistikler.days_on_scratch > 0) {
    const ort = total_projects / (istatistikler.days_on_scratch / 30);
    tutarlilik += Math.min(40, ort * 22);
  }
  if (istatistikler.aktif_mi) tutarlilik += 20;
  tutarlilik = Math.round(Math.min(100, tutarlilik));

  let buyume_potansiyeli = 0;
  if (followers < 500) buyume_potansiyeli += 45;
  else if (followers < 5000) buyume_potansiyeli += 25;
  else buyume_potansiyeli += 10;
  if (etkilesim_orani > 5) buyume_potansiyeli += 30;
  if (projects_per_month > 0.5) buyume_potansiyeli += 25;
  buyume_potansiyeli = Math.round(Math.min(100, buyume_potansiyeli));

  const genel = Math.round(
    etkilesim * 0.30 + topluluk * 0.25 + yaraticilik * 0.20 +
    tutarlilik * 0.15 + buyume_potansiyeli * 0.10
  );

  const { rutbe, rutbe_ikonu } = hesaplaRutbe(genel);
  return { genel, etkilesim, yaraticilik, topluluk, tutarlilik, buyume_potansiyeli, rutbe, rutbe_ikonu, yuzdeLik: Math.min(99, genel) };
}

function uretIcegorular(istatistikler: any, skor: any, projeler: any[]) {
  const guclu_yonler: string[] = [];
  const gelistirilecek_yonler: string[] = [];
  const buyume_onerileri: any[] = [];

  if (istatistikler.followers > 100)
    guclu_yonler.push(`${istatistikler.followers.toLocaleString('tr-TR')} sadık takipçi`);
  if (istatistikler.average_loves_per_project > 20)
    guclu_yonler.push("Proje başına yüksek beğeni");
  if (istatistikler.etkilesim_orani > 5)
    guclu_yonler.push("Mükemmel etkileşim oranı");
  if (istatistikler.total_projects > 10)
    guclu_yonler.push(`${istatistikler.total_projects} proje ile üretken yapımcı`);
  if (istatistikler.projects_per_month >= 2)
    guclu_yonler.push("Düzenli yayın programı");
  if (istatistikler.total_remixes > 0)
    guclu_yonler.push("Remix topluluğunda aktif");
  if (istatistikler.total_views > 10000)
    guclu_yonler.push(`${istatistikler.total_views.toLocaleString('tr-TR')} görüntüleme ile geniş kitle`);
  if (istatistikler.batma_orani < 85)
    guclu_yonler.push("Düşük batma oranı — içerik kaliteli");
  if (guclu_yonler.length === 0) guclu_yonler.push("Hesap aktif ve geliştirme aşamasında");

  if (istatistikler.followers < 50)
    gelistirilecek_yonler.push("Takipçi sayısı düşük");
  if (istatistikler.average_loves_per_project < 5)
    gelistirilecek_yonler.push("Projeler daha fazla etkileşim kazanabilir");
  if (istatistikler.batma_orani > 92)
    gelistirilecek_yonler.push("Batma oranı çok yüksek — içerik beklentiyi karşılamıyor");
  if (istatistikler.projects_per_month < 0.5)
    gelistirilecek_yonler.push("Çok seyrek yayın yapılıyor");
  if (istatistikler.total_projects < 5)
    gelistirilecek_yonler.push("Proje portföyü yetersiz");
  if (!istatistikler.aktif_mi)
    gelistirilecek_yonler.push("Hesap görünürde aktif değil");
  if (gelistirilecek_yonler.length === 0)
    gelistirilecek_yonler.push("Harika çalışmaya devam et!");

  if (istatistikler.followers < 1000) {
    buyume_onerileri.push({
      kategori: "Topluluk",
      oneri: "Kendi türündeki popüler kullanıcıları takip et ve projelerine yorum bırak. Stüdyolara katıl.",
      oncelik: "yuksek",
      etki: "Ayda %20–50 takipçi artışı sağlayabilir"
    });
  }
  if (istatistikler.projects_per_month < 1) {
    buyume_onerileri.push({
      kategori: "Tutarlılık",
      oneri: "Ayda en az 1–2 proje paylaş. Kısa projeler bile takipçi bağlılığını artırır.",
      oncelik: "yuksek",
      etki: "Düzenli paylaşım takipçi tutmayı %40 iyileştirir"
    });
  }
  if (istatistikler.batma_orani > 90) {
    buyume_onerileri.push({
      kategori: "İçerik Kalitesi",
      oneri: "Proje kapak resimlerini daha ilgi çekici yap. İyi bir kapak, tıklamayı üç katına çıkarabilir.",
      oncelik: "yuksek",
      etki: "İyi kapak resmi beğeniyi %30 artırır"
    });
  }
  buyume_onerileri.push({
    kategori: "Açıklama",
    oneri: "Proje açıklamalarına ayrıntılı talimatlar yaz. İyi belgelenmiş projeler daha çok etkileşim alır.",
    oncelik: "orta",
    etki: "Net açıklama oturum süresini %25 artırır"
  });
  buyume_onerileri.push({
    kategori: "Stüdyolar",
    oneri: "Proje türlerinle ilgili aktif Scratch stüdyolarına katıl. Stüdyolar binlerce kullanıcıya erişim sağlar.",
    oncelik: "orta",
    etki: "Stüdyo üyeliği proje görünürlüğünü ikiye katlar"
  });

  let icerik_turu = "Genel Yapımcı";
  if (istatistikler.total_remixes > istatistikler.total_projects * 0.5) icerik_turu = "Remix Sanatçısı";
  else if (istatistikler.average_loves_per_project > 50) icerik_turu = "Viral Yapımcı";
  else if (istatistikler.projects_per_month > 3) icerik_turu = "Üretken Yapımcı";
  else if (istatistikler.followers > 1000) icerik_turu = "Topluluk Lideri";

  let aktivite_seviyesi = "Pasif";
  if (istatistikler.projects_per_month > 4) aktivite_seviyesi = "Çok Aktif";
  else if (istatistikler.projects_per_month > 2) aktivite_seviyesi = "Aktif";
  else if (istatistikler.projects_per_month > 0.5) aktivite_seviyesi = "Orta";
  else if (istatistikler.aktif_mi) aktivite_seviyesi = "Ara Sıra";

  let etkilesim_kalitesi = "Düşük";
  if (skor.etkilesim > 70) etkilesim_kalitesi = "Mükemmel";
  else if (skor.etkilesim > 50) etkilesim_kalitesi = "İyi";
  else if (skor.etkilesim > 30) etkilesim_kalitesi = "Orta";

  const aylikVeriler = istatistikler.aylik_veriler || [];
  let buyume_trendi = "➡️ Sabit";
  if (aylikVeriler.length >= 6) {
    const son3 = aylikVeriler.slice(-3).reduce((s: number, a: any) => s + a.sayi, 0);
    const once3 = aylikVeriler.slice(-6, -3).reduce((s: number, a: any) => s + a.sayi, 0);
    if (son3 > once3 * 1.2) buyume_trendi = "📈 Yükselen";
    else if (son3 < once3 * 0.8) buyume_trendi = "📉 Düşen";
  }

  const en_iyi_paylasim_zamani = "Cuma–Cumartesi akşamı (17:00–21:00)";

  let icerik_tutarliligi = "Düşük";
  if (istatistikler.projects_per_month >= 3) icerik_tutarliligi = "Çok Yüksek";
  else if (istatistikler.projects_per_month >= 1.5) icerik_tutarliligi = "Yüksek";
  else if (istatistikler.projects_per_month >= 0.5) icerik_tutarliligi = "Orta";

  return {
    guclu_yonler, gelistirilecek_yonler, buyume_onerileri,
    icerik_turu, aktivite_seviyesi, etkilesim_kalitesi,
    buyume_trendi, en_iyi_paylasim_zamani, icerik_tutarliligi,
  };
}

function getAylikAktivite(projeler: any[]) {
  const ayMap: Record<string, number> = {};
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().substring(0, 7);
    ayMap[key] = 0;
  }
  for (const p of projeler) {
    const tarih = p.history?.shared || p.share_date;
    if (tarih) {
      const key = tarih.substring(0, 7);
      if (key in ayMap) ayMap[key]++;
    }
  }
  return Object.entries(ayMap).map(([ay, sayi]) => ({ ay, sayi }));
}

// ──────────────────────────────────────────────────────────────────────
// Scratch'in kendi API'sinin veremediği 12 benzersiz superlative özellik
// ──────────────────────────────────────────────────────────────────────
function hesaplaSuperlative(projeler: any[], istatistikler: any, skor: any) {

  // 1. KELIME DNA'SI — Proje başlıklarındaki en sık kullanılan kelimeleri çıkar
  const stopWords = new Set(["the","a","an","and","or","of","in","on","for","to","my","i","is","it","this","that","with","by","at","be","are","was","were","has","have","had","but","not","from","as","an","its","your","their","our","we","us","you","he","she","they","what","when","how","why","which","who","will","can","do","did","does","if","so","then","than","more","also","about","new","make","made","get","got","let","just","very","all","into","up","out","no","me","him","her","one","two","three","four","five","six","seven","eight","nine","ten"]);
  const wordCount: Record<string, number> = {};
  for (const p of projeler) {
    const words = (p.title || "").toLowerCase().split(/[\s\-_!?.,;:()[\]{}'"]+/);
    for (const w of words) {
      if (w.length > 2 && !stopWords.has(w)) {
        wordCount[w] = (wordCount[w] || 0) + 1;
      }
    }
  }
  const kelime_dna = Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([kelime, sayi]) => ({ kelime, sayi }));

  // 2. VİRAL POTANSİYEL MOTORU — Birden fazla faktörün ağırlıklı hesabı
  const loveVelocity = istatistikler.average_loves_per_project /
    Math.max(1, istatistikler.days_on_scratch / 30);
  const remixMultiplier = 1 + Math.min(2, istatistikler.remix_rate * 3);
  const engagementCascade = Math.min(1, istatistikler.etkilesim_orani / 15);
  const diversityFactor = Math.min(1, Object.keys(wordCount).length / 20);
  const rawViralScore = (
    Math.min(40, loveVelocity * 8) +
    Math.min(25, (remixMultiplier - 1) * 25) +
    engagementCascade * 20 +
    diversityFactor * 15
  );
  const viral_potansiyel = Math.round(Math.min(100, rawViralScore));
  let viral_seviye = "Düşük";
  if (viral_potansiyel >= 75) viral_seviye = "Patlayıcı";
  else if (viral_potansiyel >= 55) viral_seviye = "Yüksek";
  else if (viral_potansiyel >= 35) viral_seviye = "Orta";
  const viral_faktorler = [];
  if (loveVelocity > 2) viral_faktorler.push("Hızlı beğeni kazanıyor");
  if (remixMultiplier > 1.5) viral_faktorler.push("Güçlü remix etkisi");
  if (engagementCascade > 0.5) viral_faktorler.push("Yüksek etkileşim zinciri");
  if (diversityFactor > 0.5) viral_faktorler.push("Çeşitli içerik anahtar kelimeleri");

  // 3. İÇERİK KATEGORİ DEDEKTÖRÜ — Başlıklardan otomatik tür tespiti
  const gameWords = ["game","oyun","quiz","puzzle","platformer","adventure","rpg","shooter","racing","fight","battle","war","defend","escape","maze","run","jump","fly"];
  const animWords = ["animation","animasyon","movie","film","cartoon","story","hikaye","episode","bölüm","part","series","seri"];
  const musicWords = ["music","müzik","song","şarkı","beat","remix","piano","guitar","drum","melody","sound","ses"];
  const artWords = ["art","sanat","draw","çizim","pixel","design","tasarım","paint","color","renk","gallery","galeri"];
  const interactiveWords = ["interactive","interaktif","simulator","simülasyon","tool","araç","calculator","hesap","maker","generator"];

  const kategoriler: Record<string, number> = { Oyun: 0, Animasyon: 0, Müzik: 0, Sanat: 0, İnteraktif: 0, Diğer: 0 };
  for (const p of projeler) {
    const title = (p.title || "").toLowerCase();
    const desc = (p.description || "").toLowerCase();
    const combined = title + " " + desc;
    if (gameWords.some(w => combined.includes(w))) kategoriler["Oyun"]++;
    else if (animWords.some(w => combined.includes(w))) kategoriler["Animasyon"]++;
    else if (musicWords.some(w => combined.includes(w))) kategoriler["Müzik"]++;
    else if (artWords.some(w => combined.includes(w))) kategoriler["Sanat"]++;
    else if (interactiveWords.some(w => combined.includes(w))) kategoriler["İnteraktif"]++;
    else kategoriler["Diğer"]++;
  }
  const total_k = projeler.length || 1;
  const icerik_dagilimi = Object.entries(kategoriler)
    .map(([kategori, sayi]) => ({ kategori, sayi, oran: Math.round((sayi / total_k) * 100) }))
    .filter(k => k.sayi > 0)
    .sort((a, b) => b.sayi - a.sayi);
  const dominant_tur = icerik_dagilimi[0]?.kategori || "Genel";

  // 4. ETKİLEŞİM ŞELALE HUNİSİ — Her aşamada ne kadar kayıp var
  const huni_goruntulemeler = istatistikler.total_views;
  const huni_begeniler = istatistikler.total_loves;
  const huni_favoriler = istatistikler.total_favorites;
  const huni_remixler = istatistikler.total_remixes;
  const huni_yorumlar = istatistikler.total_comments;
  const etkilesim_hunisi = {
    goruntulemeler: huni_goruntulemeler,
    begeniler: huni_begeniler,
    begeni_orani: huni_goruntulemeler > 0 ? Math.round((huni_begeniler / huni_goruntulemeler) * 10000) / 100 : 0,
    favoriler: huni_favoriler,
    favori_orani: huni_begeniler > 0 ? Math.round((huni_favoriler / huni_begeniler) * 10000) / 100 : 0,
    remixler: huni_remixler,
    remix_orani: huni_favoriler > 0 ? Math.round((huni_remixler / huni_favoriler) * 10000) / 100 : 0,
    yorumlar: huni_yorumlar,
    yorum_orani: huni_begeniler > 0 ? Math.round((huni_yorumlar / huni_begeniler) * 10000) / 100 : 0,
  };

  // 5. PROJE TİER SİSTEMİ — Her proje S/A/B/C/D sınıfına giriyor
  const tierSiniflama = (p: any) => {
    const views = p.stats?.views || p.views || 0;
    const loves = p.stats?.loves || p.loves || 0;
    const ratio = views > 0 ? loves / views : 0;
    const score = Math.log10(views + 1) * 30 + ratio * 300;
    if (score >= 150) return "S";
    if (score >= 100) return "A";
    if (score >= 60) return "B";
    if (score >= 30) return "C";
    return "D";
  };
  const tier_sayilari = { S: 0, A: 0, B: 0, C: 0, D: 0 };
  for (const p of projeler) {
    const tier = tierSiniflama(p);
    tier_sayilari[tier as keyof typeof tier_sayilari]++;
  }
  const proje_tierleri = Object.entries(tier_sayilari)
    .map(([tier, sayi]) => ({
      tier,
      sayi,
      oran: total_k > 0 ? Math.round((sayi / total_k) * 100) : 0,
      renk: tier === "S" ? "#FFD700" : tier === "A" ? "#FF6B35" : tier === "B" ? "#7C3AED" : tier === "C" ? "#0EA5E9" : "#6B7280"
    }));

  // 6. BÜYÜME HIZ MOTORU + 3/6/12 AYLIK PROJEKSİYON
  const monthlyGrowthBase = istatistikler.tahmini_aylik_buyume || 0;
  const buyume_projeksiyonu = [
    { ay: "3 Ay", tahmini_takipci: Math.round(istatistikler.followers * (1 + monthlyGrowthBase / 100) ** 3) },
    { ay: "6 Ay", tahmini_takipci: Math.round(istatistikler.followers * (1 + monthlyGrowthBase / 100) ** 6) },
    { ay: "12 Ay", tahmini_takipci: Math.round(istatistikler.followers * (1 + monthlyGrowthBase / 100) ** 12) },
  ];
  const buyume_hizi_etiketi = monthlyGrowthBase >= 10 ? "Roket 🚀" :
    monthlyGrowthBase >= 5 ? "Hızlı 🏃" :
    monthlyGrowthBase >= 2 ? "Stabil 📈" : "Yavaş 🐢";

  // 7. BAŞARI DNA'SI — En başarılı projelerin ortak özellikleri
  const topProjects = [...projeler]
    .sort((a, b) => (b.stats?.loves || b.loves || 0) - (a.stats?.loves || a.loves || 0))
    .slice(0, 5);
  const avgTitleLen = topProjects.length > 0
    ? Math.round(topProjects.reduce((s, p) => s + (p.title || "").length, 0) / topProjects.length)
    : 0;
  const avgDescLen = topProjects.length > 0
    ? Math.round(topProjects.reduce((s, p) => s + (p.description || "").length, 0) / topProjects.length)
    : 0;
  const hasDescPercent = topProjects.length > 0
    ? Math.round((topProjects.filter(p => (p.description || "").length > 20).length / topProjects.length) * 100)
    : 0;
  const basari_dna = {
    ortalama_baslik_uzunlugu: avgTitleLen,
    ortalama_aciklama_uzunlugu: avgDescLen,
    aciklama_olan_oran: hasDescPercent,
    basari_formulu: avgDescLen > 80
      ? "Uzun açıklama + detaylı talimatlar"
      : avgTitleLen > 20
      ? "Dikkat çekici uzun başlıklar"
      : "Kısa ve öz içerik",
    ipucu: hasDescPercent < 80 ? "En iyi projelerine daha fazla açıklama ekle" : "Açıklama alışkanlığın mükemmel!"
  };

  // 8. HAYRAN GÜÇ ENDEKSİ — Favoriler/Beğeniler oranı sadık hayran göstergesi
  const fan_gucu_orani = istatistikler.total_loves > 0
    ? Math.round((istatistikler.total_favorites / istatistikler.total_loves) * 100)
    : 0;
  let hayran_sadakati = "Düşük";
  let hayran_aciklama = "İzleyiciler çoğunlukla bir kez bakıp geçiyor";
  if (fan_gucu_orani >= 80) { hayran_sadakati = "Ultra Sadık"; hayran_aciklama = "İzleyicilerin büyük çoğunluğu favorileyerek geri dönmek istiyor"; }
  else if (fan_gucu_orani >= 60) { hayran_sadakati = "Güçlü"; hayran_aciklama = "İzleyicilerin yarısından fazlası içeriği kaydedip saklıyor"; }
  else if (fan_gucu_orani >= 40) { hayran_sadakati = "Orta"; hayran_aciklama = "Solid bir hayran tabanı var, büyütmek mümkün"; }
  const hayran_guc_endeksi = { oran: fan_gucu_orani, seviye: hayran_sadakati, aciklama: hayran_aciklama };

  // 9. SCRATCH ALGORİTMA UYUMU — Keşfedilme ihtimali hesabı
  const descScore = projeler.filter(p => (p.description || "").length > 40).length / Math.max(1, projeler.length) * 30;
  const regularityScore = Math.min(25, istatistikler.projects_per_month * 10);
  const engagementScore = Math.min(25, istatistikler.etkilesim_orani * 2);
  const remixScore = Math.min(20, istatistikler.remix_rate * 40);
  const algoritma_skoru = Math.round(descScore + regularityScore + engagementScore + remixScore);
  let algoritma_durumu = "Düşük Görünürlük";
  if (algoritma_skoru >= 75) algoritma_durumu = "Keşfet'te Öne Çıkıyor";
  else if (algoritma_skoru >= 55) algoritma_durumu = "İyi Görünürlük";
  else if (algoritma_skoru >= 35) algoritma_durumu = "Orta Görünürlük";
  const algoritma_uyumu = {
    skor: algoritma_skoru,
    durum: algoritma_durumu,
    iyilestirme: descScore < 20 ? "Tüm projelere detaylı açıklama ekle" :
      regularityScore < 15 ? "Daha düzenli paylaşım yap" :
      engagementScore < 15 ? "Yorumlara cevap vererek etkileşimi artır" :
      "Harika! Görünürlük zirveye yakın"
  };

  // 10. PROJE MOMENTUM — Son projeler eski projelerden iyi mi?
  const sortedByDate = [...projeler].sort((a, b) => {
    return new Date(b.history?.shared || b.share_date || 0).getTime() -
           new Date(a.history?.shared || a.share_date || 0).getTime();
  });
  const yeniProjeler = sortedByDate.slice(0, Math.max(1, Math.floor(projeler.length * 0.3)));
  const eskiProjeler = sortedByDate.slice(Math.floor(projeler.length * 0.7));
  const yeniOrt = yeniProjeler.length > 0
    ? yeniProjeler.reduce((s, p) => s + (p.stats?.loves || p.loves || 0), 0) / yeniProjeler.length : 0;
  const eskiOrt = eskiProjeler.length > 0
    ? eskiProjeler.reduce((s, p) => s + (p.stats?.loves || p.loves || 0), 0) / eskiProjeler.length : 0;
  const momentum_degisim = eskiOrt > 0 ? Math.round(((yeniOrt - eskiOrt) / eskiOrt) * 100) : 0;
  const proje_momentum = {
    yeni_proje_ort_begeni: Math.round(yeniOrt * 10) / 10,
    eski_proje_ort_begeni: Math.round(eskiOrt * 10) / 10,
    degisim_yuzdesi: momentum_degisim,
    yorum: momentum_degisim > 20 ? "🔥 Gittikçe daha iyi oluyor!" :
      momentum_degisim > 0 ? "📈 Hafif yukarı trend" :
      momentum_degisim > -20 ? "➡️ Stabil performans" : "📉 Eski projeler daha iyiydi",
  };

  // 11. TOPLULUK KONUMLANDIRMASI — Yüzdelik dilim ve karşılaştırma
  const genel_skor = skor.genel;
  let yuzdelik_dilim = "Alt %50";
  if (genel_skor >= 85) yuzdelik_dilim = "En İyi %5";
  else if (genel_skor >= 75) yuzdelik_dilim = "En İyi %10";
  else if (genel_skor >= 65) yuzdelik_dilim = "En İyi %20";
  else if (genel_skor >= 50) yuzdelik_dilim = "En İyi %35";

  const ortalama_scratch_kullanici = {
    projeler: 5,
    takipci: 12,
    goruntuleme: 800,
    begeni: 30,
  };
  const topluluk_konumlama = {
    yuzdelik_dilim,
    proje_kiyasi: Math.round((istatistikler.total_projects / ortalama_scratch_kullanici.projeler) * 10) / 10,
    goruntuleme_kiyasi: Math.round((istatistikler.total_views / ortalama_scratch_kullanici.goruntuleme) * 10) / 10,
    begeni_kiyasi: Math.round((istatistikler.total_loves / ortalama_scratch_kullanici.begeni) * 10) / 10,
    ozet: genel_skor >= 65 ? "Scratch topluluğunun öne çıkan üreticilerinden birisin" :
      genel_skor >= 45 ? "Scratch'te ortalamanın üzerinde bir yapımcısın" :
      "Büyüme yolculuğunun başında, potansiyel çok yüksek"
  };

  // 12. BAŞLIK OPTİMİZASYON SKORU — Başlıkların ne kadar arama dostu olduğu
  const baslik_skorlari = projeler.map(p => {
    const title = p.title || "";
    let s = 0;
    if (title.length >= 8 && title.length <= 40) s += 40;
    else if (title.length > 40) s += 20;
    if (/[!?]/.test(title)) s += 20;
    if (title !== title.toLowerCase()) s += 20;
    if (/\d/.test(title)) s += 10;
    if (/(v\d|version|bölüm|part|ep\.)/i.test(title)) s += 10;
    return s;
  });
  const ort_baslik_skoru = baslik_skorlari.length > 0
    ? Math.round(baslik_skorlari.reduce((a, b) => a + b, 0) / baslik_skorlari.length)
    : 0;
  const baslik_optimizasyon = {
    skor: ort_baslik_skoru,
    seviye: ort_baslik_skoru >= 70 ? "Mükemmel" : ort_baslik_skoru >= 50 ? "İyi" : ort_baslik_skoru >= 30 ? "Orta" : "Geliştirilebilir",
    ipucu: ort_baslik_skoru < 50 ? "Başlıkları 8–40 karakter arasında tut, soru işareti veya ünlem ekle" : "Başlık stratejin sağlam!"
  };

  return {
    kelime_dna,
    viral_potansiyel: { skor: viral_potansiyel, seviye: viral_seviye, faktorler: viral_faktorler },
    icerik_dagilimi,
    dominant_tur,
    etkilesim_hunisi,
    proje_tierleri,
    buyume_projeksiyonu,
    buyume_hizi_etiketi,
    basari_dna,
    hayran_guc_endeksi,
    algoritma_uyumu,
    proje_momentum,
    topluluk_konumlama,
    baslik_optimizasyon,
  };
}

const mapProject = (p: any) => ({
  id: p.id,
  title: p.title,
  description: p.description || "",
  thumbnail_url: p.image || `${SCRATCH_CDN}/projects/${p.id}/thumbnail`,
  loves: p.stats?.loves || p.loves || 0,
  favorites: p.stats?.favorites || p.favorites || 0,
  views: p.stats?.views || p.views || 0,
  remixes: p.stats?.remixes || p.remixes || 0,
  created: p.history?.created || p.created || "",
  modified: p.history?.modified || p.modified || "",
  share_date: p.history?.shared || p.share_date || "",
  comments_allowed: p.comments_allowed !== false,
  url: `https://scratch.mit.edu/projects/${p.id}`,
});

router.get("/user/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const profileData = await fetchScratch(`${SCRATCH_API}/users/${username}`);

    // Projeleri çek (iki sayfa, 80 proje)
    let projeler: any[] = [];
    let projelerRateLimit = false;
    try {
      const [p1, p2] = await Promise.all([
        fetchScratch(`${SCRATCH_API}/users/${username}/projects?limit=40&offset=0`).catch((e: any) => {
          if (e?.status === 429) projelerRateLimit = true;
          return [];
        }),
        fetchScratch(`${SCRATCH_API}/users/${username}/projects?limit=40&offset=40`).catch((e: any) => {
          if (e?.status === 429) projelerRateLimit = true;
          return [];
        }),
      ]);
      projeler = [...(Array.isArray(p1) ? p1 : []), ...(Array.isArray(p2) ? p2 : [])];
    } catch (_) {}

    // Not: Scratch API yorum sayısını herkese açık endpoint'te vermez.
    const total_comments = -1;

    // Takipçi sayısı — ScratchDB ile dene, olmadı paginated fetch
    let followers = 0;
    let following = 0;

    // Takipçi: ScratchDB dene → başarısız olursa sayfalı çekme (sayfa sayfa gerçek toplamı bul)
    let scratchDbOk = false;
    try {
      const dbRes = await fetch(`https://scratchdb.lefty.one/v3/user/info/${username}`, {
        headers: { "User-Agent": "ScratchAnalyzer/1.0" },
        signal: AbortSignal.timeout(3000),
      });
      if (dbRes.ok) {
        const dbData = await dbRes.json() as any;
        const dbFollowers = dbData?.statistics?.followers || 0;
        const dbFollowing = dbData?.statistics?.following || 0;
        if (dbFollowers > 0 || dbFollowing > 0) {
          followers = dbFollowers;
          following = dbFollowing;
          scratchDbOk = true;
        }
      }
    } catch (_) {}

    if (!scratchDbOk) {
      // Sayfalı çekme: en fazla 5 sayfa (200 takipçi), sayfalar arası 200ms bekleme
      try {
        let offset = 0;
        while (offset < 200) {
          const page: any[] = await fetchScratch(
            `${SCRATCH_API}/users/${username}/followers?limit=40&offset=${offset}`
          ).catch(() => []);
          if (!Array.isArray(page) || page.length === 0) break;
          followers += page.length;
          if (page.length < 40) break;
          offset += 40;
          await new Promise(r => setTimeout(r, 200));
        }
      } catch (_) {}

      try {
        let offset = 0;
        while (offset < 200) {
          const page: any[] = await fetchScratch(
            `${SCRATCH_API}/users/${username}/following?limit=40&offset=${offset}`
          ).catch(() => []);
          if (!Array.isArray(page) || page.length === 0) break;
          following += page.length;
          if (page.length < 40) break;
          offset += 40;
          await new Promise(r => setTimeout(r, 200));
        }
      } catch (_) {}
    }

    const total_projects = projeler.length;
    const total_loves = projeler.reduce((s: number, p: any) => s + (p.stats?.loves || 0), 0);
    const total_favorites = projeler.reduce((s: number, p: any) => s + (p.stats?.favorites || 0), 0);
    const total_views = projeler.reduce((s: number, p: any) => s + (p.stats?.views || 0), 0);
    const total_remixes = projeler.reduce((s: number, p: any) => s + (p.stats?.remixes || 0), 0);

    const average_loves_per_project = total_projects > 0 ? total_loves / total_projects : 0;
    const average_views_per_project = total_projects > 0 ? total_views / total_projects : 0;
    const love_to_view_ratio = total_views > 0 ? total_loves / total_views : 0;
    const remix_rate = total_projects > 0 ? total_remixes / total_projects : 0;
    const takip_orani = following > 0 ? followers / following : followers;
    // total_comments = -1 → yorum API'si kısıtlı, hesaplamada 0 olarak kullan
    const yorum_orani = 0;

    const joinDate = profileData.history?.joined || profileData.join_date || new Date().toISOString();
    const daysSinceJoin = Math.floor((Date.now() - new Date(joinDate).getTime()) / (1000 * 60 * 60 * 24));
    const monthsSinceJoin = daysSinceJoin / 30;
    const projects_per_month = monthsSinceJoin > 0 ? total_projects / monthsSinceJoin : 0;

    const batma_orani = total_views > 0
      ? Math.round(((total_views - total_loves) / total_views) * 100 * 10) / 10
      : 100;

    // Yorum API kısıtlı olduğu için etkileşim oranı hesabında yorumu dışarıda tut
    const etkilesim_orani = total_views > 0
      ? Math.round(((total_loves + total_favorites) / total_views) * 100 * 100) / 100
      : 0;

    const verimlilik_skoru = total_projects > 0
      ? Math.min(100, Math.round(((total_loves + total_favorites) / total_projects) / 10))
      : 0;

    const gunluk_goruntuleme = daysSinceJoin > 0
      ? Math.round(total_views / daysSinceJoin * 10) / 10 : 0;

    const sortedByDate = [...projeler].sort((a, b) =>
      new Date(b.history?.shared || b.share_date || 0).getTime() -
      new Date(a.history?.shared || a.share_date || 0).getTime()
    );

    const lastProjectDate = sortedByDate.length > 0
      ? (sortedByDate[0].history?.shared || sortedByDate[0].share_date || null) : null;
    const isActive = lastProjectDate
      ? (Date.now() - new Date(lastProjectDate).getTime()) < 1000 * 60 * 60 * 24 * 90 : false;

    const aylikProjeler = getAylikAktivite(projeler);

    const tahmini_aylik_buyume = Math.round(
      Math.min(50, (etkilesim_orani * 0.5 + projects_per_month * 2)) * 10
    ) / 10;

    const istatistikler = {
      followers, following, total_projects, total_loves, total_favorites,
      total_views, total_remixes, total_comments,
      average_loves_per_project: Math.round(average_loves_per_project * 10) / 10,
      average_views_per_project: Math.round(average_views_per_project * 10) / 10,
      love_to_view_ratio: Math.round(love_to_view_ratio * 1000) / 1000,
      remix_rate: Math.round(remix_rate * 100) / 100,
      days_on_scratch: daysSinceJoin,
      projects_per_month: Math.round(projects_per_month * 10) / 10,
      batma_orani, etkilesim_orani,
      yorum_orani: Math.round(yorum_orani * 10) / 10,
      takip_orani: Math.round(takip_orani * 10) / 10,
      gunluk_ortalama_goruntuleme: gunluk_goruntuleme,
      verimlilik_skoru,
      aktif_mi: isActive,
      aylik_veriler: aylikProjeler,
      tahmini_aylik_buyume,
    };

    const skor = hesaplaSkor(istatistikler);
    const icegorular = uretIcegorular(istatistikler, skor, projeler);
    const superlative = hesaplaSuperlative(projeler, istatistikler, skor);

    const sortedByLoves = [...projeler].sort((a, b) =>
      (b.stats?.loves || 0) - (a.stats?.loves || 0));
    const sortedByViews = [...projeler].sort((a, b) =>
      (b.stats?.views || 0) - (a.stats?.views || 0));

    const topProjects = sortedByLoves.slice(0, 6).map(mapProject);

    const zayif_proje_orani = total_projects > 0
      ? Math.round((projeler.filter((p: any) => (p.stats?.views || 0) < 100).length / total_projects) * 100) : 0;
    const guclu_proje_orani = total_projects > 0
      ? Math.round((projeler.filter((p: any) => (p.stats?.views || 0) >= 1000).length / total_projects) * 100) : 0;
    const remix_edilme_orani = total_views > 0
      ? Math.round((total_remixes / total_views) * 1000 * 10) / 10 : 0;

    let topluluk_etkisi = "Sınırlı";
    if (skor.topluluk >= 70) topluluk_etkisi = "Çok Güçlü";
    else if (skor.topluluk >= 50) topluluk_etkisi = "Güçlü";
    else if (skor.topluluk >= 30) topluluk_etkisi = "Orta";

    let hesap_yaslanma_hizi = "Durağan";
    if (projects_per_month >= 3) hesap_yaslanma_hizi = "Hızlı Gelişen";
    else if (projects_per_month >= 1) hesap_yaslanma_hizi = "Dengeli";
    else if (projects_per_month >= 0.3) hesap_yaslanma_hizi = "Yavaş";

    let karsilastirma_skoru = "Ortanın Altı";
    if (skor.genel >= 80) karsilastirma_skoru = "En İyi %10";
    else if (skor.genel >= 65) karsilastirma_skoru = "En İyi %25";
    else if (skor.genel >= 50) karsilastirma_skoru = "Ortalamanın Üstü";
    else if (skor.genel >= 35) karsilastirma_skoru = "Ortalama";

    let onerilen_tur = "Etkileşimli Hikaye";
    if (total_loves > total_views * 0.05) onerilen_tur = "Animasyon";
    else if (remix_rate > 0.3) onerilen_tur = "Remix & Sanat";
    else onerilen_tur = "Oyun";

    const profile = {
      username: profileData.username,
      id: profileData.id,
      bio: profileData.profile?.bio || "",
      work: profileData.profile?.work || "",
      country: profileData.profile?.country || "",
      status: profileData.profile?.status || "",
      join_date: joinDate,
      avatar_url: profileData.profile?.images?.["90x90"] ||
        `https://cdn2.scratch.mit.edu/get_image/user/${profileData.id}_60x60.png`,
      scratch_team: profileData.scratchteam || false,
    };

    res.json({
      username,
      profile,
      stats: {
        followers, following, total_projects, total_loves, total_favorites,
        total_views, total_remixes, total_comments,
        average_loves_per_project: Math.round(average_loves_per_project * 10) / 10,
        average_views_per_project: Math.round(average_views_per_project * 10) / 10,
        love_to_view_ratio: Math.round(love_to_view_ratio * 1000) / 1000,
        remix_rate: Math.round(remix_rate * 100) / 100,
        days_on_scratch: daysSinceJoin,
        projects_per_month: Math.round(projects_per_month * 10) / 10,
        batma_orani, etkilesim_orani,
        yorum_orani: Math.round(yorum_orani * 10) / 10,
        takip_orani: Math.round(takip_orani * 10) / 10,
        gunluk_ortalama_goruntuleme: gunluk_goruntuleme,
        verimlilik_skoru,
      },
      insights: icegorular,
      score: skor,
      top_projects: topProjects,
      activity: {
        son_proje_tarihi: lastProjectDate,
        aktif_mi: isActive,
        aktivite_serisi: Math.floor(aylikProjeler.filter((m) => m.sayi > 0).length / 2),
        aylik_projeler: aylikProjeler,
      },
      advanced: {
        en_iyi_proje: sortedByLoves[0] ? mapProject(sortedByLoves[0]) : null,
        en_cok_izlenen: sortedByViews[0] ? mapProject(sortedByViews[0]) : null,
        remix_edilme_orani, topluluk_etkisi, hesap_yaslanma_hizi,
        tahmini_aylik_buyume, karsilastirma_skoru, onerilen_tur,
        zayif_proje_orani, guclu_proje_orani,
      },
      superlative,
      data_quality: projelerRateLimit ? "rate_limited" : "complete",
    });
  } catch (err: any) {
    if (err.status === 404) {
      res.status(404).json({ error: "not_found", message: `"${username}" kullanıcısı Scratch'te bulunamadı` });
    } else if (err.status === 429) {
      res.status(429).json({ error: "rate_limited", message: "Scratch API şu an çok meşgul. 1-2 dakika bekleyip tekrar dene." });
    } else {
      req.log.error(err, "Scratch kullanıcısı alınırken hata");
      res.status(500).json({ error: "server_error", message: "Kullanıcı verileri alınamadı. Scratch API geçici olarak yanıt vermiyor olabilir." });
    }
  }
});

// Kimlik doğrulamalı yorum istatistikleri — kullanıcı kendi session token'ını verir
router.get("/user/:username/authenticated-stats", async (req, res) => {
  const { username } = req.params;
  const { token } = req.query;

  if (!token || typeof token !== "string" || token.length < 10) {
    res.status(400).json({ error: "missing_token", message: "Geçersiz oturum token'ı" });
    return;
  }

  const authHeaders = {
    "User-Agent": "ScratchAnalyzer/1.0",
    "Accept": "application/json",
    "Cookie": `scratchsessionsid=${token}`,
    "x-csrftoken": "a",
    "x-requested-with": "XMLHttpRequest",
    "Referer": "https://scratch.mit.edu",
  };

  try {
    const projeler = (await fetch(
      `${SCRATCH_API}/users/${username}/projects?limit=40&offset=0`,
      { headers: authHeaders, signal: AbortSignal.timeout(8000) }
    ).then(r => r.ok ? r.json() : []).catch(() => [])) as any[];

    if (!Array.isArray(projeler) || projeler.length === 0) {
      res.json({ username, total_comments: 0, project_count: 0, authenticated: true });
      return;
    }

    // Her proje için kimlik doğrulamalı stats çek → comments sayısını al
    const sonuclar = await Promise.allSettled(
      projeler.slice(0, 20).map((p: any) =>
        fetch(`${SCRATCH_API}/projects/${p.id}`, {
          headers: authHeaders,
          signal: AbortSignal.timeout(5000),
        }).then(r => r.ok ? r.json() : null).catch(() => null)
      )
    );

    let total_comments = 0;
    const proje_yorumlar: Array<{ id: number; title: string; yorumlar: number }> = [];

    sonuclar.forEach((s, i) => {
      if (s.status === "fulfilled" && (s.value as any)?.stats) {
        const yorum = (s.value as any).stats.comments || 0;
        total_comments += yorum;
        proje_yorumlar.push({ id: projeler[i].id, title: projeler[i].title, yorumlar: yorum });
      }
    });

    res.json({
      username,
      total_comments,
      project_count: projeler.length,
      proje_yorumlar: proje_yorumlar.sort((a, b) => b.yorumlar - a.yorumlar),
      authenticated: true,
    });
  } catch (err: any) {
    res.status(500).json({ error: "fetch_error", message: "Veriler alınamadı" });
  }
});

router.get("/user/:username/projects", async (req, res) => {
  const { username } = req.params;
  const limit = Math.min(40, Number(req.query.limit) || 20);

  try {
    const projeler = await fetchScratch(
      `${SCRATCH_API}/users/${username}/projects?limit=${limit}&offset=0`
    );

    if (!Array.isArray(projeler)) {
      res.status(404).json({ error: "not_found", message: `"${username}" bulunamadı` });
      return;
    }

    res.json({ username, projects: projeler.map(mapProject), total: projeler.length });
  } catch (err: any) {
    if (err.status === 404) {
      res.status(404).json({ error: "not_found", message: `"${username}" bulunamadı` });
    } else {
      req.log.error(err, "Scratch projeleri alınırken hata");
      res.status(500).json({ error: "server_error", message: "Projeler alınamadı" });
    }
  }
});

export default router;
