package main

// Ingress shim: listens :3081, proxies to MikroDash on :3082.
// - strips X-Ingress-Path prefix before forwarding
// - auto-login upstream and inject session cookie (skip login page)
// - rewrites absolute paths in bodies/redirects with the ingress prefix

import (
	"bytes"
	"compress/gzip"
	"io"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"
)

var pats = []string{"/api/", "/ws", "/login", "/app.js", "/app.css", "/login.js", "/preflight.js", "/vendor/", "/fonts/", "/logo.png"}

var (
	mu     sync.Mutex
	cookie string
	upURL  = "http://127.0.0.1:3082"
)

func rewrite(b []byte, base string) []byte {
	for _, p := range pats {
		b = bytes.ReplaceAll(b, []byte(`"`+p), []byte(`"`+base+p))
		b = bytes.ReplaceAll(b, []byte(`'`+p), []byte(`'`+base+p))
		b = bytes.ReplaceAll(b, []byte(`(`+p), []byte(`(`+base+p))
	}
	for _, a := range []string{`src="/`, `href="/`, `action="/`} {
		b = bytes.ReplaceAll(b, []byte(a), []byte(a[:len(a)-1]+base+`/`))
	}
	return b
}

func login() {
	u, p := os.Getenv("MKD_USER"), os.Getenv("MKD_PASS")
	if u == "" || p == "" {
		return
	}
	resp, err := http.Post(upURL+"/api/auth/login", "application/json",
		strings.NewReader(`{"username":"`+u+`","password":"`+p+`"}`))
	if err != nil {
		return
	}
	defer resp.Body.Close()
	io.Copy(io.Discard, resp.Body)
	for _, c := range resp.Cookies() {
		cookie = c.Name + "=" + c.Value
	}
}

func ensureSession() {
	mu.Lock()
	defer mu.Unlock()
	if cookie != "" {
		req, _ := http.NewRequest("GET", upURL+"/api/auth/status", nil)
		req.Header.Set("Cookie", cookie)
		if r, err := http.DefaultClient.Do(req); err == nil {
			b, _ := io.ReadAll(r.Body)
			r.Body.Close()
			if r.StatusCode == 200 && !strings.Contains(string(b), `"session":null`) {
				return
			}
		}
		cookie = ""
	}
	login()
}

func main() {
	t, _ := url.Parse(upURL)
	px := httputil.NewSingleHostReverseProxy(t)
	origDirector := px.Director
	px.Director = func(r *http.Request) {
		origDirector(r)
		if base := r.Header.Get("X-Ingress-Path"); base != "" {
			r.URL.Path = strings.TrimPrefix(r.URL.Path, base)
			if r.URL.Path == "" {
				r.URL.Path = "/"
			}
		}
		// inject upstream session -> skip login page
		ensureSession()
		if cookie != "" {
			r.Header.Set("Cookie", cookie)
		}
	}
	px.ModifyResponse = func(r *http.Response) error {
		base := r.Request.Header.Get("X-Ingress-Path")
		// skip login page: app redirects authed session elsewhere anyway
		if l := r.Header.Get("Location"); strings.HasPrefix(l, "/") {
			r.Header.Set("Location", base+l)
		}
		if base == "" {
			return nil
		}
		ct := r.Header.Get("Content-Type")
		if !(strings.Contains(ct, "html") || strings.Contains(ct, "javascript") || strings.Contains(ct, "css")) {
			return nil
		}
		var b []byte
		if r.Header.Get("Content-Encoding") == "gzip" {
			gz, err := gzip.NewReader(r.Body)
			if err != nil {
				return nil
			}
			b, _ = io.ReadAll(gz)
			gz.Close()
			r.Body.Close()
			var out bytes.Buffer
			w := gzip.NewWriter(&out)
			w.Write(rewrite(b, base))
			w.Close()
			r.Body = io.NopCloser(&out)
		} else {
			b, _ = io.ReadAll(r.Body)
			r.Body.Close()
			r.Body = io.NopCloser(bytes.NewReader(rewrite(b, base)))
		}
		r.ContentLength = -1
		r.Header.Del("Content-Length")
		return nil
	}

	// warm up: login once upstream is ready
	go func() {
		for i := 0; i < 60; i++ {
			if r, err := http.Get(upURL + "/healthz"); err == nil {
				r.Body.Close()
				ensureSession()
				return
			}
			time.Sleep(time.Second)
		}
	}()

	http.ListenAndServe(":3081", px)
}
