"use strict"

import nodemailer from "nodemailer"
import type SMTPTransport from "nodemailer/lib/smtp-transport"

import type { SiteRow } from "./types"

export type SmtpConfig = {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  name: string | null
  from: string
}

type SmtpConfigResult =
  | { ok: true; config: SmtpConfig }
  | { ok: false; error: string }

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function coerceBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value === 1
  if (typeof value === "string")
    return value === "1" || value.toLowerCase() === "true"
  return false
}

export function getSmtpConfig(site: SiteRow): SmtpConfigResult {
  const host = toNonEmptyString(site.smtp_host)
  if (!host) return { ok: false, error: "smtp_host is required for this site" }

  const port =
    typeof site.smtp_port === "number" && Number.isFinite(site.smtp_port)
      ? site.smtp_port
      : null
  if (!port || port <= 0) {
    return { ok: false, error: "smtp_port is required for this site" }
  }

  const user = toNonEmptyString(site.smtp_user)
  if (!user) return { ok: false, error: "smtp_user is required for this site" }

  const pass = toNonEmptyString(site.smtp_pass)
  if (!pass) return { ok: false, error: "smtp_pass is required for this site" }

  const from = toNonEmptyString(site.smtp_from) ?? user
  if (!from) {
    return { ok: false, error: "smtp_from is required for this site" }
  }

  const name = toNonEmptyString(site.smtp_name)
  const secure = coerceBoolean(site.smtp_secure)

  return {
    ok: true,
    config: { host, port, secure, user, pass, name, from },
  }
}

export function createSmtpTransport(
  config: SmtpConfig,
  extra?: Partial<SMTPTransport.Options>,
) {
  const options: SMTPTransport.Options = {
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    ...(extra ?? {}),
  }

  return nodemailer.createTransport(options)
}

export function formatFromAddress(config: SmtpConfig): string {
  return config.name ? `${config.name} <${config.from}>` : config.from
}
