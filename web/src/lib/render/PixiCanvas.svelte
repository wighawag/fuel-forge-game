<script lang="ts">
	import { Viewport } from 'pixi-viewport';
	import { Application, Graphics } from 'pixi.js';
	import { initDevtools } from '@pixi/devtools';
	import { onMount } from 'svelte';
	import { get, type Writable } from 'svelte/store';
	import type { Camera } from './camera';
	import { viewState } from '$lib/view';

	interface Props {
		camera: Writable<Camera>;
	}
	let { camera }: Props = $props();

	function buildGrid(graphics: Graphics, witdh: number, height: number, cellSize: number) {
		const numRows = Math.floor(height / cellSize) + 1;
		const numCols = Math.floor(witdh / cellSize) + 1;
		for (let i = 0; i < numCols; i++) {
			graphics.moveTo(i * cellSize, 0).lineTo(i * cellSize, height);
		}

		for (let i = 0; i < numRows; i++) {
			graphics.moveTo(0, i * cellSize).lineTo(witdh, i * cellSize);
		}

		return graphics;
	}

	let canvas: HTMLCanvasElement;
	let viewport: Viewport;
	onMount(() => {
		function resizeViewport() {
			viewport && viewport.resize();
		}
		const sizeObserver = new ResizeObserver(resizeViewport);
		sizeObserver.observe(canvas);
		console.log(`Mounting PixiCanvas......`);
		const app = new Application();
		initDevtools({ app });

		let initialised = false;
		const appInitialising = app.init({
			resizeTo: canvas,
			canvas,
			backgroundAlpha: 1,
			backgroundColor: 'black'
		});
		appInitialising.then(() => {
			initialised = true;
			// create viewport
			viewport = new Viewport({
				events: app.renderer.events, // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
				allowPreserveDragOutside: true
			});
			viewport.moveCenter(0, 0);

			// add the viewport to the stage
			app.stage.addChild(viewport);

			const cellSize = 10;

			const minWidth = 5 * cellSize;
			const minHeight = 5 * cellSize;
			const maxWidth = 50 * cellSize;
			const maxHeight = 50 * cellSize;

			// activate plugins
			viewport.drag().pinch().wheel().clampZoom({
				maxWidth,
				maxHeight,
				minHeight,
				minWidth
			});

			viewport.fit(true, 7 * cellSize, 7 * cellSize);

			const gridSize = Math.max(maxWidth, maxHeight) + 2 * cellSize;

			const gridPixel = buildGrid(new Graphics(), gridSize, gridSize, cellSize).stroke({
				color: 0xffffff,
				pixelLine: true,
				width: 1
			});
			viewport.moveCenter(0, 0);

			viewport.addChild(gridPixel);

			// TODO + update
			// need to keep track of what need to be ADDED and REMOVED
			// ADDED is easy as we can have a dict (characterID => DisplayObject)
			// REMOVED required to get the list of characterId that was previouly added and a dict of characterID from state
			const characters = get(viewState);
			const charactersDisplayObjects = {};
			for (const key of Object.keys(characters)) {
				const charactersDisplayObject = {}; // TODO
			}

			// Listen for animate update
			app.ticker.add((time) => {
				// Just for fun, let's rotate mr rabbit a little.
				// * Delta is 1 if running at 100% performance *
				// * Creates frame-independent transformation *
				// bunny.rotation += 0.1 * time.deltaTime;

				// Apply modulo to create an infinite scrolling grid that follows viewport
				// Get the current viewport position
				const viewportX = viewport.x;
				const viewportY = viewport.y;
				const scale = viewport.scaled;

				const offsetX = viewportX / scale;
				const offsetY = viewportY / scale;

				camera.set({
					x: viewport.center.x / cellSize,
					y: viewport.center.y / cellSize,
					width: viewport.worldScreenWidth / cellSize,
					height: viewport.worldScreenHeight / cellSize
				});

				// Get triangle grid spacing information
				const gridInfo = (gridPixel as any).triangleGridInfo;

				if (gridInfo) {
					// Get grid orientation and spacing
					const orientation = gridInfo.orientation;
					const spacing = gridInfo.spacing;
					const edgeSize = gridInfo.edgeSize;

					// Calculate the period of the pattern (2 triangles make a rhombus)
					const periodX = orientation === 'vertical' ? edgeSize * 2 : spacing * 2;
					const periodY = orientation === 'vertical' ? spacing * 2 : edgeSize * 2;

					// Calculate the repeating offset
					// We use two periods to ensure smooth wrapping and avoid floating point issues
					let gridOffsetX = offsetX % periodX;
					let gridOffsetY = offsetY % periodY;

					// Ensure positive offsets (avoid negative modulo issues)
					if (gridOffsetX < 0) gridOffsetX += periodX;
					if (gridOffsetY < 0) gridOffsetY += periodY;

					// Position grid with calculated offset
					gridPixel.x = -offsetX + gridOffsetX - periodX;
					gridPixel.y = -offsetY + gridOffsetY - periodY;
				} else {
					// Fallback for regular grid
					gridPixel.x = -offsetX - cellSize + (offsetX % cellSize);
					gridPixel.y = -offsetY - cellSize + (offsetY % cellSize);
				}

				gridPixel.alpha = viewport.scaled / 48;
			});
		});

		return () => {
			sizeObserver.disconnect();
			console.log(`Unmounting PixiCanvas...`);
			if (initialised) {
				console.log(`destroying Pixi Application...`);
				app.destroy();
			} else {
				console.log(`unmounting while app was not initialised, waiting for it...`);
				appInitialising.then(() => {
					console.log(`destroying Pixi Application...`);
					app.destroy();
				});
			}
		};
	});
</script>

<canvas bind:this={canvas}></canvas>

<style>
	canvas {
		background-color: black;
		position: absolute;
		width: 100%;
		height: 100%;
		pointer-events: auto;
	}
</style>
