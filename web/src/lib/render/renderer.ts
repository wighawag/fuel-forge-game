import type { Entity, OnchainState } from '$lib/onchain/types';
import { Blockie } from '$lib/utils/ethereum/blockie';
import { viewState } from '$lib/view';
import { BitmapText, Container, Graphics, Sprite } from 'pixi.js';
import type { Readable } from 'svelte/store';
import { LoadingSprite } from './LoadingSprite';
import { localComputer, time, wallet } from '$lib/connection';
import { LoadingBitmapText } from './LoadingBtimapText';

export function createRenderer(viewState: Readable<OnchainState>) {
	let displayObjects: { [id: string]: Container } = {};
	let unsubscribe: (() => void) | undefined = undefined;

	function onAppStarted(container: Container) {
		unsubscribe = viewState.subscribe(($viewState) => {
			const epochInfo = localComputer.calculateEpochInfo(time.now());
			const { currentEpoch: epoch } = epochInfo;
			const processed = new Set();

			function onEntityAdded(id: string, entity: Entity): Container {
				const displayObject = new Container();
				if (entity.type == 'player') {
					const sprite = new LoadingSprite(Blockie.getURI(entity.id));
					// const graphics = new Graphics().rect(0, 0, 10, 10).fill(0xff0000);
					// displayObject.addChild(graphics);
					displayObject.addChild(sprite);
					sprite.x = 2;
					sprite.y = 2;
					sprite.scale = 6 / 8;

					{
						const graphics = new Graphics()
							.rect(0, 0, 10, 10)
							.stroke({ width: 1, color: 0x00ff00 });
						displayObject.addChild(graphics);
						graphics.visible = false;
					}
					{
						const graphics = new Graphics()
							.rect(0, 0, 10, 10)
							.stroke({ width: 1, color: 0xff0000 });
						displayObject.addChild(graphics);
						graphics.visible = false;
					}

					{
						const graphics = new Graphics()
							.moveTo(0, 0)
							.lineTo(10, 10)
							.moveTo(0, 10)
							.lineTo(10, 0)
							.stroke({ width: 1, color: 0xff0000 });
						displayObject.addChild(graphics);
						graphics.visible = false;
					}
				} else if (entity.type == 'bomb') {
					{
						const graphics = new Graphics().rect(0, 0, 10, 10).fill(0x00ff00);
						displayObject.addChild(graphics);
					}

					{
						const graphics = new Graphics().rect(0, -40, 10, 90).fill(0xff0000);
						displayObject.addChild(graphics);
						graphics.visible = false;
					}
					{
						const graphics = new Graphics().rect(-40, 0, 90, 10).fill(0xff0000);
						displayObject.addChild(graphics);
						graphics.visible = false;
					}
					{
						const text = new LoadingBitmapText({
							text: '',
							style: {
								fontURL: 'https://pixijs.com/assets/bitmap-font/desyrel.xml',
								fontFamily: 'Desyrel',
								fontSize: 8,
								fill: 'black'
							}
						});
						text.x = 3;
						text.y = -3;
						displayObject.addChild(text);
						text.visible = false;
					}
				} else {
					console.error(`no render for entity type : ${(entity as any).type}`);
				}

				updateEntity(id, displayObject, entity);

				container.addChild(displayObject);
				displayObjects[id] = displayObject;
				return displayObject;
			}

			function onEntityRemoved(id: string, displayObject: Container) {
				// TODO removal type ?
				container.removeChild(displayObject);
			}

			function updateEntity(id: string, displayObject: Container, entity: Entity) {
				// TODO we could tween
				displayObject.x = 10 * entity.position.x;
				displayObject.y = 10 * entity.position.y;

				if (entity.type === 'player') {
					if (entity.epoch > epoch) {
						displayObject.alpha = 0.2;
					} else {
						displayObject.alpha = 1;
					}
					if (entity.life == 0) {
						displayObject.children[3].visible = true;
					} else {
						displayObject.children[3].visible = false;
					}

					if (id == wallet.address.toAddress()) {
						if (entity.epoch > time.now() - 0.9) {
							displayObject.children[1].visible = false;
							displayObject.children[2].visible = true;
						} else {
							displayObject.children[1].visible = true;
							displayObject.children[2].visible = false;
						}
					}
				} else if (entity.type === 'bomb') {
					if (entity.explosion_end < epoch) {
						displayObject.visible = false;
					} else {
						const epochLeft = Math.floor(entity.explosion_start - epoch);
						let t = '' + epochLeft;
						if (epochLeft <= 0) {
							t = '-';
						}
						// console.log({ secondsLeft });
						if (epochLeft >= 0) {
							displayObject.children[3].visible = true;
							(displayObject.children[3] as BitmapText).text = t;
						} else {
							displayObject.children[3].visible = false;
						}

						if (entity.explosion_start < epochLeft) {
							displayObject.children[1].visible = true;
							displayObject.children[2].visible = true;
						}
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
				updateEntity(entityID, displayObject, entity);
			}

			// Check for removals
			const displayObjectIDs = Object.keys(displayObjects);
			for (const displayObjectID of displayObjectIDs) {
				if (!processed.has(displayObjectID)) {
					onEntityRemoved(displayObjectID, displayObjects[displayObjectID]);
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
