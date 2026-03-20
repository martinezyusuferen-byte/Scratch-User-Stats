import { Router, type IRouter } from "express";

const router: IRouter = Router();

const SCRATCH_API = "https://api.scratch.mit.edu";
const SCRATCH_CDN = "https://cdn2.scratch.mit.edu";

async function fetchScratch(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "ScratchAnalyzer/1.0",
      "Accept": "application/json",
    },
  });
  if (!res.ok) {
    const err = new Error(`Scratch API error: ${res.status}`);
    (err as any).status = res.status;
    throw err;
  }
  return res.json();
}

function calculateScore(stats: any, profile: any, projects: any[]) {
  const {
    followers,
    following,
    total_projects,
    total_loves,
    total_views,
    total_favorites,
    total_remixes,
    average_loves_per_project,
    average_views_per_project,
    love_to_view_ratio,
    projects_per_month,
  } = stats;

  // Engagement score (0-100)
  let engagement = 0;
  if (average_loves_per_project > 0) engagement += Math.min(40, (average_loves_per_project / 50) * 40);
  if (love_to_view_ratio > 0) engagement += Math.min(30, love_to_view_ratio * 3000);
  if (average_views_per_project > 0) engagement += Math.min(30, (average_views_per_project / 200) * 30);
  engagement = Math.round(Math.min(100, engagement));

  // Community score (0-100)
  let community = 0;
  if (followers > 0) community += Math.min(50, Math.log10(followers + 1) * 20);
  const followRatio = following > 0 ? followers / following : followers;
  community += Math.min(30, followRatio * 5);
  if (total_remixes > 0) community += Math.min(20, (total_remixes / total_projects) * 20);
  community = Math.round(Math.min(100, community));

  // Creativity score (0-100)
  let creativity = 0;
  if (total_projects > 0) creativity += Math.min(40, Math.log10(total_projects + 1) * 20);
  if (projects_per_month > 0) creativity += Math.min(30, projects_per_month * 10);
  const projectVariety = projects.length > 0 ? 
    new Set(projects.map((p: any) => p.description?.substring(0, 20) || "")).size / projects.length : 0;
  creativity += Math.min(30, projectVariety * 30);
  creativity = Math.round(Math.min(100, creativity));

  // Consistency score (0-100)
  let consistency = 0;
  if (projects_per_month >= 1) consistency += 40;
  else consistency += projects_per_month * 40;
  if (stats.days_on_scratch > 0) {
    const avgActivity = total_projects / (stats.days_on_scratch / 30);
    consistency += Math.min(40, avgActivity * 20);
  }
  if (stats.is_active) consistency += 20;
  consistency = Math.round(Math.min(100, consistency));

  // Growth potential (0-100)
  let growth_potential = 0;
  if (followers < 1000) growth_potential += 40;
  else if (followers < 10000) growth_potential += 20;
  if (love_to_view_ratio > 0.05) growth_potential += 30;
  if (projects_per_month > 0.5) growth_potential += 30;
  growth_potential = Math.round(Math.min(100, growth_potential));

  const overall = Math.round(
    (engagement * 0.3 + community * 0.25 + creativity * 0.2 + consistency * 0.15 + growth_potential * 0.1)
  );

  let rank = "Beginner";
  let rank_icon = "🌱";
  if (overall >= 90) { rank = "Legend"; rank_icon = "🏆"; }
  else if (overall >= 75) { rank = "Star Creator"; rank_icon = "⭐"; }
  else if (overall >= 60) { rank = "Rising Star"; rank_icon = "🚀"; }
  else if (overall >= 45) { rank = "Active Maker"; rank_icon = "🎨"; }
  else if (overall >= 30) { rank = "Explorer"; rank_icon = "🔍"; }
  else { rank = "Beginner"; rank_icon = "🌱"; }

  const percentile = Math.min(99, overall);

  return { overall, engagement, creativity, community, consistency, growth_potential, rank, rank_icon, percentile };
}

