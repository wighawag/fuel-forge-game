import { get, writable } from 'svelte/store';
import { onchainState } from '.';
import { createAutoSubmitter } from '$lib/onchain/auto-submit';

export type LocalAction = { type: 'move'; x: number; y: number } | { type: 'placeBomb' };
export type LocalState = {
	actions: LocalAction[];
	submission?: {
		commit: {
			hash: string;
			secret: string;
			epoch: number;
			txHash: string;
		};
		reveal?: {
			epoch: number;
			txHash: string;
		};
	};
};

const $state: LocalState = {
	actions: []
};
const _localState = writable<LocalState>($state);
export const localState = {
	get value() {
		return $state;
	},
	subscribe: _localState.subscribe,
	move(x: number, y: number) {
		const player = get(onchainState).player;

		if (!player) {
			throw new Error(`no player`);
		}
		let currentPosition = player.position;
		if ($state.actions.length > 0) {
			for (const action of $state.actions) {
				if (action.type === 'move') {
					currentPosition = { x: action.x, y: action.y };
				}
			}
		}

		$state.actions.push({
			type: 'move',
			x: currentPosition.x + x,
			y: currentPosition.y + y
		});
		_localState.set($state);
	},
	placeBomb() {
		const player = get(onchainState).player;

		if (!player) {
			throw new Error(`no player`);
		}
		let currentPosition = player.position;
		if ($state.actions.length > 0) {
			for (const action of $state.actions) {
				if (action.type === 'move') {
					currentPosition = { x: action.x, y: action.y };
				}
			}
		}

		$state.actions.push({
			type: 'placeBomb'
		});
		_localState.set($state);
	},

	async commit() {},

	async reveal() {}
};

export const autoSubmitter = createAutoSubmitter();
autoSubmitter.start();
