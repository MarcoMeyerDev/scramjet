# Vivari COEP / Scramjet experiment

This directory preserves the small source-only harness used for the **successful outside-Vivari test**. It does **not** claim that Scramjet has been made to run inside Vivari's own virtual environment yet.

## What was actually verified

- A top-level page booted the real `@vivari/core` SDK and reported its cross-origin-isolated state.
- That page loaded the Scramjet demo at `http://localhost:4141/` in a credentialless iframe. The Scramjet UI visibly rendered.
- A raw `https://example.com/` iframe was used as a control and did not visibly render in that test.
- This proves the UI can render inside an iframe hosted by the isolated SDK page. It does **not** prove the Scramjet proxy/runtime is running inside Vivari's VM, and it does not remove the separate Scramjet server/Wisp requirement.
- The `?apiTest=1` path in `packages/demo/src/index.tsx` is a separate direct-Controller test path; treat it as experimental until rerun and verified.

## Files in this experiment

- `devserver.ts`: adds COOP/COEP/CORP headers to the local Scramjet demo server.
- `packages/core/src/fetch/fetch.ts`: experimental policy headers on proxied responses when Scramjet's handler is cross-origin isolated.
- `packages/demo/src/index.tsx`: optional `?apiTest=1` test path using Scramjet's official `Controller` API.
- `vivari-sdk-test/`: source-only copy of the test page that booted Vivari first and then rendered Scramjet in an iframe. It was copied from the Vivari repo's `tools/original-sdk-scramjet-test`.

No `node_modules`, package-manager cache, compiled `dist`, generated WASM, lockfile, or logs are intentionally included here. The upstream Scramjet repo's existing manifests remain upstream-owned; reinstall dependencies after restoring.

## Restore after Windows reinstall

1. Install/reuse mise and Git; install Node `22.23.2` and pnpm `10.12.1` through mise (these were the versions used in the prior Scramjet test).
2. Clone `https://github.com/MarcoMeyerDev/scramjet.git` and check out branch `vivari-coep-experiment`.
3. In the Scramjet checkout, run `mise exec node@22.23.2 pnpm@10.12.1 -- pnpm install` and then `mise exec node@22.23.2 pnpm@10.12.1 -- pnpm dev`.
4. Copy `experiments/vivari-sdk-test` back into the Vivari checkout at `tools/original-sdk-scramjet-test` (the relative alias in its Vite config expects it to live there). Reinstall that test's declared dependencies using mise-managed Node/pnpm.
5. Run the Vivari SDK test page and verify the iframe visually. The test page expects the Scramjet dev server at `http://localhost:4141/`. The copied Vite config intentionally omits the old `/8080` proxy entries: port 8080 was a tunnel admin UI in an earlier attempt, not the Scramjet app.
6. Continue the actual inside-Vivari experiment separately: load the real Scramjet browser-side source/build assets into the Vivari environment using documented APIs, without relying on the `localhost:4141` iframe. First verify runtime boot, then test networking/proxy separately.

## Standalone same-COEP proxy prototype

`proxdocs-vivari-test/` preserves the small JavaScript-only Scramjet browser prototype that sets COOP/COEP at its own server and on proxied responses. It contains application source and `package.json`, but deliberately omits `node_modules` and `bun.lock`; reinstall dependencies with mise-managed Bun after restoring. This is a separate standalone prototype, not proof that Scramjet runs inside Vivari's VM.

Restore/run it from its folder with mise-managed Bun (`bun install`, then `bun run start`). The app defaults to port 8080; set `PORT` to another free port if needed. It uses a Wisp WebSocket tunnel, so preserve the network/proxy distinction when comparing results.
## Baseline

The patch was developed from upstream Scramjet commit `b14b709ac190b786dd03becbd0728ab72bdd3ad6` on the `main` branch. Compare the source with upstream before rebasing or merging future upstream changes.
