# Phase 91.8 known limitations

91.8 implements durable batch metadata, object-storage persistence, leased workers, stale-job recovery, retry, server-built ZIPs, exact-white post-export certification, and recent job history.

Production evidence is still required for the real 50-user deployment and a 500-photo batch. The current web uploader sends images one file per request, so it avoids a single enormous batch payload and can resume processing after upload/start, but it is not a cloud-provider multipart uploader. For very large individual source files or unreliable networks, direct-to-object-storage multipart upload can be added as an infrastructure-specific optimization later without changing the durable batch job model.

Local in-memory database mode is development-only. Browser-close/server-restart durability requires a production database plus durable object storage (the production configuration gate requires R2 for the product-photo worker path).
