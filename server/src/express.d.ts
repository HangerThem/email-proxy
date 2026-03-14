import type { AdminAuthContext, EmailAuthContext, SiteRow } from "./types"

declare global {
  namespace Express {
    interface Request {
      adminAuth?: AdminAuthContext
      site?: SiteRow
      siteOrigin?: string | null
      requestOrigin?: string | null
      clientIp?: string | null
      emailAuth?: EmailAuthContext
    }
  }
}

export {}
