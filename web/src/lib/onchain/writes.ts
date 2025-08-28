import { gameContract, wallet, provider, time } from '$lib/connection';
import { viewState } from '$lib/view';
import type { FunctionInvocationScope } from 'fuels';
import { get } from 'svelte/store';

function convertTaiTime(num: string) {
	return Number(BigInt(num) - BigInt(Math.pow(2, 62)) - BigInt(10));
}

export class Writes {
	async callFunction<TArgs extends Array<any> = Array<any>, TReturn = any>(
		func: FunctionInvocationScope<TArgs, TReturn>
	) {
		let call;
		try {
			call = await func.call();
		} catch (err) {
			console.error(`ERROR while caling`, err);
			return;
		}
		try {
			const callResult = await call.waitForResult();
			console.log(callResult);
			this.updateTime();
		} catch (err: any) {
			if (err.metadata?.reason === 'OutOfGas') {
				await this.callFunction(func);
			} else {
				console.error(`ERROR while waiting for result`, JSON.stringify(err, null, 2));
			}
		}
	}

	async updateTime() {
		const before_fetch = performance.now();
		const block = await provider.getBlock('latest');
		const lastBlockTime = Number(convertTaiTime(block!.time));
		time.updateTime(lastBlockTime, before_fetch);
	}

	async enter() {
		await this.callFunction(gameContract.functions.enter());
	}

	counter = 0;
	async move(offset: { x: number; y: number }) {
		this.counter++;
		const { value: position } = await gameContract.functions
			.position({ Address: { bits: wallet.address.toAddress() } })
			.get();
		if (!position) {
			throw new Error(`not in it`);
		}
		position.y = position.y.add(offset.y);
		position.x = position.x.add(offset.x);

		await this.callFunction(gameContract.functions.move(position, this.counter));
	}

	async moveUp() {
		await this.move({ x: 0, y: -1 });
	}

	async moveDown() {
		await this.move({ x: 0, y: 1 });
	}

	async moveLeft() {
		await this.move({ x: -1, y: 0 });
	}

	async moveRight() {
		await this.move({ x: 1, y: 0 });
	}

	async placeBomb() {
		await this.callFunction(gameContract.functions.place_bomb());
	}
}

export const writes = new Writes();
