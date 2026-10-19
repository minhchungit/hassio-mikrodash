# Build proxy shim from source; runtime = alpine + vendored mikrodash binary/web assets
FROM golang:1-alpine AS builder
WORKDIR /src
COPY proxy.go main.go
RUN go mod init shim && CGO_ENABLED=0 GOARCH=arm64 go build -o /proxy .

FROM alpine:3
RUN apk add --no-cache ca-certificates
COPY vendor/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY vendor/mikrodash /usr/local/bin/mikrodash
COPY vendor/web /app/web
COPY --from=builder /proxy /proxy
COPY run.sh /run.sh
RUN chmod +x /usr/local/bin/mikrodash /proxy /run.sh
ENTRYPOINT []
CMD ["/run.sh"]
