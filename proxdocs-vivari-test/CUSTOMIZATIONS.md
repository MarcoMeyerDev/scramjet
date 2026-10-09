# Customizations

## Start the generated proxy on a real external target
- **File Path:** `public/js/app.js`
- **Reason for Modification:** Changed the generated ProxDocs test application's `startUrl()` from an empty string to `https://example.com/` so the real Scramjet engine initializes and proxies an external document automatically when the app is embedded by the Vivari SDK test.
- **Purpose:** Controlled browser-level test of the actual Scramjet runtime/transport path rather than only loading the proxy shell.
- **Rollback / Re-implementation Steps:** Restore `startUrl()` to `return "";`.
- **Upstream Original URL:** `https://github.com/crllect/ProxDocs/blob/main/<generated-template-path>` (generated local project; exact generated source is produced by the ProxDocs builder rather than copied from a single upstream file).


## Scramjet cross-origin-isolated proxied-response compatibility fix
- **File / Package Name & Path:** `node_modules/@mercuryworkshop/scramjet/dist/scramjet.js`, `scramjet.mjs`, `scramjet_bundled.js`, `scramjet_bundled.mjs`
- **Purpose:** The installed Scramjet 2.0.67-alpha.2 distribution was missing the `Cross-Origin-Resource-Policy: cross-origin` header that the Vivari cross-origin-isolated page requires on Scramjet's rewritten document/iframe responses. Added the same CORP behavior already present in the local Scramjet source `packages/core/src/fetch/fetch.ts`.
- **Reason for Modification:** The original Vivari SDK → real Scramjet → real external `example.com` test reached the rewritten response but Chrome rejected it with `ERR_BLOCKED_BY_RESPONSE` because the shipped distribution removed CORP without restoring it for cross-origin-isolated responses.
- **Rollback / Re-implementation Steps:** Reinstall the package to restore the published distribution, then use a Scramjet build that includes the corresponding source change. The durable source change is already recorded in `D:\Apps\scramjet\packages\core\src\fetch\fetch.ts` and its `CUSTOMIZATIONS.md`.
- **Upstream Original URL:** `https://github.com/MercuryWorkshop/scramjet/blob/main/packages/core/src/fetch/fetch.ts`
