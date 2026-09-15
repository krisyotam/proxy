package api

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/router-for-me/CLIProxyAPI/v7/internal/config"
)

func TestProxyDashboardAvailability(t *testing.T) {
	for _, tc := range []struct {
		name string
		cfg  *config.Config
		want int
	}{
		{"bundled dashboard without downloaded assets", &config.Config{}, http.StatusOK},
		{"missing configuration", nil, http.StatusNotFound},
		{"disabled panel", &config.Config{RemoteManagement: config.RemoteManagement{DisableControlPanel: true}}, http.StatusNotFound},
	} {
		t.Run(tc.name, func(t *testing.T) {
			s := &Server{cfg: tc.cfg}
			router := gin.New()
			router.GET("/management.html", s.serveManagementControlPanel)
			rec := httptest.NewRecorder()
			router.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/management.html", nil))
			if rec.Code != tc.want {
				t.Fatalf("status = %d, want %d", rec.Code, tc.want)
			}
			if tc.want == http.StatusOK {
				if !strings.Contains(rec.Body.String(), "<title>proxy") {
					t.Fatal("bundled dashboard missing")
				}
				if rec.Header().Get("Cache-Control") != "no-store" {
					t.Fatal("dashboard must not be cached")
				}
			}
		})
	}
}
