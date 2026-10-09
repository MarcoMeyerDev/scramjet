import LoadInterstitial from "./components/LoadInterstitial";

import App from "./App";
import LibcurlClient from "@mercuryworkshop/libcurl-transport";
import EpoxyClient from "@mercuryworkshop/epoxy-transport";
import { defaultConfigDev } from "@mercuryworkshop/scramjet";
import { Controller } from "@mercuryworkshop/scramjet-controller";
import { HttpCachePlugin } from "@mercuryworkshop/scramjet-utils";
import { demoSettingsStore } from "./store";

let app = document.getElementById("app")!;

let controller: InstanceType<typeof Controller>;
const cachePlugin = new HttpCachePlugin();

export function getTransport(): LibcurlClient | EpoxyClient {
	const wispUrl = demoSettingsStore.wispUrl;
	switch (demoSettingsStore.transport) {
		case "epoxy":
			return new EpoxyClient({ wisp: wispUrl });
		case "libcurl":
		default:
			return new LibcurlClient({ wisp: wispUrl });
	}
}

async function waitForControllerOrReady(timeoutMs = 10000): Promise<void> {
	if (navigator.serviceWorker.controller) return;

	const ready = navigator.serviceWorker.ready.then(() => {});
	const controllerChanged = new Promise<void>((resolve) => {
		const onChange = () => {
			navigator.serviceWorker.removeEventListener("controllerchange", onChange);
			resolve();
		};
		navigator.serviceWorker.addEventListener("controllerchange", onChange, {
			once: true,
		} as any);
	});
	const timeout = new Promise<void>((resolve) =>
		setTimeout(resolve, timeoutMs)
	);

	await Promise.race([ready, controllerChanged, timeout]);
}

async function init() {
	const interstitial: any = (
		<LoadInterstitial status={"Loading"}></LoadInterstitial>
	);
	document.body.append(interstitial);
	interstitial.showModal();

	try {
		const registration = await navigator.serviceWorker.register("./sw.js");

		const updateStatus = (sw: ServiceWorker | null) => {
			if (!sw) return;
			const set = (msg: string) => (interstitial.$.state.status = msg);
			const apply = () => {
				switch (sw.state) {
					case "installing":
						set("Installing service worker...");
						break;
					case "installed":
						set("Service worker installed, waiting to activate...");
						break;
					case "activating":
						set("Activating service worker...");
						break;
					case "activated":
						set("Service worker activated");
						break;
					case "redundant":
						set("Service worker became redundant");
						break;
				}
			};
			apply();
			sw.addEventListener("statechange", apply);
		};

		updateStatus(registration.installing ?? registration.waiting ?? null);

		interstitial.$.state.status =
			"Waiting for service worker to take control...";
		await waitForControllerOrReady(10000);
		interstitial.$.state.status =
			"Service worker ready, waiting for controller init";
		const readySw = navigator.serviceWorker.controller ?? registration.active;
		if (!readySw) {
			throw new Error("No service worker available for controller");
		}
		controller = new Controller({
			serviceworker: readySw,
			transport: getTransport(),
			scramjetConfig: defaultConfigDev,
		});
		await controller.wait();
		console.log(controller);
		interstitial.$.state.status = "Controller initialized";
		interstitial.close();

		if (new URL(location.href).searchParams.get("apiTest") === "1") {
			const target = "https://example.com/";
			const host = document.createElement("div");
			host.style.cssText = "font:16px monospace;padding:16px;background:#111;color:#eee;height:100vh;box-sizing:border-box";
			host.innerHTML = `<div>Scramjet Controller API test</div><div>Target: ${target}</div><div id="status">Creating Frame...</div>`;
			document.body.replaceChildren(host);

			const status = host.querySelector("#status")!;
			const frameElement = document.createElement("iframe");
			frameElement.style.cssText = "display:block;width:100%;height:80vh;border:1px solid #444;margin-top:12px;background:white";
			host.append(frameElement);

			const frame = controller.createFrame(frameElement);
			frameElement.addEventListener("load", async () => {
				try {
					await new Promise((resolve) => setTimeout(resolve, 250));
					const text = frameElement.contentDocument?.body?.innerText ?? "";
					const response = await frameElement.contentWindow?.fetch(frameElement.contentWindow.location.href);
					const coep = response?.headers.get("Cross-Origin-Embedder-Policy");
					const coop = response?.headers.get("Cross-Origin-Opener-Policy");
					const corp = response?.headers.get("Cross-Origin-Resource-Policy");
					const loaded = /Example Domain/i.test(text);
					status.textContent = loaded
						? `PASS: external target rendered through Scramjet API | crossOriginIsolated=${frameElement.contentWindow?.crossOriginIsolated} | COEP=${coep} | COOP=${coop} | CORP=${corp}`
						: `FAIL: Scramjet frame loaded but target content was not rendered | COEP=${coep} | COOP=${coop} | CORP=${corp}`;
					window.parent.postMessage({ type: "scramjet-api-test", loaded, crossOriginIsolated: frameElement.contentWindow?.crossOriginIsolated, coep, coop, corp, target }, "*");
				} catch (error) {
					status.textContent = `FAIL: ${error}`;
					window.parent.postMessage({ type: "scramjet-api-test", loaded: false, error: String(error), target }, "*");
				}
			});

			status.textContent = "Calling controller.createFrame() then frame.go(target)...";
			frame.go(target);
			return;
		}
	} catch (e) {
		console.error("Error during service worker registration:", e);
		try {
			interstitial.close();
		} catch {}
		app.innerText =
			"Failed to register service worker. Check console for details.";
	}
}

async function mount() {
	try {
		const root = <App />;
		app.replaceWith(root);
	} catch (e) {
		let err = e as any;
		app.replaceWith(
			document.createTextNode(
				`Error mounting: ${"message" in err ? err.message : err}`
			)
		);
		console.error(err);
		throw e;
	}
}

init().then(() => {
	if (new URL(location.href).searchParams.get("apiTest") !== "1") mount();
});
export { controller, cachePlugin };
