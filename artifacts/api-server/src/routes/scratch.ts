import { Router, type IRouter } from "express";

const router: IRouter = Router();

const SCRATCH_API = "https://api.scratch.mit.edu";
const SCRATCH_CDN = "https://cdn2.scratch.mit.edu";

async function fetchScratch(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": "ScratchAnalyzer/1.0", "Accept": "application/json" },
  });
  if (!res.ok) {
    const err = new Error(`Scratch API error: ${res.status}`);
    (err as any).status = res.status;
    throw err;
  }
  return res.json();
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
  if (istatistikler.total_remixes < 5) {
    buyume_onerileri.push({
      kategori: "Topluluk",
      oneri: "Popüler projeleri remix et ve kendi özgün dokunuşunu ekle. Böylece mevcut kitlelere ulaşırsın.",
      oncelik: "orta",
      etki: "Remix, 50–200 yeni profil ziyareti getirebilir"
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
  if (istatistikler.average_views_per_project < 100) {
    buyume_onerileri.push({
      kategori: "Tanıtım",
      oneri: "Projelerini Scratch forumlarında ve sosyal medyada paylaş. Çapraz tanıtım büyümenin anahtarı.",
      oncelik: "dusuk",
      etki: "Dış tanıtım görüntülenmeyi %10–30 artırabilir"
    });
  }

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

  // Büyüme trendi: son 3 aya vs önceki 3 aya bak
  const aylikVeriler = istatistikler.aylik_veriler || [];
  let buyume_trendi = "Sabit";
  if (aylikVeriler.length >= 6) {
    const son3 = aylikVeriler.slice(-3).reduce((s: number, a: any) => s + a.sayi, 0);
    const once3 = aylikVeriler.slice(-6, -3).reduce((s: number, a: any) => s + a.sayi, 0);
    if (son3 > once3 * 1.2) buyume_trendi = "📈 Yükselen";
    else if (son3 < once3 * 0.8) buyume_trendi = "📉 Düşen";
    else buyume_trendi = "➡️ Sabit";
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

router.get("/user/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const profileData = await fetchScratch(`${SCRATCH_API}/users/${username}`);

    let projeler: any[] = [];
    try {
      const p = await fetchScratch(`${SCRATCH_API}/users/${username}/projects?limit=40&offset=0`);
      projeler = Array.isArray(p) ? p : [];
    } catch (_) {}

    // Takipçi sayısı — ScratchDB ile dene
    let followers = 0;
    let following = 0;
    try {
      const dbRes = await fetch(`https://scratchdb.lefty.one/v3/user/info/${username}`, {
        headers: { "User-Agent": "ScratchAnalyzer/1.0" }
      });
      if (dbRes.ok) {
        const dbData = await dbRes.json() as any;
        followers = dbData?.statistics?.followers || 0;
        following = dbData?.statistics?.following || 0;
      }
    } catch (_) {}

    if (followers === 0) {
      try {
        const pages = await Promise.all([
          fetchScratch(`${SCRATCH_API}/users/${username}/followers?limit=40&offset=0`).catch(() => []),
          fetchScratch(`${SCRATCH_API}/users/${username}/followers?limit=40&offset=40`).catch(() => []),
        ]);
        followers = (pages[0] as any[]).length + (pages[1] as any[]).length;
      } catch (_) {}
    }
    if (following === 0) {
      try {
        const fl = await fetchScratch(`${SCRATCH_API}/users/${username}/following?limit=40`);
        following = Array.isArray(fl) ? fl.length : 0;
      } catch (_) {}
    }

    const total_projects = projeler.length;
    const total_loves = projeler.reduce((s: number, p: any) => s + (p.stats?.loves || p.loves || 0), 0);
    const total_favorites = projeler.reduce((s: number, p: any) => s + (p.stats?.favorites || p.favorites || 0), 0);
    const total_views = projeler.reduce((s: number, p: any) => s + (p.stats?.views || p.views || 0), 0);
    const total_remixes = projeler.reduce((s: number, p: any) => s + (p.stats?.remixes || p.remixes || 0), 0);
    const total_comments = projeler.reduce((s: number, p: any) => s + (p.stats?.comments || p.comments || 0), 0);

    const average_loves_per_project = total_projects > 0 ? total_loves / total_projects : 0;
    const average_views_per_project = total_projects > 0 ? total_views / total_projects : 0;
    const love_to_view_ratio = total_views > 0 ? total_loves / total_views : 0;
    const remix_rate = total_projects > 0 ? total_remixes / total_projects : 0;
    const takip_orani = following > 0 ? followers / following : followers;
    const yorum_orani = total_projects > 0 ? total_comments / total_projects : 0;
    const gunluk_ortalama_goruntuleme = 0; // hesaplanacak aşağıda

    const joinDate = profileData.history?.joined || profileData.join_date || new Date().toISOString();
    const daysSinceJoin = Math.floor((Date.now() - new Date(joinDate).getTime()) / (1000 * 60 * 60 * 24));
    const monthsSinceJoin = daysSinceJoin / 30;
    const projects_per_month = monthsSinceJoin > 0 ? total_projects / monthsSinceJoin : 0;

    // Batma Oranı: görüntüleyip beğenmeyen yüzdesi
    const batma_orani = total_views > 0
      ? Math.round(((total_views - total_loves) / total_views) * 100 * 10) / 10
      : 100;

    // Etkileşim Oranı: (sevgi+favori+yorum) / görüntüleme * 100
    const etkilesim_orani = total_views > 0
      ? Math.round(((total_loves + total_favorites + total_comments) / total_views) * 100 * 100) / 100
      : 0;

    // Verimlilik skoru: etkileşim/proje başına normalize
    const verimlilik_skoru = total_projects > 0
      ? Math.min(100, Math.round(((total_loves + total_favorites) / total_projects) / 10))
      : 0;

    const gunluk_goruntuleme = daysSinceJoin > 0
      ? Math.round(total_views / daysSinceJoin * 10) / 10
      : 0;

    const sortedByDate = [...projeler].sort((a, b) => {
      const dateA = new Date(a.history?.shared || a.share_date || 0).getTime();
      const dateB = new Date(b.history?.shared || b.share_date || 0).getTime();
      return dateB - dateA;
    });

    const lastProjectDate = sortedByDate.length > 0
      ? (sortedByDate[0].history?.shared || sortedByDate[0].share_date || null)
      : null;

    const isActive = lastProjectDate
      ? (Date.now() - new Date(lastProjectDate).getTime()) < 1000 * 60 * 60 * 24 * 90
      : false;

    const aylikProjeler = getAylikAktivite(projeler);

    const istatistikler = {
      followers,
      following,
      total_projects,
      total_loves,
      total_favorites,
      total_views,
      total_remixes,
      total_comments,
      average_loves_per_project: Math.round(average_loves_per_project * 10) / 10,
      average_views_per_project: Math.round(average_views_per_project * 10) / 10,
      love_to_view_ratio: Math.round(love_to_view_ratio * 1000) / 1000,
      remix_rate: Math.round(remix_rate * 100) / 100,
      days_on_scratch: daysSinceJoin,
      projects_per_month: Math.round(projects_per_month * 10) / 10,
      batma_orani,
      etkilesim_orani,
      yorum_orani: Math.round(yorum_orani * 10) / 10,
      takip_orani: Math.round(takip_orani * 10) / 10,
      gunluk_ortalama_goruntuleme: gunluk_goruntuleme,
      verimlilik_skoru,
      aktif_mi: isActive,
      aylik_veriler: aylikProjeler,
    };

    const skor = hesaplaSkor(istatistikler);
    const icegorular = uretIcegorular(istatistikler, skor, projeler);

    // En iyi + en çok izlenen projeler
    const sortedByLoves = [...projeler].sort((a, b) =>
      (b.stats?.loves || b.loves || 0) - (a.stats?.loves || a.loves || 0)
    );
    const sortedByViews = [...projeler].sort((a, b) =>
      (b.stats?.views || b.views || 0) - (a.stats?.views || a.views || 0)
    );

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

    const topProjects = sortedByLoves.slice(0, 6).map(mapProject);

    // Zayıf/güçlü proje oranları
    const zayif_proje_orani = total_projects > 0
      ? Math.round((projeler.filter((p: any) => (p.stats?.views || p.views || 0) < 100).length / total_projects) * 100)
      : 0;
    const guclu_proje_orani = total_projects > 0
      ? Math.round((projeler.filter((p: any) => (p.stats?.views || p.views || 0) >= 1000).length / total_projects) * 100)
      : 0;

    const remix_edilme_orani = total_views > 0
      ? Math.round((total_remixes / total_views) * 1000 * 10) / 10
      : 0;

    let topluluk_etkisi = "Sınırlı";
    if (skor.topluluk >= 70) topluluk_etkisi = "Çok Güçlü";
    else if (skor.topluluk >= 50) topluluk_etkisi = "Güçlü";
    else if (skor.topluluk >= 30) topluluk_etkisi = "Orta";

    let hesap_yaslanma_hizi = "Yavaş";
    if (projects_per_month >= 3) hesap_yaslanma_hizi = "Hızlı Gelişen";
    else if (projects_per_month >= 1) hesap_yaslanma_hizi = "Dengeli";
    else if (projects_per_month >= 0.3) hesap_yaslanma_hizi = "Yavaş";
    else hesap_yaslanma_hizi = "Durağan";

    const tahmini_aylik_buyume = Math.round(
      Math.min(50, (etkilesim_orani * 0.5 + projects_per_month * 2)) * 10
    ) / 10;

    let karsilastirma_skoru = "Ortanın Altı";
    if (skor.genel >= 80) karsilastirma_skoru = "En İyi %10";
    else if (skor.genel >= 65) karsilastirma_skoru = "En İyi %25";
    else if (skor.genel >= 50) karsilastirma_skoru = "Ortalamanın Üstü";
    else if (skor.genel >= 35) karsilastirma_skoru = "Ortalama";

    let onerilen_tur = "Oyun";
    if (total_loves > total_views * 0.05) onerilen_tur = "Animasyon";
    else if (remix_rate > 0.3) onerilen_tur = "Remix & Sanat";
    else onerilen_tur = "Etkileşimli Hikaye";

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

    const analiz = {
      username,
      profile,
      stats: {
        followers,
        following,
        total_projects,
        total_loves,
        total_favorites,
        total_views,
        total_remixes,
        total_comments,
        average_loves_per_project: Math.round(average_loves_per_project * 10) / 10,
        average_views_per_project: Math.round(average_views_per_project * 10) / 10,
        love_to_view_ratio: Math.round(love_to_view_ratio * 1000) / 1000,
        remix_rate: Math.round(remix_rate * 100) / 100,
        days_on_scratch: daysSinceJoin,
        projects_per_month: Math.round(projects_per_month * 10) / 10,
        batma_orani,
        etkilesim_orani,
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
        remix_edilme_orani,
        topluluk_etkisi,
        hesap_yaslanma_hizi,
        tahmini_aylik_buyume,
        karsilastirma_skoru,
        onerilen_tur,
        zayif_proje_orani,
        guclu_proje_orani,
      },
    };

    res.json(analiz);
  } catch (err: any) {
    if (err.status === 404) {
      res.status(404).json({ error: "not_found", message: `"${username}" kullanıcısı Scratch'te bulunamadı` });
    } else {
      req.log.error(err, "Scratch kullanıcısı alınırken hata");
      res.status(500).json({ error: "server_error", message: "Kullanıcı verileri alınamadı" });
    }
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

    const mapped = projeler.map((p: any) => ({
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
    }));

    res.json({ username, projects: mapped, total: mapped.length });
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
