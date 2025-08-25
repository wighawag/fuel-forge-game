<script lang="ts">
	import TopBar from '$lib/ui/structure/TopBar.svelte';
	import PixiCanvas from '$lib/render/PixiCanvas.svelte';
	import { camera } from '$lib/render/camera';
	import { renderer } from '$lib/render/renderer';

	// TODO:
	import { viewState } from '$lib/view';
</script>

<main>
	<div class="pointer-events-auto">
		<TopBar />
	</div>
</main>

<div class="canvas">
	<PixiCanvas {camera} {renderer} />
</div>

<style>
	main {
		position: absolute;
		z-index: 1;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.canvas {
		pointer-events: none;
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: 100%;
	}
</style>
