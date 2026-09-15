# proxy

A personal AI gateway with a dark account-pool dashboard. Based on [CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI), with the original Go proxy engine and protocol compatibility.

## Start locally

Requires Go 1.26+ and OpenSSL. From this repository:

```sh
./scripts/start.sh
```

On first start, the script generates a local-only `config.yaml`, a management key, and a client API key. Find the keys in `.proxy-local-credentials` (owner-readable and ignored by Git). Open **http://127.0.0.1:8317/management.html**, click **Connect**, and enter the management key. Subsequent starts preserve your configuration.

Import credential JSON through **Manage**, or use **Provider sign-in** to open the upstream OAuth panel. Your API base URL is `http://127.0.0.1:8317/v1`; use the client API key for API requests. Provider accounts are not preconfigured.

## Dashboard

- **Overview:** account pools, provider filters, search, reported allowance windows, reset times, and account status.
- **Manage:** import credential JSON and enable or pause account routing.
- **Logs:** filter the latest 300 server log lines.
- **Settings:** change file logging, usage statistics, and routing strategy.
- **Advanced panel:** OAuth sign-in, API keys, model aliases, and other upstream configuration at `/management.html?panel=upstream&safe-mode=configure`.

The dashboard is embedded in the Go binary. Upstream panel updates cannot overwrite it. Open `internal/api/ui/management.html` directly for an offline design preview, or append `?demo=1` to the server dashboard URL. Preview accounts are fictional and preview mode cannot mutate your server.

Quotas come from reported Codex/Claude headers or supported quota providers/probes. Missing quotas display “Not reported”; values may be stale until providers report new observations. Provider totals sum the preferred (weekly where available) allowance per enabled, reporting account; they are account percentages, not interchangeable token balances. Request totals are successful requests reported by the server, not active requests. Management keys stay in browser memory and clear on reload/disconnect.

## Development

```sh
go build -o proxy ./cmd/server
node --test scripts/test-ui.mjs
go test ./internal/api ./internal/api/handlers/management ./internal/managementasset
```

Edit `internal/api/ui/management.html` and rebuild to update the bundled dashboard. The UI has no npm dependencies or external assets. Go module identifiers remain upstream-compatible so updates and SDK imports stay straightforward.

See [upstream documentation](README_UPSTREAM.md) for providers, CLI flags, Docker, and detailed configuration. The upstream MIT license and attribution are retained in [LICENSE](LICENSE).
