import { useCallback, useEffect, useState } from "react"

import type { Site } from "../utils/types"
import { useToast } from "../context/ToastContext"
import { useAdminApi } from "../context/AdminApiContext"

const DEFAULT_SNIPPET_USAGE = `// Basic email
sendEmail({
  to: 'support@example.com',
  subject: 'New lead',
  text: 'Name: Jane Doe\\nEmail: jane@example.com'
});

// With HTML
sendEmail({
  to: 'support@example.com',
  subject: 'New inquiry',
  text: 'Fallback text',
  html: '<p><strong>Hello</strong> from the site.</p>'
});
`

export function useSnippet(sites: Site[]) {
  const { addToast } = useToast()
  const { baseUrl } = useAdminApi()

  const [snippetSiteId, setSnippetSiteId] = useState("")
  const [snippetTag, setSnippetTag] = useState("Loading…")
  const [snippetUsage, setSnippetUsage] = useState("Loading…")

  const buildSnippet = useCallback(() => {
    const generatedUrl = `${baseUrl}/email`
    const selectedSite = sites.find((site) => site.id === snippetSiteId)
    const apiKey = selectedSite?.api_key || "email_YOUR_KEY_HERE"

    setSnippetTag(`<!-- Add before </body> -->
<script>
  var EMAIL_PROXY = '${generatedUrl}';
  var EMAIL_KEY   = '${apiKey}';
</script>
<script src="${baseUrl}/email-client.js"></script>`)

    setSnippetUsage(DEFAULT_SNIPPET_USAGE)
  }, [sites, snippetSiteId])

  useEffect(() => {
    buildSnippet()
  }, [buildSnippet])

  const copySnippetTag = useCallback(() => {
    if (!navigator.clipboard) {
      addToast("Clipboard is not available in this browser", "error")
      return
    }

    navigator.clipboard
      .writeText(snippetTag)
      .then(() => addToast("Copied to clipboard", "success"))
      .catch(() => addToast("Failed to copy snippet", "error"))
  }, [addToast, snippetTag])

  const copyKey = useCallback(
    (key: string) => {
      if (!key || key === "-") return

      if (!navigator.clipboard) {
        addToast("Clipboard is not available in this browser", "error")
        return
      }

      navigator.clipboard
        .writeText(key)
        .then(() => addToast("API key copied", "success"))
        .catch(() => addToast("Failed to copy API key", "error"))
    },
    [addToast],
  )

  return {
    snippetSiteId,
    setSnippetSiteId,
    snippetTag,
    snippetUsage,
    buildSnippet,
    copySnippetTag,
    copyKey,
  }
}
