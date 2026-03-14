export type ViewName = "overview" | "sites" | "logs" | "snippet"

export type ToastType = "success" | "error" | "info"

export interface Site {
  id: string
  name: string
  domain: string
  smtp_host?: string | null
  smtp_port?: number | null
  smtp_user?: string | null
  smtp_secure?: boolean | number | null
  smtp_name?: string | null
  smtp_from?: string | null
  email_to?: string | null
  active: boolean | number
  api_key?: string | null
  note?: string | null
  created_at?: string | null
}

export interface SiteLog {
  id: number
  created_at?: string | null
  from_email?: string | null
  to_email?: string | null
  subject?: string | null
  body_text?: string | null
  body_html?: string | null
  ip?: string | null
  error?: string | null
}

export interface SiteFormState {
  id: string
  name: string
  domain: string
  smtp_host: string
  smtp_port: string
  smtp_user: string
  smtp_pass: string
  smtp_secure: string
  smtp_name: string
  smtp_from: string
  email_to: string
  note: string
}

export interface ToastMessage {
  id: number
  type: ToastType
  message: string
}

export interface VersionInfo {
  version: string
  env: string
}
