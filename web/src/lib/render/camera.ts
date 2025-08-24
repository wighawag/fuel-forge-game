import { writable } from 'svelte/store';

export type Camera = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export const camera = writable<Camera>({
	x: 0,
	y: 0,
	width: 0,
	height: 0
});
