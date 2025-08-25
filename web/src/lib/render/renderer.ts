import type { Character, OnchainState } from '$lib/onchain/types';
import { Blockie } from '$lib/utils/ethereum/blockie';
import { viewState } from '$lib/view';
import { Container, Graphics, Sprite } from 'pixi.js';
import type { Readable } from 'svelte/store';
import { LoadingSprite } from './LoadingSprite';

export function createRenderer(viewState: Readable<OnchainState>) {
	let displayObjects: { [id: string]: Container } = {};
	let unsubscribe: (() => void) | undefined = undefined;

	function onAppStarted(container: Container) {
		function onObjectAdded(id: string, object: Character): Container {
			const displayObject = new Container();
			const sprite = new LoadingSprite(Blockie.getURI(object.id));
			// const graphics = new Graphics().rect(0, 0, 10, 10).fill(0xff0000);
			// displayObject.addChild(graphics);
			displayObject.addChild(sprite);
			displayObject.scale = 10 / 8;

			container.addChild(displayObject);
			displayObjects[id] = displayObject;
			return displayObject;
		}

		function onObjectRemoved(displayObject: Container) {
			// TODO removal type ?
			container.removeChild(displayObject);
		}

		function updateObject(displayObject: Container, object: Character) {
			// TODO we could tween
			displayObject.x = 10 * object.position.x;
			displayObject.y = 10 * object.position.y;
		}

		unsubscribe = viewState.subscribe(($viewState) => {
			const processed = new Set();

			const objectIDs = Object.keys($viewState);
			for (const objectID of objectIDs) {
				processed.add(objectID);

				const object = $viewState[objectID];
				let displayObject = displayObjects[objectID];
				if (!displayObject) {
					displayObject = onObjectAdded(objectID, object);
				} else {
					// was already present
				}
				// anyway we update the value
				updateObject(displayObject, object);
			}

			// Check for removals
			const displayObjectIDs = Object.keys(displayObjects);
			for (const displayObjectID of displayObjectIDs) {
				if (!processed.has(displayObjectID)) {
					onObjectRemoved(displayObjects[displayObjectID]);
				}
			}
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
