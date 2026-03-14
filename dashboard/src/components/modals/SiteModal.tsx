import { X } from "lucide-react"
import type { SiteFormState } from "../../utils/types"
import { Button } from "../ui/Button"
import { Field, FieldHint, FieldLabel } from "../ui/Field"
import { TextInput } from "../ui/Input"
import { Select } from "../ui/Select"
import {
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
} from "../ui/Modal"

interface SiteModalProps {
  isOpen: boolean
  mode: "create" | "edit"
  form: SiteFormState
  isSaving: boolean
  onChange: (field: keyof SiteFormState, value: string) => void
  onClose: () => void
  onSave: () => void
}

export function SiteModal({
  isOpen,
  mode,
  form,
  isSaving,
  onChange,
  onClose,
  onSave,
}: SiteModalProps) {
  const title = mode === "edit" ? "Edit Site" : "New Site"
  const submitLabel = mode === "edit" ? "Save Changes" : "Create Site"
  const secureOptions = [
    { label: "true (TLS on connect)", value: "true" },
    { label: "false (STARTTLS)", value: "false" },
  ]

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <ModalPanel>
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          <ModalCloseButton onClick={onClose}>
            <X size={14} />
          </ModalCloseButton>
        </ModalHeader>

        <ModalBody>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field>
              <FieldLabel>Site Name</FieldLabel>
              <TextInput
                value={form.name}
                placeholder="My Shop"
                onChange={(event) => onChange("name", event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel>Domain (origin)</FieldLabel>
              <TextInput
                value={form.domain}
                placeholder="https://myshop.com"
                onChange={(event) => onChange("domain", event.target.value)}
              />
              <FieldHint>Must match the site's origin exactly</FieldHint>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field>
              <FieldLabel>SMTP Host</FieldLabel>
              <TextInput
                value={form.smtp_host}
                placeholder="smtp.example.com"
                onChange={(event) => onChange("smtp_host", event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel>SMTP Port</FieldLabel>
              <TextInput
                value={form.smtp_port}
                placeholder="587"
                onChange={(event) => onChange("smtp_port", event.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field>
              <FieldLabel>SMTP User</FieldLabel>
              <TextInput
                value={form.smtp_user}
                placeholder="username"
                onChange={(event) => onChange("smtp_user", event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel>SMTP Password</FieldLabel>
              <TextInput
                type="password"
                value={form.smtp_pass}
                placeholder="••••••••"
                onChange={(event) => onChange("smtp_pass", event.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field>
              <FieldLabel>SMTP Secure</FieldLabel>
              <Select
                value={form.smtp_secure || null}
                options={secureOptions}
                onChange={(value) => onChange("smtp_secure", String(value ?? ""))}
                placeholder="Select TLS mode"
              />
              <FieldHint>Use true for port 465, false for STARTTLS.</FieldHint>
            </Field>

            <Field>
              <FieldLabel>Sender Name (optional)</FieldLabel>
              <TextInput
                value={form.smtp_name}
                placeholder="My Brand"
                onChange={(event) => onChange("smtp_name", event.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field>
              <FieldLabel>Sender Email</FieldLabel>
              <TextInput
                value={form.smtp_from}
                placeholder="no-reply@example.com"
                onChange={(event) => onChange("smtp_from", event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel>Default Recipient (optional)</FieldLabel>
              <TextInput
                value={form.email_to}
                placeholder="support@example.com"
                onChange={(event) => onChange("email_to", event.target.value)}
              />
              <FieldHint>Used when the client omits the “to” field.</FieldHint>
            </Field>
          </div>

          <Field>
            <FieldLabel>Note (optional)</FieldLabel>
            <TextInput
              value={form.note}
              placeholder="Internal memo…"
              onChange={(event) => onChange("note", event.target.value)}
            />
          </Field>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onSave} disabled={isSaving}>
            {isSaving ? "Saving…" : submitLabel}
          </Button>
        </ModalFooter>
      </ModalPanel>
    </ModalBackdrop>
  )
}
