/**
 * email-client.js
 * Lightweight browser client for sending email via the Email Proxy.
 * Configure EMAIL_PROXY and EMAIL_KEY.
 * Optional: set EMAIL_AUTH_URL (defaults to EMAIL_PROXY + /auth).
 */

type EmailSendPayload = {
  to?: string
  subject: string
  text: string
  html?: string
  reply_to?: string
}

type EmailSendOptions = {
  event_source_url?: string
}

type EmailSendFn = (
  message: EmailSendPayload,
  opts?: EmailSendOptions,
) => Promise<unknown>

interface Window {
  EMAIL_AUTH_URL?: string
  EMAIL_PROXY?: string
  EMAIL_KEY?: string
  emailProxy: EmailSendFn
  sendEmail: EmailSendFn
}

interface AuthResponseBody {
  access_token?: string
  expires_at?: string
  error?: string
}

interface SendResponseBody {
  error?: string
}

;(function (window: Window) {
  "use strict"

  let accessToken = ""
  let accessTokenExpiresAtMs = 0
  let pendingTokenPromise: Promise<string> | null = null
  const TOKEN_SKEW_MS = 5000

  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null
  }

  function asString(value: unknown): string | undefined {
    return typeof value === "string" ? value : undefined
  }

  function resolveAuthUrl(): string {
    const explicit =
      typeof window.EMAIL_AUTH_URL === "string"
        ? window.EMAIL_AUTH_URL.trim()
        : ""
    if (explicit) return explicit

    const proxy = getProxyUrl()
    if (/\/email\/auth\/?$/i.test(proxy)) {
      return proxy.replace(/\/+$/, "")
    }

    return proxy.replace(/\/+$/, "") + "/auth"
  }

  function getProxyUrl(): string {
    const raw = String(window.EMAIL_PROXY || "").trim()
    if (!raw) throw new Error("EMAIL_PROXY must be set")

    if (/\/email\/?$/i.test(raw)) {
      return raw.replace(/\/+$/, "")
    }

    if (/\/event\/?$/i.test(raw)) {
      return raw.replace(/\/event\/?$/i, "/email")
    }

    return raw.replace(/\/+$/, "") + "/email"
  }

  function getApiKey(): string {
    const key = String(window.EMAIL_KEY || "").trim()
    if (!key) throw new Error("EMAIL_KEY must be set")
    return key
  }

  function eventId(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
      const random = crypto.getRandomValues(new Uint8Array(1))[0] & 15
      const value = ch === "x" ? random : (random & 3) | 8
      return value.toString(16)
    })
  }

  function normalizeMessage(input: EmailSendPayload): EmailSendPayload {
    if (!isRecord(input)) {
      throw new Error("Email payload must be an object")
    }

    const to = (asString(input.to) || "").trim()
    const subject = (asString(input.subject) || "").trim()
    const text = (asString(input.text) || "").trim()
    const htmlRaw = asString(input.html)
    const replyToRaw = asString(input.reply_to)
    const html = htmlRaw && htmlRaw.trim().length > 0 ? htmlRaw : undefined
    const replyTo =
      replyToRaw && replyToRaw.trim().length > 0 ? replyToRaw.trim() : undefined

    if (!subject) throw new Error("subject is required")
    if (!text) throw new Error("text is required")

    return {
      ...(to ? { to } : {}),
      subject,
      text,
      ...(html ? { html } : {}),
      ...(replyTo ? { reply_to: replyTo } : {}),
    }
  }

  async function fetchAccessToken(forceRefresh: boolean): Promise<string> {
    if (
      !forceRefresh &&
      accessToken &&
      Date.now() + TOKEN_SKEW_MS < accessTokenExpiresAtMs
    ) {
      return accessToken
    }

    if (!forceRefresh && pendingTokenPromise) {
      return pendingTokenPromise
    }

    pendingTokenPromise = (async function () {
      const res = await fetch(resolveAuthUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": getApiKey(),
        },
        body: JSON.stringify({ event_source_url: window.location.href }),
      })

      const bodyRaw = await res.json().catch(() => ({}))
      const body: AuthResponseBody = isRecord(bodyRaw) ? bodyRaw : {}

      const tokenValue = asString(body.access_token) ?? ""
      if (!res.ok || !tokenValue) {
        const message =
          asString(body.error) ?? "Failed to get email access token"
        throw new Error(message)
      }

      const expiresMs = Date.parse(asString(body.expires_at) ?? "")
      accessToken = tokenValue
      accessTokenExpiresAtMs = Number.isFinite(expiresMs)
        ? expiresMs
        : Date.now() + 60 * 1000

      return accessToken
    })()

    try {
      return await pendingTokenPromise
    } finally {
      pendingTokenPromise = null
    }
  }

  async function sendEmailRequest(
    payload: Record<string, unknown>,
    token: string,
  ): Promise<Response> {
    return fetch(getProxyUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": getApiKey(),
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(payload),
    })
  }

  const sendEmail: EmailSendFn = async function (
    message: EmailSendPayload,
    opts: EmailSendOptions = {},
  ): Promise<unknown> {
    const normalized = normalizeMessage(message)

    const payload: Record<string, unknown> = {
      data: [
        {
          email_id: eventId(),
          ...normalized,
          event_source_url: opts.event_source_url || window.location.href,
          user_data: {
            client_user_agent: navigator.userAgent,
          },
        },
      ],
    }

    try {
      let token = await fetchAccessToken(false)
      let res = await sendEmailRequest(payload, token)

      if (res.status === 401) {
        token = await fetchAccessToken(true)
        res = await sendEmailRequest(payload, token)
      }

      const bodyRaw = await res.json().catch(() => ({}))
      const body: SendResponseBody = isRecord(bodyRaw) ? bodyRaw : {}

      if (!res.ok) {
        const err = asString(body.error) ?? "Email request failed"
        throw new Error(err)
      }

      return bodyRaw
    } catch (err) {
      console.warn("[emailClient] Failed:", err)
      throw err
    }
  }

  window.emailProxy = sendEmail
  window.sendEmail = sendEmail
})(window)
