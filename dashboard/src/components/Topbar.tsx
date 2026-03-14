import { LogOut } from "lucide-react"
import { Button } from "./ui/Button"
import { Select, type SelectOption } from "./ui/Select"
import type { VersionInfo, ViewName } from "../utils/types"

interface TopbarProps {
  envLabel: string
  versionInfo: VersionInfo | null
  activeView: ViewName
  viewOptions?: SelectOption[]
  onChangeView: (view: ViewName) => void
  onLogout: () => void
}

export function Topbar({
  envLabel,
  versionInfo,
  activeView,
  viewOptions,
  onChangeView,
  onLogout,
}: TopbarProps) {
  return (
    <header className="col-span-full flex items-center gap-3 border-b border-border bg-surface px-5 max-[900px]:flex-wrap">
      <div className="flex items-center gap-2 font-mono text-[13px] font-semibold tracking-[0.04em] text-white">
        <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_#1877f2] animate-pulseDot"></span>
        EMAIL_PROXY
      </div>
      {versionInfo && (
        <>
          <div className="h-5 border-l border-border"></div>
          <div className="rounded-[3px] border border-borderStrong px-2 py-[3px] font-mono text-[11px] text-textDim">
            {versionInfo.version}
          </div>
        </>
      )}
      <div className="flex-1"></div>
      <div className="hidden max-[900px]:flex max-[900px]:order-last max-[900px]:w-full max-[900px]:pt-2">
        <Select
          options={
            viewOptions ?? [
              { value: "overview", label: "Overview" },
              { value: "sites", label: "Sites" },
              { value: "logs", label: "Email Logs" },
              { value: "snippet", label: "Client Snippet" },
            ]
          }
          value={activeView}
          onChange={(value) => {
            if (value) onChangeView(value as ViewName)
          }}
          placeholder="Select view"
          className="w-full max-w-[260px] max-[900px]:max-w-none"
        />
      </div>
      <div className="rounded-[3px] border border-borderStrong px-2 py-[3px] font-mono text-[11px] text-textDim">
        {envLabel}
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onLogout}>
          <LogOut size={14} />
          Logout
        </Button>
      </div>
    </header>
  )
}
