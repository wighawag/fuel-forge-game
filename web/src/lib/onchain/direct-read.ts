import { get, writable, type Readable } from 'svelte/store';
import type { OnchainState } from './types';
import { gameContract } from '$lib/connection';
import { calculateSurroundingZones } from 'fuel-forge-game-onchain';

type Camera = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export function createDirectReadStore(camera: Readable<Camera>): Readable<OnchainState> {
	let $state: OnchainState = {};
	let $camera: Camera = get(camera);

	const _store = writable<OnchainState>($state, start);
	function set(state: OnchainState) {
		$state = state;
		_store.set($state);
		return $state;
	}

	function hasCameraChanged(oldCamera: Camera, newCamera: Camera) {
		return (
			oldCamera.x !== newCamera.x ||
			oldCamera.y !== newCamera.y ||
			oldCamera.width !== newCamera.width ||
			oldCamera.height !== newCamera.height
		);
	}

	async function fetchState(camera: Camera) {
		const zones = calculateSurroundingZones({
			x: Math.floor(camera.x) + (1 << 30),
			y: Math.floor(camera.y) + (1 << 30)
		});
		const result = await gameContract.functions.players_in_zones(zones).get();
		if (hasCameraChanged($camera, camera)) {
			return;
		}
		const characters: OnchainState = {};

		for (const players of result.value) {
			for (const player of players) {
				const id = player.account.Address?.bits || player.account.ContractId!.bits;
				characters[id] = {
					id,
					position: {
						x: player.position.x.toNumber() - (1 << 30),
						y: player.position.y.toNumber() - (1 << 30)
					}
				};
			}
		}

		set(characters);
	}

	let unsubscribeFromCamera: (() => void) | undefined;
	function start() {
		unsubscribeFromCamera = camera.subscribe((camera) => {
			const cameraChanged = hasCameraChanged($camera, camera);
			$camera = { ...camera };
			if (cameraChanged) {
				fetchState($camera);
			}
		});

		return stop;
	}

	function stop() {
		if (unsubscribeFromCamera) {
			// TODO set as IDle ?
			set({});
			unsubscribeFromCamera();
			unsubscribeFromCamera = undefined;
		}
	}

	return {
		subscribe: _store.subscribe
	};
}