function generateInsights(stats: any, score: any, projects: any[]) {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const growth_tips: any[] = [];

  // Strengths
  if (stats.followers > 100) strengths.push(`${stats.followers.toLocaleString()} loyal followers`);
  if (stats.average_loves_per_project > 20) strengths.push("High engagement per project");
  if (stats.love_to_view_ratio > 0.05) strengths.push("Excellent love-to-view ratio");
  if (stats.total_projects > 10) strengths.push(`Prolific creator with ${stats.total_projects} projects`);
  if (stats.projects_per_month >= 2) strengths.push("Consistent publishing schedule");
  if (stats.total_remixes > 0) strengths.push("Active in the remix community");
  if (score.engagement > 60) strengths.push("Strong audience engagement");
  if (stats.total_views > 10000) strengths.push(`Impressive reach with ${stats.total_views.toLocaleString()} total views`);

  // Weaknesses
  if (stats.followers < 50) weaknesses.push("Low follower count");
  if (stats.average_loves_per_project < 5) weaknesses.push("Projects need more engagement");
  if (stats.love_to_view_ratio < 0.02) weaknesses.push("Low love-to-view conversion rate");
  if (stats.projects_per_month < 0.5) weaknesses.push("Infrequent publishing schedule");
  if (stats.total_projects < 5) weaknesses.push("Limited project portfolio");
  if (!stats.is_active) weaknesses.push("Account appears inactive");

  if (weaknesses.length === 0) weaknesses.push("Keep up the amazing work!");

  // Growth tips
  if (stats.followers < 1000) {
    growth_tips.push({
      category: "Community",
      tip: "Follow and engage with popular Scrapers in your niche. Comment on their projects and join studios.",
      priority: "high",
      impact: "Can increase followers by 20-50% in a month"
    });
  }

  if (stats.projects_per_month < 1) {
    growth_tips.push({
      category: "Consistency",
      tip: "Try to publish at least 1-2 projects per month. Even short, simple projects keep your audience engaged.",
      priority: "high",
      impact: "Regular posting boosts follower retention by 40%"
    });
  }

  if (stats.love_to_view_ratio < 0.05) {
    growth_tips.push({
      category: "Quality",
      tip: "Focus on making your project thumbnails eye-catching. A good thumbnail can triple your click-through rate.",
      priority: "high",
      impact: "Better thumbnails can increase loves by 30%"
    });
  }

  if (stats.total_remixes < 5) {
    growth_tips.push({
      category: "Community",
      tip: "Remix popular projects and add your own unique twist. This exposes you to existing audiences.",
      priority: "medium",
      impact: "Remixing can bring 50-200 new profile views"
    });
  }

  growth_tips.push({
    category: "Description",
    tip: "Write detailed project descriptions with instructions. Users are more likely to engage with well-documented projects.",
    priority: "medium",
    impact: "Clear descriptions increase session time by 25%"
  });

  growth_tips.push({
    category: "Studios",
    tip: "Join active Scratch studios related to your project types. Studios can expose your work to thousands of users.",
    priority: "medium",
    impact: "Studio membership can double project visibility"
  });

  if (stats.average_views_per_project < 100) {
    growth_tips.push({
      category: "Promotion",
      tip: "Share your projects on Scratch forums and social media. Cross-promotion is key to growing your audience.",
      priority: "low",
      impact: "External promotion can add 10-30% more views"
    });
  }

  // Determine creator type
  let creator_type = "General Creator";
  if (stats.total_remixes > stats.total_projects * 0.5) creator_type = "Remix Artist";
  else if (stats.average_loves_per_project > 50) creator_type = "Viral Creator";
  else if (stats.projects_per_month > 3) creator_type = "Prolific Maker";
  else if (stats.followers > 1000) creator_type = "Community Leader";

  // Activity level
  let activity_level = "Inactive";
  if (stats.projects_per_month > 4) activity_level = "Very Active";
  else if (stats.projects_per_month > 2) activity_level = "Active";
  else if (stats.projects_per_month > 0.5) activity_level = "Moderate";
  else if (stats.is_active) activity_level = "Occasional";

  // Engagement quality
  let engagement_quality = "Low";
  if (score.engagement > 70) engagement_quality = "Excellent";
  else if (score.engagement > 50) engagement_quality = "Good";
  else if (score.engagement > 30) engagement_quality = "Fair";

  return { strengths, weaknesses, growth_tips, creator_type, activity_level, engagement_quality };
}

function getMonthlyActivity(projects: any[]) {
  const monthMap: Record<string, number> = {};
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().substring(0, 7);
    monthMap[key] = 0;
  }

  for (const p of projects) {
    const shareDate = p.history?.shared || p.share_date;
    if (shareDate) {
      const key = shareDate.substring(0, 7);
      if (key in monthMap) monthMap[key]++;
    }
  }

  return Object.entries(monthMap).map(([month, count]) => ({ month, count }));
}

