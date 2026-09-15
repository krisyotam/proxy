package api

import _ "embed"

// proxyDashboard ships with the binary and is independent of upstream panel updates.
//
//go:embed ui/management.html
var proxyDashboard []byte
