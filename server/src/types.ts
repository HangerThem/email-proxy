export type IsoDateString = string

export interface SiteRow {
  id: string
  name: string
  domain: string
  api_key: string
  smtp_host: string | null
  smtp_port: number | null
  smtp_user: string | null
  smtp_pass: string | null
  smtp_secure: boolean | null
  smtp_name: string | null
  smtp_from: string | null
  email_to: string | null
  active: boolean | number
  created_at: IsoDateString | Date
  note: string | null
}

export interface EmailLogRow {
  id: number
  site_id: string
  from_email: string
  to_email: string
  subject: string | null
  body_text: string | null
  body_html: string | null
  error: string | null
  ip: string | null
  created_at: IsoDateString | Date
}

export interface EmailTokenRow {
  id: string
  site_id: string
  token_hash: string
  origin: string
  ip: string | null
  expires_at: IsoDateString | Date
  revoked_at: IsoDateString | Date | null
  created_at: IsoDateString | Date
}

export interface EmailDedupRow {
  site_id: string
  email_id: string
  created_at: IsoDateString | Date
}

export interface AdminTokenRow {
  id: string
  session_id: string
  token_hash: string
  token_type: "access" | "refresh"
  expires_at: IsoDateString | Date
  revoked_at: IsoDateString | Date | null
  created_at: IsoDateString | Date
}

export interface IssuedTokenPair {
  sessionId: string
  accessToken: string
  refreshToken: string
  accessExpiresAt: IsoDateString
  refreshExpiresAt: IsoDateString
}

export interface AdminAuthContext {
  method: "token"
  sessionId: string
  accessExpiresAt: IsoDateString
  tokenId: string
}

export interface EmailAuthContext {
  id: string
  siteId: string
  origin: string | null
  ip: string | null
  expiresAt: IsoDateString
}

export interface EmailUserData extends Record<string, unknown> {
  client_ip_address?: string
  client_user_agent?: string
}

export interface EmailPayloadItem extends Record<string, unknown> {
  email_id?: string
  event_id?: string
  to?: string
  subject?: string
  text?: string
  html?: string
  reply_to?: string
  event_source_url?: string
  user_data?: EmailUserData
}

export interface EmailForwardBody {
  data?: EmailPayloadItem[]
}
