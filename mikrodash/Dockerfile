ARG BUILD_FROM=ghcr.io/secops-7/mikrodash:latest
FROM golang:1-alpine AS builder
WORKDIR /src
COPY proxy.go .
RUN go mod init shim && go build -o /proxy proxy.go

FROM ${BUILD_FROM}
COPY --from=builder /proxy /proxy
COPY run.sh /run.sh
RUN chmod +x /run.sh /proxy
ENTRYPOINT []
CMD ["/run.sh"]
