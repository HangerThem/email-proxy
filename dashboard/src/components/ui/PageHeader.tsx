import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  subtitle: string
  action?: ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 max-[700px]:flex-col max-[700px]:items-stretch">
      <div>
        <div className="font-mono text-[18px] font-semibold -tracking-[0.01em] text-white">
          {title}
        </div>
        <div className="mt-[3px] text-[13px] text-textDim">{subtitle}</div>
      </div>
      {action ? (
        <div className="max-[700px]:self-start">{action}</div>
      ) : null}
    </div>
  )
}
