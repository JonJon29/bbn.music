import { asWebGenComponent, HTMLComponent } from "webgen/mod.ts";

@asWebGenComponent("audio")
export class AudioComponent extends HTMLComponent {
    audioElement: HTMLAudioElement;

    constructor(source: { url: string; authToken: string }) {
        super();
        this.audioElement = document.createElement("audio");
        this.audioElement.controls = true;
        this.shadowRoot!.append(this.audioElement);

        this.#setupAuthenticatedStreaming(source.url, source.authToken);
    }

    async #setupAuthenticatedStreaming(url: string, authToken: string) {
        let registration = await navigator.serviceWorker.getRegistration("/");
        if (!registration) {
            registration = await navigator.serviceWorker.register("/audio-sw.js", { scope: "/" });
            await navigator.serviceWorker.ready;
        }

        if (!navigator.serviceWorker.controller) {
            await new Promise<void>((resolve) => {
                navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true });
                if (registration.waiting) {
                    registration.waiting.postMessage({ type: "SKIP_WAITING" });
                }
            });
        }

        const songId = url.split("/songs/")[1].split("/")[0];
        navigator.serviceWorker.controller!.postMessage({
            type: "SET_AUTH_TOKEN",
            pattern: `/songs/${songId}/`,
            token: authToken,
        });

        this.audioElement.src = url;
        this.audioElement.preload = "metadata";
    }

    override make() {
        const obj = {
            ...super.make(),
            setAutoplay: () => {
                this.audioElement.autoplay = true;
                return obj;
            },
        };
        return obj;
    }
}

export function Audio(source: { url: string; authToken: string }) {
    return new AudioComponent(source).make();
}
