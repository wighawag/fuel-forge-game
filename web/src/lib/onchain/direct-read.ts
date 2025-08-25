import { get, writable, type Readable } from 'svelte/store';
import type { OnchainState } from './types';
import { gameContract, provider, time } from '$lib/connection';
import { calculateSurroundingZones } from 'fuel-forge-game-onchain';

type Camera = {
	x: number;
	y: number;
	width: number;
	height: number;
};

function defaultState() {
	return {
		time: {
			lastBlockTime: 0,
			value: 0,
			fetchStart: 0,
			fetchReceived: 0
		},
		entities: {}
	};
}

export function createDirectReadStore(camera: Readable<Camera>): Readable<OnchainState> {
	let $state: OnchainState = defaultState();
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

	function convertTaiTime(num: string) {
		return Number(BigInt(num) - BigInt(Math.pow(2, 62)) - BigInt(10));
	}

	async function fetchState(camera: Camera) {
		let timeStruct = $state.time;
		if (timeStruct.lastBlockTime == 0) {
			let fetchStart = performance.now();
			const block = await provider.getBlock('latest');
			let fetchReceived = performance.now();
			const lastBlockTime = Number(convertTaiTime(block!.time));
			// console.log(`block Time : ${new Date(lastBlockTime * 1000)}`);
			timeStruct = {
				lastBlockTime,
				value: lastBlockTime,
				fetchReceived,
				fetchStart
			};
		} else {
			const now = performance.now();
			const fetchPredictedTime = (timeStruct.fetchReceived + timeStruct.fetchStart) / 2;
			const timePassed = (now - fetchPredictedTime) / 1000;
			// console.log(timePassed);
			timeStruct = {
				lastBlockTime: timeStruct.lastBlockTime,
				value: timeStruct.lastBlockTime + timePassed,
				fetchReceived: timeStruct.fetchReceived,
				fetchStart: timeStruct.fetchStart
			};
		}

		const zones = calculateSurroundingZones({
			x: Math.floor(camera.x) + (1 << 30),
			y: Math.floor(camera.y) + (1 << 30)
		});

		const result = await gameContract.functions.get_zones(zones).get();
		if (hasCameraChanged($camera, camera)) {
			return;
		}
		const state: OnchainState = {
			time: timeStruct,
			entities: {}
		};

		// console.log(new Date(state.time.value * 1000));

		for (const entitiesFetched of result.value.zones) {
			for (const entity of entitiesFetched) {
				const player = entity.Player;
				const bomb = entity.Bomb;
				if (player) {
					const id = player.account.Address?.bits || player.account.ContractId!.bits;
					state.entities[id] = {
						id,
						type: 'player',
						position: {
							x: player.position.x.toNumber() - (1 << 30),
							y: player.position.y.toNumber() - (1 << 30)
						},
						life: player.life.toNumber()
					};
				} else if (bomb) {
					const id = `${bomb.position.x},${bomb.position.y}`;
					state.entities[id] = {
						id,
						type: 'bomb',
						position: {
							x: bomb.position.x.toNumber() - (1 << 30),
							y: bomb.position.y.toNumber() - (1 << 30)
						},
						explosion_start: bomb.start.toNumber(),
						explosion_end: bomb.end.toNumber()
					};
				} else {
					console.error(`unknown type`, entity);
				}
			}
		}

		set(state);
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
			set(defaultState());
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
