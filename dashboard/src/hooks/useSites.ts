import { useCallback, useState } from "react"

import type { Site, SiteFormState } from "../utils/types"
import type { ApiFetch } from "../context/AdminApiContext"
import { useToast } from "../context/ToastContext"

const EMPTY_SITE_FORM: SiteFormState = {
  id: "",
  name: "",
  domain: "",
  smtp_host: "",
  smtp_port: "",
  smtp_user: "",
  smtp_pass: "",
  smtp_secure: "",
  smtp_name: "",
  smtp_from: "",
  email_to: "",
  note: "",
}

interface CreateSiteResponse {
  api_key: string
}

interface RotateKeyResponse {
  api_key: string
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return "Unexpected error"
}

export function useSites(apiFetch: ApiFetch) {
  const { addToast } = useToast()

  const [sites, setSites] = useState<Site[]>([])

  const [siteModalOpen, setSiteModalOpen] = useState(false)
  const [siteModalMode, setSiteModalMode] = useState<"create" | "edit">(
    "create",
  )
  const [siteForm, setSiteForm] = useState<SiteFormState>(EMPTY_SITE_FORM)
  const [isSavingSite, setIsSavingSite] = useState(false)

  const [rotateModalOpen, setRotateModalOpen] = useState(false)
  const [rotateSiteId, setRotateSiteId] = useState<string | null>(null)
  const [rotateResult, setRotateResult] = useState("")
  const [isRotating, setIsRotating] = useState(false)

  const loadSites = useCallback(async () => {
    try {
      const response = await apiFetch<Site[]>("/admin/sites")
      setSites(response)
      return response
    } catch (error) {
      addToast("Failed to load sites: " + getErrorMessage(error), "error")
      return null
    }
  }, [addToast, apiFetch])

  const openAddModal = useCallback(() => {
    setSiteModalMode("create")
    setSiteForm(EMPTY_SITE_FORM)
    setSiteModalOpen(true)
  }, [])

  const openEditModal = useCallback(
    (siteId: string) => {
      const site = sites.find((item) => item.id === siteId)
      if (!site) return

      setSiteModalMode("edit")
      setSiteForm({
        id: site.id,
        name: site.name || "",
        domain: site.domain || "",
        smtp_host: site.smtp_host || "",
        smtp_port: site.smtp_port ? String(site.smtp_port) : "",
        smtp_user: site.smtp_user || "",
        smtp_pass: "",
        smtp_secure:
          site.smtp_secure === true || site.smtp_secure === 1
            ? "true"
            : site.smtp_secure === false || site.smtp_secure === 0
              ? "false"
              : "",
        smtp_name: site.smtp_name || "",
        smtp_from: site.smtp_from || "",
        email_to: site.email_to || "",
        note: site.note || "",
      })
      setSiteModalOpen(true)
    },
    [sites],
  )

  const saveSite = useCallback(async () => {
    const id = siteForm.id.trim()
    const name = siteForm.name.trim()
    const domain = siteForm.domain.trim()
    const smtpHost = siteForm.smtp_host.trim()
    const smtpPortRaw = siteForm.smtp_port.trim()
    const smtpUser = siteForm.smtp_user.trim()
    const smtpPass = siteForm.smtp_pass.trim()
    const smtpSecureRaw = siteForm.smtp_secure.trim().toLowerCase()
    const smtpName = siteForm.smtp_name.trim()
    const smtpFrom = siteForm.smtp_from.trim()
    const emailTo = siteForm.email_to.trim()
    const note = siteForm.note.trim()

    if (!name || !domain) {
      addToast("Name and domain are required", "error")
      return false
    }

    const smtpPort = smtpPortRaw ? Number.parseInt(smtpPortRaw, 10) : null
    if (smtpPortRaw && (!Number.isFinite(smtpPort) || smtpPort! <= 0)) {
      addToast("SMTP port must be a valid number", "error")
      return false
    }

    let smtpSecure: boolean | null = null
    if (smtpSecureRaw) {
      if (smtpSecureRaw === "true" || smtpSecureRaw === "1") {
        smtpSecure = true
      } else if (smtpSecureRaw === "false" || smtpSecureRaw === "0") {
        smtpSecure = false
      } else {
        addToast('SMTP secure must be "true" or "false"', "error")
        return false
      }
    }

    if (!id) {
      if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !smtpFrom) {
        addToast(
          "SMTP host, port, user, password, and sender email are required",
          "error",
        )
        return false
      }

      if (smtpSecure === null) {
        addToast('SMTP secure must be "true" or "false"', "error")
        return false
      }
    }

    setIsSavingSite(true)

    try {
      if (id) {
        const body: Record<string, string | number | boolean> = {
          name,
          domain,
          note,
        }
        if (smtpHost) body.smtp_host = smtpHost
        if (smtpPort) body.smtp_port = smtpPort
        if (smtpUser) body.smtp_user = smtpUser
        if (smtpPass) body.smtp_pass = smtpPass
        if (smtpName) body.smtp_name = smtpName
        if (smtpFrom) body.smtp_from = smtpFrom
        if (emailTo) body.email_to = emailTo
        if (smtpSecure !== null) body.smtp_secure = smtpSecure

        await apiFetch(`/admin/sites/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        })

        addToast("Site updated", "success")
      } else {
        const created = await apiFetch<CreateSiteResponse>("/admin/sites", {
          method: "POST",
          body: JSON.stringify({
            name,
            domain,
            smtp_host: smtpHost,
            smtp_port: smtpPort,
            smtp_user: smtpUser,
            smtp_pass: smtpPass,
            smtp_secure: smtpSecure,
            smtp_name: smtpName,
            smtp_from: smtpFrom,
            email_to: emailTo,
            note,
          }),
        })

        addToast("Site created. API key: " + created.api_key, "info")
      }

      setSiteModalOpen(false)
      setSiteForm(EMPTY_SITE_FORM)
      await loadSites()

      return true
    } catch (error) {
      addToast("Error: " + getErrorMessage(error), "error")
      return false
    } finally {
      setIsSavingSite(false)
    }
  }, [addToast, apiFetch, loadSites, siteForm])

  const deleteSite = useCallback(
    async (siteId: string, siteName: string) => {
      if (!window.confirm(`Delete "${siteName}"? This cannot be undone.`)) {
        return
      }

      try {
        await apiFetch(`/admin/sites/${siteId}`, { method: "DELETE" })
        addToast("Site deleted", "success")
        await loadSites()
      } catch (error) {
        addToast("Delete failed: " + getErrorMessage(error), "error")
      }
    },
    [addToast, apiFetch, loadSites],
  )

  const openRotateModal = useCallback((siteId: string) => {
    setRotateSiteId(siteId)
    setRotateResult("")
    setIsRotating(false)
    setRotateModalOpen(true)
  }, [])

  const confirmRotate = useCallback(async () => {
    if (!rotateSiteId) return

    setIsRotating(true)

    try {
      const response = await apiFetch<RotateKeyResponse>(
        `/admin/sites/${rotateSiteId}/rotate`,
        { method: "POST" },
      )

      setRotateResult("New key: " + response.api_key)
      addToast("Key rotated - copy the new key now", "success")
      await loadSites()
    } catch (error) {
      setRotateResult("")
      addToast("Rotate failed: " + getErrorMessage(error), "error")
    } finally {
      setIsRotating(false)
    }
  }, [addToast, apiFetch, loadSites, rotateSiteId])

  const changeSiteActivity = useCallback(
    async (siteId: string, active: boolean) => {
      try {
        await apiFetch(`/admin/sites/${siteId}`, {
          method: "PATCH",
          body: JSON.stringify({ active }),
        })
        addToast(`Site ${active ? "activated" : "deactivated"}`, "success")
        await loadSites()
      } catch (error) {
        addToast("Failed to update site: " + getErrorMessage(error), "error")
      }
    },
    [addToast, apiFetch, loadSites],
  )

  const sendTestEmail = useCallback(
    async (siteId: string) => {
      try {
        const response = await apiFetch<{
          ok: boolean
          message_id?: string
        }>(`/admin/sites/${siteId}/test-email`, {
          method: "POST",
        })
        const messageInfo = response.message_id
          ? " (message id: " + response.message_id + ")"
          : ""
        addToast("Test email sent (check your inbox)" + messageInfo, "success")
      } catch (error) {
        addToast(
          "Failed to send test email: " + getErrorMessage(error),
          "error",
        )
      }
    },
    [addToast, apiFetch],
  )

  const testConnection = useCallback(
    async (siteId: string) => {
      try {
        const response = await apiFetch<{
          ok: boolean
          latency_ms?: number
        }>(`/admin/sites/${siteId}/test-connection`, { method: "POST" })

        const latency =
          typeof response.latency_ms === "number"
            ? " (" + response.latency_ms + " ms)"
            : ""
        addToast("SMTP connection OK" + latency, "success")
      } catch (error) {
        addToast(
          "SMTP connection failed: " + getErrorMessage(error),
          "error",
        )
      }
    },
    [addToast, apiFetch],
  )

  return {
    sites,
    setSites,
    loadSites,

    siteModalOpen,
    setSiteModalOpen,
    siteModalMode,
    siteForm,
    setSiteForm,
    isSavingSite,
    openAddModal,
    openEditModal,
    saveSite,
    deleteSite,
    changeSiteActivity,

    rotateModalOpen,
    setRotateModalOpen,
    rotateResult,
    isRotating,
    openRotateModal,
    confirmRotate,

    sendTestEmail,
    testConnection,
  }
}
