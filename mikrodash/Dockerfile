# Self-contained: vendored mikrodash binary + proxy + web assets, no ghcr.io dependency
ARG BUILD_FROM=alpine:3
FROM ${BUILD_FROM}
RUN apk add --no-cache ca-certificates
COPY vendor/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY vendor/mikrodash /usr/local/bin/mikrodash
COPY vendor/proxy /proxy
COPY vendor/web /app/web
COPY run.sh /run.sh
RUN chmod +x /usr/local/bin/mikrodash /proxy /run.sh
ENTRYPOINT []
CMD ["/run.sh"]
