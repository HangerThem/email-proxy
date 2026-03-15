import { Code, Globe, LayoutDashboard, Logs, Activity } from "lucide-react"
import { cn } from "../utils/cn"
import type { ViewName } from "../utils/types"

interface SidebarProps {
  activeView: ViewName
  siteCount: number
  onChangeView: (view: ViewName) => void
}

export function Sidebar({ activeView, siteCount, onChangeView }: SidebarProps) {
  const navItemClass = (isActive: boolean) =>
    cn(
      "flex w-full select-none items-center gap-2.5 border-0 border-l-2 border-transparent bg-transparent px-4 py-2 text-left text-[13px] text-textDim transition-all duration-150 hover:bg-surfaceAlt hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
      isActive && "border-l-accent bg-[rgba(24,119,242,0.08)] text-white",
    )

  return (
    <nav className="hidden flex-col gap-0.5 border-r border-border bg-surface py-4 lg:flex">
      <div className="px-4 pb-1 pt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-textMute">
        Navigation
      </div>

      <button
        className={navItemClass(activeView === "overview")}
        onClick={() => onChangeView("overview")}
        type="button"
        aria-current={activeView === "overview" ? "page" : undefined}
      >
        <span
          className={cn(
            "h-4 w-4 shrink-0 opacity-60",
            activeView === "overview" && "opacity-100",
          )}
        >
          <LayoutDashboard size={16} />
        </span>
        Overview
        <span className="ml-auto rounded-[10px] bg-accentDim px-1.5 py-[1px] font-mono text-[10px] text-accent">
          {siteCount}
        </span>
      </button>

      <button
        className={navItemClass(activeView === "sites")}
        onClick={() => onChangeView("sites")}
        type="button"
        aria-current={activeView === "sites" ? "page" : undefined}
      >
        <span
          className={cn(
            "h-4 w-4 shrink-0 opacity-60",
            activeView === "sites" && "opacity-100",
          )}
        >
          <Globe size={16} />
        </span>
        Sites
      </button>

      <button
        className={navItemClass(activeView === "logs")}
        onClick={() => onChangeView("logs")}
        type="button"
        aria-current={activeView === "logs" ? "page" : undefined}
      >
        <span
          className={cn(
            "h-4 w-4 shrink-0 opacity-60",
            activeView === "logs" && "opacity-100",
          )}
        >
          <Logs size={16} />
        </span>
        Event Logs
      </button>

      <button
        className={navItemClass(activeView === "snippet")}
        onClick={() => onChangeView("snippet")}
        type="button"
        aria-current={activeView === "snippet" ? "page" : undefined}
      >
        <span
          className={cn(
            "h-4 w-4 shrink-0 opacity-60",
            activeView === "snippet" && "opacity-100",
          )}
        >
          <Code size={16} />
        </span>
        Client Snippet
      </button>

      <div className="mt-auto px-4 pb-1 pt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-textMute">
        System
      </div>
      <div
        className={cn(
          navItemClass(false),
          "cursor-not-allowed opacity-60 hover:bg-transparent hover:text-textDim pointer-events-none",
        )}
        aria-disabled="true"
      >
        <span className="h-4 w-4 shrink-0 opacity-60">
          <Activity size={16} />
        </span>
        Health
      </div>
    </nav>
  )
}
