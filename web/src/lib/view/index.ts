import { time } from '$lib/connection';
import { createDirectReadStore } from '$lib/onchain/direct-read';
import type { OnchainState } from '$lib/onchain/types';
import { camera } from '$lib/render/camera';
import { derived, get, writable } from 'svelte/store';
import { localState } from './localState';

export type ViewState = OnchainState;

export const onchainState = createDirectReadStore(camera);

export const viewState = derived(
	[onchainState, localState],
	([$onchainState, $localState]): OnchainState => {
		const onchain_player = $onchainState.player;
		const entities = { ...$onchainState.entities };
		let player = onchain_player;
		if (player && $localState.actions.length > 0) {
			let current_position = player.position;
			for (const action of $localState.actions) {
				if (action.type === 'move') {
					current_position = { x: action.x, y: action.y };
				} else if (action.type == 'placeBomb') {
					const bombID = `${current_position.x},${current_position.y}`;
					entities[bombID] = {
						type: 'bomb',
						id: bombID,
						position: current_position,
						explosion_start: time.now() + 1,
						explosion_end: time.now() + 1
					};
				}
			}
			player = {
				...player,
				position: current_position
			};

			entities[player.id] = player;
		}

		// console.log(player);

		return {
			entities,
			player
		};
	}
);

(globalThis as any).viewState = viewState;
(globalThis as any).get = get;
