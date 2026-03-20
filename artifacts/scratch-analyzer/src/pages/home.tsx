import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Search, Sparkles, Activity, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [username, setUsername] = useState("");
  const [, setLocation] = useLocation();

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setLocation(`/user/${encodeURIComponent(username.trim())}`);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
          alt="Abstract analytics background"
          className="w-full h-full object-cover opacity-40 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-4xl px-6 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-white/80">AI-Powered Scratch Analytics</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight">
            Analyze. Improve. <br />
            <span className="text-gradient">Dominate Scratch.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Get deep insights, AI-driven growth tips, and comprehensive statistics for any Scratch creator.
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
            <div className="pl-4 pr-2">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter Scratch username..."
              className="flex-1 bg-transparent border-none outline-none text-xl text-white placeholder:text-white/30 px-2 py-4 font-display"
              required
            />
            <button
              type="submit"
              disabled={!username.trim()}
              className={cn(
                "px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300",
                username.trim() 
                  ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(255,107,0,0.4)] hover:bg-primary/90 hover:scale-105" 
                  : "bg-white/10 text-white/30 cursor-not-allowed"
              )}
            >
              Analyze
            </button>
          </div>
        </motion.form>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl"
        >
          {[
            { icon: Activity, title: "Deep Stats", desc: "Views, loves, and real engagement metrics." },
            { icon: Target, title: "Smart Scoring", desc: "Proprietary algorithm grading overall impact." },
            { icon: Sparkles, title: "Growth Tips", desc: "Actionable advice to reach more users." }
          ].map((feature, i) => (
            <div key={i} className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
