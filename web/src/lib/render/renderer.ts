import type { Entity, OnchainState } from '$lib/onchain/types';
import { Blockie } from '$lib/utils/ethereum/blockie';
import { viewState } from '$lib/view';
import { Container, Graphics, Sprite } from 'pixi.js';
import type { Readable } from 'svelte/store';
import { LoadingSprite } from './LoadingSprite';

export function createRenderer(viewState: Readable<OnchainState>) {
	let displayObjects: { [id: string]: Container } = {};
	let unsubscribe: (() => void) | undefined = undefined;

	function onAppStarted(container: Container) {
		function onEntityAdded(id: string, entity: Entity): Container {
			const displayObject = new Container();
			if (entity.type == 'player') {
				const sprite = new LoadingSprite(Blockie.getURI(entity.id));
				// const graphics = new Graphics().rect(0, 0, 10, 10).fill(0xff0000);
				// displayObject.addChild(graphics);
				displayObject.addChild(sprite);
				displayObject.scale = 10 / 8;
			} else if (entity.type == 'bomb') {
				const graphics = new Graphics().rect(0, 0, 10, 10).fill(0xff0000);
				displayObject.addChild(graphics);
			} else {
				console.error(`no render for entity type : ${entity.type}`);
			}

			container.addChild(displayObject);
			displayObjects[id] = displayObject;
			return displayObject;
		}

		function onEntityRemoved(displayObject: Container) {
			// TODO removal type ?
			container.removeChild(displayObject);
		}

		function updateEntity(displayObject: Container, entity: Entity) {
			// TODO we could tween
			displayObject.x = 10 * entity.position.x;
			displayObject.y = 10 * entity.position.y;
		}

		unsubscribe = viewState.subscribe(($viewState) => {
			const processed = new Set();

			const entityIDs = Object.keys($viewState);
			for (const entityID of entityIDs) {
				processed.add(entityID);

				const object = $viewState[entityID];
				let displayObject = displayObjects[entityID];
				if (!displayObject) {
					displayObject = onEntityAdded(entityID, object);
				} else {
					// was already present
				}
				// anyway we update the value
				updateEntity(displayObject, object);
			}

			// Check for removals
			const displayObjectIDs = Object.keys(displayObjects);
			for (const displayObjectID of displayObjectIDs) {
				if (!processed.has(displayObjectID)) {
					onEntityRemoved(displayObjects[displayObjectID]);
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
