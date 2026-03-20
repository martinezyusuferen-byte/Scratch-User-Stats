import { HTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"
import { motion, HTMLMotionProps } from "framer-motion"

interface GlassCardProps extends HTMLMotionProps<"div"> {
  gradient?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, gradient = false, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-2xl border backdrop-blur-xl overflow-hidden",
          gradient 
            ? "bg-gradient-to-br from-white/[0.05] to-white/[0.01] border-white/[0.1] shadow-xl"
            : "bg-white/[0.03] border-white/[0.05]",
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
GlassCard.displayName = "GlassCard"
