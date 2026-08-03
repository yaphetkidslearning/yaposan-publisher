# Launch Dashboard

Track these values during the first 24 hours and the first 7 days:

| Signal | Target |
|---|---|
| Web availability | >= 99.9% |
| API `/live` availability | >= 99.9% |
| API `/ready` availability | 100% except planned maintenance |
| HTTP 5xx rate | < 1% |
| API p95 latency | < 1.5 seconds |
| Export success rate | >= 98% |
| Oldest queued export | < 10 minutes |
| Login success rate | >= 98% excluding invalid passwords |
| Stripe webhook failures | 0 unresolved |
| Email delivery failures | < 2% |
| R2 upload failures | < 1% |

Record the deployed Git commit, Render deploy IDs, DNS change time, and operator name in the launch log.