router.get("/user/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const [profileData, followersData, followingData] = await Promise.all([
      fetchScratch(`${SCRATCH_API}/users/${username}`),
      fetchScratch(`${SCRATCH_API}/users/${username}/followers?limit=1`).catch(() => ({ total: 0 })),
      fetchScratch(`${SCRATCH_API}/users/${username}/following?limit=1`).catch(() => ({ total: 0 })),
    ]);

    // Fetch projects (up to 40)
    let projects: any[] = [];
    try {
      const p1 = await fetchScratch(`${SCRATCH_API}/users/${username}/projects?limit=40&offset=0`);
      projects = Array.isArray(p1) ? p1 : [];
    } catch (_) {}

    // Get follower/following counts using ScratchDB API for accurate counts
    let followers = 0;
    let following = 0;
    try {
      const scratchDbRes = await fetch(`https://scratchdb.lefty.one/v3/user/info/${username}`, {
        headers: { "User-Agent": "ScratchAnalyzer/1.0" }
      });
      if (scratchDbRes.ok) {
        const scratchDbData = await scratchDbRes.json() as any;
        followers = scratchDbData?.statistics?.followers || 0;
        following = scratchDbData?.statistics?.following || 0;
      }
    } catch (_) {}

    // Fallback: count from API if ScratchDB failed
    if (followers === 0) {
      try {
        // Fetch multiple pages to get a better estimate
        const pages = await Promise.all([
          fetchScratch(`${SCRATCH_API}/users/${username}/followers?limit=40&offset=0`).catch(() => []),
          fetchScratch(`${SCRATCH_API}/users/${username}/followers?limit=40&offset=40`).catch(() => []),
        ]);
        const allFollowers = [...(pages[0] as any[]), ...(pages[1] as any[])];
        followers = allFollowers.length;
        // If we got 80, there are likely more - indicate with a +
        if (followers >= 80) followers = 80;
      } catch (_) {}
    }

    if (following === 0) {
      try {
        const followingList = await fetchScratch(`${SCRATCH_API}/users/${username}/following?limit=40`);
        following = Array.isArray(followingList) ? followingList.length : 0;
      } catch (_) {}
    }

    // Calculate aggregate stats
    const total_projects = projects.length;
    const total_loves = projects.reduce((s: number, p: any) => s + (p.stats?.loves || p.loves || 0), 0);
    const total_favorites = projects.reduce((s: number, p: any) => s + (p.stats?.favorites || p.favorites || 0), 0);
    const total_views = projects.reduce((s: number, p: any) => s + (p.stats?.views || p.views || 0), 0);
    const total_remixes = projects.reduce((s: number, p: any) => s + (p.stats?.remixes || p.remixes || 0), 0);
    const total_comments = projects.reduce((s: number, p: any) => s + (p.stats?.comments || p.comments || 0), 0);

    const average_loves_per_project = total_projects > 0 ? total_loves / total_projects : 0;
    const average_views_per_project = total_projects > 0 ? total_views / total_projects : 0;
    const love_to_view_ratio = total_views > 0 ? total_loves / total_views : 0;
    const remix_rate = total_projects > 0 ? total_remixes / total_projects : 0;

    const joinDate = profileData.history?.joined || profileData.join_date || new Date().toISOString();
    const daysSinceJoin = Math.floor((Date.now() - new Date(joinDate).getTime()) / (1000 * 60 * 60 * 24));
    const monthsSinceJoin = daysSinceJoin / 30;
    const projects_per_month = monthsSinceJoin > 0 ? total_projects / monthsSinceJoin : 0;

    // Last project
    const sortedProjects = [...projects].sort((a, b) => {
      const dateA = new Date(a.history?.shared || a.share_date || 0).getTime();
      const dateB = new Date(b.history?.shared || b.share_date || 0).getTime();
      return dateB - dateA;
    });

    const lastProjectDate = sortedProjects.length > 0
      ? (sortedProjects[0].history?.shared || sortedProjects[0].share_date || null)
      : null;

    const isActive = lastProjectDate
      ? (Date.now() - new Date(lastProjectDate).getTime()) < 1000 * 60 * 60 * 24 * 90
      : false;

    const monthly_projects = getMonthlyActivity(projects);

    const stats = {
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
      is_active: isActive,
    };

    const score = calculateScore(stats, profileData, projects);
    const insights = generateInsights(stats, score, projects);

    // Top projects by loves
    const top_projects = sortedProjects
      .sort((a, b) => (b.stats?.loves || b.loves || 0) - (a.stats?.loves || a.loves || 0))
      .slice(0, 6)
      .map((p: any) => ({
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

    const profile = {
      username: profileData.username,
      id: profileData.id,
      bio: profileData.profile?.bio || "",
      work: profileData.profile?.work || "",
      country: profileData.profile?.country || "",
      status: profileData.profile?.status || "",
      join_date: joinDate,
      avatar_url: profileData.profile?.images?.["90x90"] || `https://cdn2.scratch.mit.edu/get_image/user/${profileData.id}_60x60.png`,
      scratch_team: profileData.scratchteam || false,
    };

    const analysis = {
      username,
      profile,
      stats,
      insights,
      score,
      top_projects,
      activity: {
        last_project_date: lastProjectDate,
        is_active: isActive,
        activity_streak: Math.floor(monthly_projects.filter((m) => m.count > 0).length / 2),
        monthly_projects,
      },
    };

    res.json(analysis);
  } catch (err: any) {
    if (err.status === 404) {
      res.status(404).json({ error: "not_found", message: `User "${username}" not found on Scratch` });
    } else {
      req.log.error(err, "Error fetching Scratch user");
      res.status(500).json({ error: "server_error", message: "Failed to fetch user data" });
    }
  }
});

router.get("/user/:username/projects", async (req, res) => {
  const { username } = req.params;
  const limit = Math.min(40, Number(req.query.limit) || 20);

  try {
    const projects = await fetchScratch(
      `${SCRATCH_API}/users/${username}/projects?limit=${limit}&offset=0`
    );

    if (!Array.isArray(projects)) {
      res.status(404).json({ error: "not_found", message: `User "${username}" not found` });
      return;
    }

    const mapped = projects.map((p: any) => ({
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
      res.status(404).json({ error: "not_found", message: `User "${username}" not found` });
    } else {
      req.log.error(err, "Error fetching Scratch projects");
      res.status(500).json({ error: "server_error", message: "Failed to fetch projects" });
    }
  }
});

export default router;
