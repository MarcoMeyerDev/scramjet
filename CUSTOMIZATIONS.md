# CUSTOMIZATIONS.md

## Modified Existing Files

### `devserver.ts`
- **Reason for Modification:** Added the COOP/COEP/CORP response headers required when the Scramjet demo is hosted as a nested document inside Vivari's cross-origin-isolated SDK page.
- **Upstream Original URL:** https://github.com/MercuryWorkshop/scramjet/blob/main/devserver.ts
- **Changes:** Vite dev-server responses now send:
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Embedder-Policy: require-corp`
  - `Cross-Origin-Resource-Policy: cross-origin`

### `packages/core/src/fetch/fetch.ts`
- **Reason for Modification:** When Scramjet is operating in a cross-origin-isolated context, proxied responses must carry the cross-origin isolation policy required by the embedding Vivari runtime. The modification applies the policy to normal Scramjet fetch responses, not only the existing blob/data URL path.
- **Upstream Original URL:** https://github.com/MercuryWorkshop/scramjet/blob/main/packages/core/src/fetch/fetch.ts
- **Changes:** When `handler.crossOriginIsolated` is true, proxied responses now receive:
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Embedder-Policy: require-corp`
  - `Cross-Origin-Resource-Policy: cross-origin`

## Test-Only Files / Local Harnesses

### `D:\Apps\scramjet-header-test\server.mjs`
- **Purpose:** Temporary local reverse-proxy test harness for the hosted official Scramjet demo. It adds the same Vivari-compatible response headers so the browser boundary can be tested independently of the incomplete local Scramjet build artifacts.

### `D:\Apps\vivari.dev\tools\vivari-sdk-test\src\main.js`
- **Purpose:** SDK test harness was pointed at the local header-adapted Scramjet endpoint for the second compatibility test.
- **Note:** This is a test-harness change, not a modification to Vivari itself.

### `packages/demo/src/index.tsx`
- **Reason for Modification:** Added a test-only `?apiTest=1` path that uses Scramjet's official `Controller` API directly (`controller.createFrame()` and `frame.go()`) to proxy a real external document instead of rendering the normal Scramjet demo UI. It verifies the proxied document renders and reads back the isolation headers from the proxied response.
- **Upstream Original URL:** https://github.com/MercuryWorkshop/scramjet/blob/main/packages/demo/src/index.tsx
- **Changes:** Added an API-only external target test for `https://example.com/`; the normal demo path remains unchanged when `apiTest` is absent.

## Rollback / Re-implementation Steps

- **`devserver.ts`**: Remove only the three `headers` entries added to the Vite dev-server configuration to revert this experiment. Re-add them if the test still requires the local demo page to opt into COOP/COEP/CORP.
- **`packages/core/src/fetch/fetch.ts`**: Remove the conditional `handler.crossOriginIsolated` response-header block to revert the experimental proxy-response behavior. Re-test before keeping it; it is not yet proven sufficient for the inside-Vivari goal.
- **`packages/demo/src/index.tsx`**: Remove the `?apiTest=1` branch and restore the original `init().then(() => mount())` call to revert the diagnostic test route. The normal demo path is intended to remain unchanged.
- **`experiments/README.md` and `experiments/vivari-sdk-test/`**: These are source-only experiment notes and a copy of the Vivari SDK iframe harness. They can be removed from this branch if no longer needed; no dependency was added by them. To reimplement, copy the harness back into the Vivari repository at `tools/original-sdk-scramjet-test`.

No npm/pnpm packages or runtime dependencies were added by these custom changes. Reinstall the existing project dependencies from its manifests after restoring the source.
- **`experiments/vivari-sdk-test/vite.config.ts`**: The copied SDK harness omits stale proxy entries targeting `localhost:8080`; that port was not the Scramjet demo endpoint. The harness loads the demo directly from `http://localhost:4141/`. To revert this harness-only cleanup, restore the proxy block from the original local copy, but do not use it without first verifying the endpoint.
- **`proxdocs-vivari-test/`**: Source-only snapshot of the separate standalone Scramjet/COEP prototype, kept to compare standalone behavior with the Vivari SDK test. It has no installed dependencies or lockfile in this branch; reinstall dependencies from `package.json` with mise-managed Bun. To roll it back, remove this experiment folder; to reimplement it, restore its source/config files and run its declared install/start commands.
