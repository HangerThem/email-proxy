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
    <header className="col-span-full border-b border-border bg-surface px-4 py-3 sm:px-5 lg:flex lg:h-12 lg:items-center lg:gap-3 lg:py-0">
      <div className="flex flex-wrap items-center gap-3 lg:flex-1 lg:flex-nowrap">
        <div className="flex justify-between w-full md:w-auto items-center gap-2 font-mono text-[13px] font-semibold tracking-[0.04em] text-white">
          <div className="flex items-center gap-2 font-mono text-[13px] font-semibold tracking-[0.04em] text-white">
            <span className="h-2 w-2 animate-pulseDot rounded-full bg-accent shadow-[0_0_8px_#1877f2]"></span>
            EMAIL_PROXY
          </div>

          {versionInfo && (
            <>
              <div className="hidden md:block h-5 border-l border-border"></div>
              <div className="rounded-[3px] border border-borderStrong px-2 py-[3px] font-mono text-[11px] text-textDim">
                {versionInfo.version}
              </div>
            </>
          )}
        </div>

        <div className="md:ml-auto w-full md:w-auto flex justify-between md:justify-items items-center gap-2">
          <div className="rounded-[3px] border border-borderStrong px-2 py-[3px] font-mono text-[11px] text-textDim">
            {envLabel}
          </div>
          <Button size="sm" onClick={onLogout}>
            <LogOut size={14} />
            Logout
          </Button>
        </div>
      </div>

      <div className="mt-3 lg:hidden">
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
          className="w-full"
        />
      </div>
    </header>
  )
}
