package main

// Ingress shim: listens :3081, proxies to MikroDash on :3082.
// Rewrites absolute paths (Location header + JS/HTML/CSS bodies)
// using the X-Ingress-Path header supervisor sends, so the app
// works under /api/hassio_ingress/<token>/.

import (
	"bytes"
	"compress/gzip"
	"io"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
)

var pats = []string{"/api/", "/ws", "/login", "/app.js", "/app.css", "/login.js", "/preflight.js", "/vendor/", "/fonts/", "/logo.png"}

func rewrite(b []byte, base string) []byte {
	for _, p := range pats {
		b = bytes.ReplaceAll(b, []byte(`"`+p), []byte(`"`+base+p))
		b = bytes.ReplaceAll(b, []byte(`'`+p), []byte(`'`+base+p))
		b = bytes.ReplaceAll(b, []byte(`(`+p), []byte(`(`+base+p))
	}
	// html attrs: src="/x" href="/x" action="/x"
	for _, a := range []string{`src="/`, `href="/`, `action="/`} {
		b = bytes.ReplaceAll(b, []byte(a), []byte(a[:len(a)-1]+base+`/`))
	}
	return b
}

func main() {
	t, _ := url.Parse("http://127.0.0.1:3082")
	px := httputil.NewSingleHostReverseProxy(t)
	origDirector := px.Director
	px.Director = func(r *http.Request) {
		origDirector(r)
		// strip ingress prefix before forwarding upstream
		if base := r.Header.Get("X-Ingress-Path"); base != "" {
			r.URL.Path = strings.TrimPrefix(r.URL.Path, base)
			if r.URL.Path == "" {
				r.URL.Path = "/"
			}
		}
	}
	px.ModifyResponse = func(r *http.Response) error {
		base := r.Request.Header.Get("X-Ingress-Path")
		if base == "" {
			return nil
		}
		if l := r.Header.Get("Location"); strings.HasPrefix(l, "/") {
			r.Header.Set("Location", base+l)
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
	http.ListenAndServe(":3081", px)
}
