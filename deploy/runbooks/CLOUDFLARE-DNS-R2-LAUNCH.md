# Cloudflare DNS and R2 launch

1. Create the R2 bucket and an API token limited to that bucket.
2. Apply `deploy/cloudflare/r2-cors.json` and verify browser uploads from `https://app.yaposan.com` only.
3. Create the DNS records described by `deploy/cloudflare/dns-records.example.json`, using the actual Render targets.
4. Keep records DNS-only until Render verifies both custom domains and issues TLS certificates.
5. Enable proxying only after HTTPS works end to end and WebSocket/collaboration tests pass.
6. Set `PUBLIC_ASSET_BASE_URL` to the verified R2 custom domain.
7. Test upload, download, delete, export publication, and cache invalidation with non-production sample files.
