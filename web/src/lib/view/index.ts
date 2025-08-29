import { time, wallet } from '$lib/connection';
import { createDirectReadStore } from '$lib/onchain/direct-read';
import type {
	BaseEntity,
	BombEntity,
	Entity,
	OnchainState,
	PlayerEntity
} from '$lib/onchain/types';
import { camera } from '$lib/render/camera';
import { derived, get, writable } from 'svelte/store';
import { localState } from './localState';

export type Position = { x: number; y: number };

export type PlayerViewEntity = PlayerEntity & {
	path?: Position[];
};
export type ViewEntity = PlayerViewEntity | BombEntity;
export type ViewState = {
	entities: { [id: string]: ViewEntity };
};

export const onchainState = createDirectReadStore(camera);

export const viewState = derived(
	[onchainState, localState],
	([$onchainState, $localState]): ViewState => {
		const playerID = wallet.address.toAddress();
		const onchain_player = $onchainState.entities[playerID] as PlayerEntity | undefined;
		const entities = { ...$onchainState.entities } as { [id: string]: ViewEntity };
		if (onchain_player) {
			let current_position = { ...onchain_player.position };
			const path: Position[] = [];
			if ($localState.actions.length > 0) {
				for (const action of $localState.actions) {
					path.push(current_position);
					if (action.type === 'move') {
						current_position = { x: action.x, y: action.y };
					} else if (action.type == 'placeBomb') {
						// TODO proper BombID
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
			}
			entities[playerID] = {
				...onchain_player,
				position: current_position,
				path
			};

			return {
				entities
			};
		}

		return {
			entities
		};
	}
);

(globalThis as any).viewState = viewState;
(globalThis as any).get = get;
