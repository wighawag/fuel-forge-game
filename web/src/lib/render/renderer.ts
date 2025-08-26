import type { Entity, OnchainState } from '$lib/onchain/types';
import { Blockie } from '$lib/utils/ethereum/blockie';
import { viewState } from '$lib/view';
import { Container, Graphics, Sprite } from 'pixi.js';
import type { Readable } from 'svelte/store';
import { LoadingSprite } from './LoadingSprite';
import { time } from '$lib/connection';

export function createRenderer(viewState: Readable<OnchainState>) {
	let displayObjects: { [id: string]: Container } = {};
	let unsubscribe: (() => void) | undefined = undefined;

	function onAppStarted(container: Container) {
		unsubscribe = viewState.subscribe(($viewState) => {
			const now = time.now();
			// console.log(`now: ${new Date(now * 1000)} / ${new Date($viewState.time.value * 1000)}`);
			const processed = new Set();

			function onEntityAdded(id: string, entity: Entity): Container {
				const displayObject = new Container();
				if (entity.type == 'player') {
					const sprite = new LoadingSprite(Blockie.getURI(entity.id));
					// const graphics = new Graphics().rect(0, 0, 10, 10).fill(0xff0000);
					// displayObject.addChild(graphics);
					displayObject.addChild(sprite);
					displayObject.scale = 10 / 8;
				} else if (entity.type == 'bomb') {
					const graphics = new Graphics().rect(0, 0, 10, 10).fill(0x00ff00);
					displayObject.addChild(graphics);
				} else {
					console.error(`no render for entity type : ${(entity as any).type}`);
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

				if (entity.type === 'player') {
					if (entity.life == 0) {
						displayObject.alpha = 0.1;
					}
				} else if (entity.type === 'bomb') {
					if (entity.explosion_start < now) {
						if (displayObject.children.length == 1) {
							{
								const graphics = new Graphics().rect(0, -40, 10, 90).fill(0xff0000);
								displayObject.addChild(graphics);
							}
							{
								const graphics = new Graphics().rect(-40, 0, 90, 10).fill(0xff0000);
								displayObject.addChild(graphics);
							}
						}
					}

					if (entity.explosion_end < now) {
						//$viewState.time.value
						displayObject.visible = false;
					} else {
						// console.log(
						// 	`now: ${new Date(now * 1000)}  /${new Date($viewState.time.value * 1000)}`,
						// 	`bomb: ${new Date(entity.explosion_end * 1000)}`
						// );
					}
				}
			}

			const entityIDs = Object.keys($viewState.entities);
			for (const entityID of entityIDs) {
				processed.add(entityID);

				const entity = $viewState.entities[entityID];
				let displayObject = displayObjects[entityID];
				if (!displayObject) {
					displayObject = onEntityAdded(entityID, entity);
				} else {
					// was already present
				}
				// anyway we update the value
				updateEntity(displayObject, entity);
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
