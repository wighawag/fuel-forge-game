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
		const result = await gameContract.functions.entities_in_zones(zones).get();
		if (hasCameraChanged($camera, camera)) {
			return;
		}
		const entities: OnchainState = {};

		for (const entitiesFetched of result.value) {
			for (const entity of entitiesFetched) {
				const player = entity.Player;
				const bomb = entity.Bomb;
				if (player) {
					const id = player.account.Address?.bits || player.account.ContractId!.bits;
					entities[id] = {
						id,
						type: 'player',
						position: {
							x: player.position.x.toNumber() - (1 << 30),
							y: player.position.y.toNumber() - (1 << 30)
						}
					};
				} else if (bomb) {
					const id = `${bomb.position.x},${bomb.position.y}`;
					entities[id] = {
						id,
						type: 'bomb',
						position: {
							x: bomb.position.x.toNumber() - (1 << 30),
							y: bomb.position.y.toNumber() - (1 << 30)
						}
					};
				} else {
					console.error(`unknown type`, entity);
				}
			}
		}

		set(entities);
	}

	let unsubscribeFromCamera: (() => void) | undefined;
	let interval: NodeJS.Timeout | undefined;
	function start() {
		unsubscribeFromCamera = camera.subscribe((camera) => {
			const cameraChanged = hasCameraChanged($camera, camera);
			$camera = { ...camera };
			if (cameraChanged) {
				fetchState($camera);
			}
		});

		interval = setInterval(() => {
			fetchState($camera);
		}, 100);

		return stop;
	}

	function stop() {
		if (unsubscribeFromCamera) {
			// TODO set as IDle ?
			set({});
			unsubscribeFromCamera();
			unsubscribeFromCamera = undefined;
		}
		if (interval) {
			clearInterval(interval);
		}
	}

	return {
		subscribe: _store.subscribe
	};
}
