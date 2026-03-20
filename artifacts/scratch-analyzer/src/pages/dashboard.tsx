import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  useGetScratchUser, 
  useGetScratchUserProjects 
} from "@workspace/api-client-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';
import { 
  Search, ArrowLeft, Heart, Eye, Star, MessageSquare, Repeat, 
  Calendar, CheckCircle, XCircle, TrendingUp, Award, Zap, Activity
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { CircularProgress } from "@/components/ui/circular-progress";
import { cn } from "@/lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Dashboard() {
  const { username } = useParams<{ username: string }>();
  const [, setLocation] = useLocation();
  const [searchInput, setSearchInput] = useState("");

  const { data: analysis, isLoading: isUserLoading, error: userError } = useGetScratchUser(username || "");
  const { data: projectsData, isLoading: isProjectsLoading } = useGetScratchUserProjects(username || "", { limit: 6 });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setLocation(`/user/${encodeURIComponent(searchInput.trim())}`);
      setSearchInput("");
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-16 h-16 border-4 border-white/10 border-t-primary rounded-full mb-6"
        />
        <h2 className="text-2xl font-display font-bold animate-pulse text-white/80">Analyzing Creator...</h2>
      </div>
    );
  }

  if (userError || !analysis) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <GlassCard className="max-w-md w-full p-8 text-center" gradient>
          <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold mb-2">User Not Found</h2>
          <p className="text-muted-foreground mb-8">We couldn't find a Scratch profile matching "{username}". Make sure the username is exact.</p>
          <button 
            onClick={() => setLocation("/")}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 px-6 py-4 mb-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => setLocation("/")}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight hidden sm:block">Scratch<span className="text-primary">Analyzer</span></span>
          </div>

          <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4">
            <div className="relative flex items-center bg-black/20 border border-white/10 focus-within:border-primary/50 rounded-full px-4 py-2 transition-colors">
              <Search className="w-4 h-4 text-muted-foreground mr-2" />
              <input 
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Analyze another user..."
                className="w-full bg-transparent border-none outline-none text-sm text-white placeholder:text-white/40"
              />
            </div>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN (Profile & Score) */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div variants={item}>
              <GlassCard gradient className="p-6 text-center relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-primary/20 to-transparent" />
                <img 
                  src={analysis.profile.avatar_url} 
                  alt={analysis.profile.username}
                  className="w-28 h-28 rounded-full border-4 border-background shadow-xl mx-auto relative z-10 bg-black/50"
                />
                <h1 className="text-3xl font-display font-bold mt-4">{analysis.profile.username}</h1>
                
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary/20 text-primary border border-primary/30">
                    {analysis.insights.creator_type}
                  </span>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-accent/20 text-accent border border-accent/30">
                    {analysis.insights.activity_level}
                  </span>
                  {analysis.profile.scratch_team && (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Scratch Team
                    </span>
                  )}
                </div>

                {analysis.profile.bio && (
                  <p className="mt-4 text-sm text-muted-foreground line-clamp-3">{analysis.profile.bio}</p>
                )}
                
                <div className="mt-6 flex justify-center gap-6 border-t border-white/10 pt-6">
                  <div>
                    <div className="text-2xl font-bold">{analysis.stats.followers.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Followers</div>
                  </div>
                  <div className="w-px bg-white/10" />
                  <div>
                    <div className="text-2xl font-bold">{analysis.stats.following.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Following</div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            <motion.div variants={item}>
              <GlassCard className="p-6 flex flex-col items-center">
                <h3 className="font-display font-semibold text-lg text-white/80 w-full mb-6 flex justify-between items-center">
                  Overall Score 
                  <span className="text-2xl">{analysis.score.rank_icon}</span>
                </h3>
                <CircularProgress value={analysis.score.overall} size={160} strokeWidth={12} color="hsl(var(--primary))" />
                <div className="mt-6 text-center">
                  <div className="text-2xl font-display font-bold text-gradient">{analysis.score.rank}</div>
                  <div className="text-sm text-muted-foreground mt-1">Top {analysis.score.percentile}% of creators</div>
                </div>

                <div className="w-full mt-6 space-y-4">
                  {[
                    { label: "Engagement", val: analysis.score.engagement, color: "bg-pink-500" },
                    { label: "Creativity", val: analysis.score.creativity, color: "bg-purple-500" },
                    { label: "Community", val: analysis.score.community, color: "bg-blue-500" },
                    { label: "Consistency", val: analysis.score.consistency, color: "bg-green-500" }
                  ].map(score => (
                    <div key={score.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{score.label}</span>
                        <span className="font-bold">{score.val}/100</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${score.val}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className={cn("h-full rounded-full", score.color)} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* RIGHT COLUMN (Stats Grid & Charts) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Stats Grid */}
            <motion.div variants={container} className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Views", val: analysis.stats.total_views, icon: Eye, color: "text-blue-400", bg: "bg-blue-400/10" },
                { label: "Total Loves", val: analysis.stats.total_loves, icon: Heart, color: "text-pink-400", bg: "bg-pink-400/10" },
                { label: "Favorites", val: analysis.stats.total_favorites, icon: Star, color: "text-yellow-400", bg: "bg-yellow-400/10" },
                { label: "Remixes", val: analysis.stats.total_remixes, icon: Repeat, color: "text-green-400", bg: "bg-green-400/10" },
                { label: "Projects", val: analysis.stats.total_projects, icon: Calendar, color: "text-purple-400", bg: "bg-purple-400/10" },
                { label: "Comments", val: analysis.stats.total_comments, icon: MessageSquare, color: "text-orange-400", bg: "bg-orange-400/10" },
                { label: "Avg Loves/Proj", val: analysis.stats.average_loves_per_project.toFixed(1), icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
                { label: "Account Age", val: `${Math.floor(analysis.stats.days_on_scratch/365)}y ${analysis.stats.days_on_scratch%365}d`, icon: Award, color: "text-accent", bg: "bg-accent/10", isString: true }
              ].map((stat, i) => (
                <motion.div key={i} variants={item}>
                  <GlassCard className="p-4 hover:bg-white/[0.06] transition-colors cursor-default group">
                    <div className="flex items-start justify-between mb-2">
                      <div className={cn("p-2 rounded-lg", stat.bg)}>
                        <stat.icon className={cn("w-5 h-5", stat.color)} />
                      </div>
                    </div>
                    <div className="text-2xl font-bold font-display group-hover:scale-105 origin-left transition-transform">
                      {stat.isString ? stat.val : stat.val.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                  </GlassCard>
                </motion.div>
              ))}
            </motion.div>

            {/* Activity Chart */}
            <motion.div variants={item}>
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" /> Activity (Last 12 Months)
                  </h3>
                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground"><div className="w-2 h-2 rounded-full bg-green-500"/> Streak: {analysis.activity.activity_streak} months</span>
                  </div>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analysis.activity.monthly_projects} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {analysis.activity.monthly_projects.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.count > 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted))'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </motion.div>

            {/* Insights Row */}
            <motion.div variants={container} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div variants={item}>
                <GlassCard className="p-6 h-full border-green-500/20">
                  <h3 className="font-display font-semibold text-lg flex items-center gap-2 mb-4 text-green-400">
                    <CheckCircle className="w-5 h-5" /> Strengths
                  </h3>
                  <ul className="space-y-3">
                    {analysis.insights.strengths.map((str, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                        <span className="text-white/90">{str}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              </motion.div>
              
              <motion.div variants={item}>
                <GlassCard className="p-6 h-full border-red-500/20">
                  <h3 className="font-display font-semibold text-lg flex items-center gap-2 mb-4 text-red-400">
                    <XCircle className="w-5 h-5" /> Areas to Improve
                  </h3>
                  <ul className="space-y-3">
                    {analysis.insights.weaknesses.map((weak, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        <span className="text-white/90">{weak}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              </motion.div>
            </motion.div>

            {/* Growth Tips */}
            <motion.div variants={item}>
              <h3 className="font-display font-bold text-2xl mb-4 mt-8">AI Growth Tips</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.insights.growth_tips.map((tip, i) => (
                  <GlassCard key={i} className="p-5 flex flex-col h-full border-white/5 hover:border-accent/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-accent">{tip.category}</span>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                        tip.priority === 'high' ? "bg-red-500/20 text-red-400" :
                        tip.priority === 'medium' ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-blue-500/20 text-blue-400"
                      )}>
                        {tip.priority} Priority
                      </span>
                    </div>
                    <p className="text-white font-medium text-sm mb-4">{tip.tip}</p>
                    <div className="mt-auto bg-white/5 rounded-lg p-3 text-xs text-muted-foreground border border-white/5">
                      <strong className="text-white/70 block mb-1">Expected Impact:</strong> {tip.impact}
                    </div>
                  </GlassCard>
                ))}
              </div>
            </motion.div>

            {/* Top Projects */}
            <motion.div variants={item} className="pb-10">
              <div className="flex justify-between items-end mb-4 mt-8">
                <h3 className="font-display font-bold text-2xl">Top Projects</h3>
                <div className="text-sm text-muted-foreground cursor-pointer hover:text-primary transition-colors">View all</div>
              </div>
              
              {isProjectsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                  {[1,2,3].map(n => (
                    <div key={n} className="h-48 bg-white/5 rounded-xl border border-white/10" />
                  ))}
                </div>
              ) : projectsData?.projects && projectsData.projects.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projectsData.projects.map((project) => (
                    <a 
                      key={project.id} 
                      href={project.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="group block"
                    >
                      <GlassCard className="overflow-hidden h-full hover:border-primary/50 transition-colors flex flex-col group-hover:-translate-y-1 duration-300">
                        <div className="aspect-video relative bg-black/50 w-full overflow-hidden">
                          {project.thumbnail_url ? (
                            <img src={project.thumbnail_url} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                              <span className="text-white/30 font-display font-bold">No Image</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <span className="text-sm font-bold text-primary flex items-center gap-1">View on Scratch &rarr;</span>
                          </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                          <h4 className="font-bold text-white/90 line-clamp-1 mb-3">{project.title}</h4>
                          <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground font-medium">
                            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-pink-400" /> {project.loves.toLocaleString()}</span>
                            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-blue-400" /> {project.views.toLocaleString()}</span>
                            <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-400" /> {project.favorites.toLocaleString()}</span>
                          </div>
                        </div>
                      </GlassCard>
                    </a>
                  ))}
                </div>
              ) : (
                <GlassCard className="p-8 text-center text-muted-foreground">
                  No projects found for this user.
                </GlassCard>
              )}
            </motion.div>

          </div>
        </motion.div>
      </main>
    </div>
  );
}

// Simple shield icon missing from lucide standard imports sometimes
function Shield(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}
