# Performance changes

## Findings and implementation

- The initial client bundle imported every public, authentication, student and tool page. All pages except the landing page now load on demand. Suspense boundaries inside layouts preserve navigation while a page chunk loads.
- Repeated metadata, statistics and filter-facet reads now share a bounded memory cache (five minutes for metadata, one minute for statistics/facets). Concurrent session, saved-list and unread-count reads share an in-flight request only; their completed results are not retained. Token changes and writes invalidate the cache, including requests completing after invalidation. No API response is persisted to browser storage.
- The Docker image used `php artisan serve`, whose default single PHP worker can block browsing behind slow mail/AI requests. The image now uses the official PHP 8.4 Apache variant, four bounded prefork workers, OPcache and JSON/text compression. It retains the `public` document root and Laravel's authorization-header rewrite rules. Runtime `PORT` is supported; writable Laravel directories belong to Apache's `www-data` workers. AI requests still run synchronously, so saturation is still possible if all four workers are busy.

## Local measurements

Live HTTP inspection on 2026-09-20 confirmed the then-current production frontend at
`https://menhity.pages.dev/` still served a 600,800-byte JavaScript entry point
and called `https://menhity-api-production-fad3.up.railway.app/api/v1`.
The public metadata, statistics and scholarship endpoints returned HTTP 200.
An authorization-header preflight returned HTTP 204 with
`Access-Control-Max-Age: 0`. The proposed config now uses 600 seconds to avoid
repeating eligible preflights for the same endpoint. Origin restrictions and
per-request authentication are unchanged. CI verifies both allowed origins and
rejection of a lookalike unrelated origin. Timing observed through the inspection
environment's network proxy is not a reliable measurement of user latency.

Same lockfile, Node 24, production Vite build; baseline commit `0153c142f621a312424eaaf8b00b7c48430fd4a5`.

| Metric | Before | After |
| --- | ---: | ---: |
| Initial JavaScript, including all module-preloaded chunks | 600,750 bytes | 430,005 bytes |
| Reduction in initial JavaScript | — | 28.4% |

These are build-size measurements, not a measured reduction in live page latency. CSS and font payloads are unchanged.

## Validation

- `cd frontend && npm test`: six passing tests for deduplication, TTL, session key separation, retry, invalidation races and bounded retention.
- `npm run build`: passes; the original oversized initial-chunk warning is gone.
- `npm run lint`: passes with the same 14 pre-existing warnings.
- `sh -n backend/docker-entrypoint.sh` and `git diff --check`: pass.
- Local Laravel setup/tests could not run: PHP and Composer are absent, the PHP installer timed out and the system package manager could not run under the environment's permissions. The `backend/AGENTS.md` Boost bootstrap therefore could not complete. No PHP application logic or dependencies were changed.
- Browser smoke testing could not run locally: Chromium is absent and its download timed out. Public/auth route behavior must still be checked in preview.
- Docker is unavailable locally. `.github/workflows/performance-checks.yml` adds a container build/config check, isolated SQLite startup, public/auth API smoke checks, and a test that a five-second PHP request does not block a simultaneous health check. The slow test endpoint exists only inside that disposable CI container.

## Before production rollout

1. Require the frontend and container checks to pass; review any failures before merging.
2. Deploy both frontend and API to preview. Verify login, authenticated API access, scholarship browsing, uploads/downloads and an AI operation. Confirm a second browser can browse while that operation is running.
3. Compare repeated cold/warm requests on the actual hosting service, including response times for `/api/v1/meta`, `/api/v1/stats`, `/api/v1/scholarships`, and the authenticated dashboard. Do not treat an idle-host wakeup as steady-state application latency.
4. Monitor memory and response times under concurrent load. The four-worker pool is conservative but must be sized to the host and real request memory usage. All four workers can still be occupied by long AI requests; moving those requests to a queue would be a separate change.
5. Deploy the reviewed commit. Rollback is a redeploy of the previous image/frontend; this change adds no database migrations.

References: [PHP development server](https://www.php.net/manual/en/features.commandline.webserver.php), [Apache prefork](https://httpd.apache.org/docs/2.4/mod/prefork.html), [React lazy](https://react.dev/reference/react/lazy).
