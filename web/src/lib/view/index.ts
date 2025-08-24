import { createDirectReadStore } from '$lib/onchain/direct-read';
import { camera } from '$lib/render/camera';
import { get, writable } from 'svelte/store';

// export type ViewState = {};

// export const viewState = writable<ViewState>({});

export const viewState = createDirectReadStore(camera);

(globalThis as any).viewState = viewState;
(globalThis as any).get = get;
