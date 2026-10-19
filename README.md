# MikroDash — Home Assistant Add-on

[MikroDash](https://github.com/SecOps-7/MikroDash) đóng gói thành add-on Home Assistant với **ingress** — truy cập được từ internet qua cổng HA (8123/HTTPS) mà **không cần mở thêm port** trên router.

## Tính năng

- Sidebar panel tự động: **MikroDash** xuất hiện trong menu trái của HA
- Ingress: toàn bộ truy cập đi qua HA, bảo mật bởi đăng nhập HA
- **Tự động setup lần đầu**: không cần nhập setup code — tự tạo account dashboard và cấu hình router từ Config tab
- Proxy shim rewrite path — tương thích hoàn toàn với ingress của HAOS

## Cài đặt

### 1. Thêm repository

Vào **Settings → Add-ons → Add-on Store → ⋯ (góc phải) → Repositories**, thêm:

```
https://github.com/minhchungit/hassio-mikrodash
```

### 2. Cài add-on

Tìm **MikroDash** trong store → **Install** → **Start** (bật Start on boot nếu muốn).

### 3. Cấu hình (tab Configuration)

| Field | Ý nghĩa | Mặc định |
|---|---|---|
| `router_host` | IP router MikroTik | `192.168.88.1` |
| `router_port` | Cổng RouterOS API | `8728` |
| `router_tls` | Dùng API-SSL | `false` |
| `router_username` | User trên router | `admin` |
| `router_password` | Password router | *(trống)* |
| `dash_username` | Account đăng nhập dashboard | `admin` |
| `dash_password` | Password dashboard | *(trống)* |

> **Lưu ý**: router chỉ cần bật `/ip service enable api` (port 8728). Nên tạo user read-only riêng (group `read` hoặc custom có policy `read,api,test`) thay vì dùng admin.

### 4. Truy cập

- Sidebar → **MikroDash** (hoặc Add-ons → MikroDash → **Open Web UI**)
- Từ internet: `https://<ha-url>/api/hassio_ingress/...` qua đăng nhập HA — không cần forward port

## Cấu trúc

```
mikrodash/
├── config.yaml    — addon manifest (ingress, options schema)
├── Dockerfile     — build: MikroDash image + proxy shim
├── proxy.go       — ingress path-rewrite shim (Go)
└── run.sh         — bootstrap: options → auto setup → router config
```

## Yêu cầu

- Home Assistant OS / Supervised (aarch64 hoặc amd64)
- RouterOS v7 với API service bật (port 8728)

## License

MikroDash © SecOps-7. Addon wrapper này dùng ảnh `ghcr.io/secops-7/mikrodash` làm base.
