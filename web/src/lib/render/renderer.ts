import type { OnchainState } from '$lib/onchain/types';
import { viewState } from '$lib/view';
import { Graphics, type Container } from 'pixi.js';
import type { Readable } from 'svelte/store';

export function createRenderer(viewState: Readable<OnchainState>) {
	let charactersDisplayObjects: { [id: string]: Graphics } = {};
	let unsubscribe: (() => void) | undefined = undefined;
	function onAppStarted(container: Container) {
		unsubscribe = viewState.subscribe(($viewState) => {
			for (const characterID of Object.keys($viewState)) {
				const character = $viewState[characterID];
				let graphics = charactersDisplayObjects[characterID];
				if (!graphics) {
					graphics = new Graphics().rect(50, 50, 100, 100).fill(0xff0000);
					container.addChild(graphics);
					charactersDisplayObjects[characterID] = graphics;
				}
			}
			// TODO
			// const graphics = new Graphics().rect(50, 50, 100, 100).fill(0xff0000);
			// // TODO + update
			// // need to keep track of what need to be ADDED and REMOVED
			// // ADDED is easy as we can have a dict (characterID => DisplayObject)
			// // REMOVED required to get the list of characterId that was previouly added and a dict of characterID from state
			// const charactersDisplayObjects = {};
			// for (const key of Object.keys(characters)) {
			// 	const charactersDisplayObject = {}; // TODO
			// }
		});
	}

	function onAppStopped() {
		unsubscribe?.();
	}

	return {
		onAppStarted,
		onAppStopped
	};
}

export const renderer = createRenderer(viewState);

export type Renderer = ReturnType<typeof createRenderer>;
