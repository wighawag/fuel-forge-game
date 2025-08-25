import type { OnchainState } from '$lib/onchain/types';
import { Blockie } from '$lib/utils/ethereum/blockie';
import { viewState } from '$lib/view';
import { Container, Graphics, Sprite } from 'pixi.js';
import type { Readable } from 'svelte/store';
import { LoadingSprite } from './LoadingSprite';

export function createRenderer(viewState: Readable<OnchainState>) {
	let charactersDisplayObjects: { [id: string]: Container } = {};
	let unsubscribe: (() => void) | undefined = undefined;
	function onAppStarted(container: Container) {
		unsubscribe = viewState.subscribe(($viewState) => {
			for (const characterID of Object.keys($viewState)) {
				const character = $viewState[characterID];
				let characterContainer = charactersDisplayObjects[characterID];
				if (!characterContainer) {
					characterContainer = new Container();
					const sprite = new LoadingSprite(Blockie.getURI(character.id));
					// const graphics = new Graphics().rect(0, 0, 10, 10).fill(0xff0000);
					// characterContainer.addChild(graphics);
					characterContainer.addChild(sprite);
					characterContainer.scale = 10 / 8;

					container.addChild(characterContainer);
					charactersDisplayObjects[characterID] = characterContainer;
				}
				characterContainer.x = 10 * character.position.x;
				characterContainer.y = 10 * character.position.y;
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
