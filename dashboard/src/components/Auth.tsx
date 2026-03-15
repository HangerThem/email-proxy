import { TextInput } from "./ui/Input"
import { Button } from "./ui/Button"
import { Card, CardHeader, CardTitle } from "./ui/Card"
import { useAdminApi } from "../context/AdminApiContext"

export function Auth() {
  const { connect, setSecretInput, serverUrlInput, setServerUrlInput } =
    useAdminApi()

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-4 py-10">
      <div className="relative flex w-full justify-center">
        <div className="absolute -top-12 flex items-center gap-2 font-mono text-2xl font-semibold tracking-[0.04em] text-white sm:-top-16 sm:text-3xl">
          <span className="h-2.5 w-2.5 animate-pulseDot rounded-full bg-accent shadow-[0_0_8px_#1877f2] sm:h-3 sm:w-3"></span>
          EMAIL_PROXY
        </div>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Login</CardTitle>
          </CardHeader>

          <div className="space-y-6 p-5 sm:p-6">
            <TextInput
              placeholder="Proxy URL (e.g. https://api.example.com)"
              type="url"
              autoComplete="off"
              list="proxy-url-history"
              value={serverUrlInput}
              onChange={(e) => setServerUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void connect()
                }
              }}
            />

            <TextInput
              placeholder="Password"
              type="password"
              onChange={(e) => setSecretInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void connect()
                }
              }}
            />

            <Button className="w-full" onClick={() => void connect()}>
              Connect
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
