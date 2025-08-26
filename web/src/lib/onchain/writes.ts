import { gameContract, wallet, provider, time } from '$lib/connection';

function convertTaiTime(num: string) {
	return Number(BigInt(num) - BigInt(Math.pow(2, 62)) - BigInt(10));
}

export class Writes {
	async updateTime() {
		const before_fetch = performance.now();
		const block = await provider.getBlock('latest');
		const lastBlockTime = Number(convertTaiTime(block!.time));
		time.updateTime(lastBlockTime, before_fetch);
	}

	async enter() {
		const call = await gameContract.functions.enter().call();
		const callResult = await call.waitForResult();
		console.log(callResult);
		this.updateTime();
	}

	counter = 0;
	async moveUp() {
		this.counter++;
		const { value: position } = await gameContract.functions
			.position({ Address: { bits: wallet.address.toAddress() } })
			.get();
		if (!position) {
			throw new Error(`not in it`);
		}
		position.y = position.y.sub(1);
		const call = await gameContract.functions.move(position, this.counter).call();
		await call.waitForResult();
		this.updateTime();
	}

	async moveDown() {
		this.counter++;
		const { value: position } = await gameContract.functions
			.position({ Address: { bits: wallet.address.toAddress() } })
			.get();
		if (!position) {
			throw new Error(`not in it`);
		}
		position.y = position.y.add(1);
		const call = await gameContract.functions.move(position, this.counter).call();
		await call.waitForResult();
		this.updateTime();
	}

	async moveLeft() {
		this.counter++;
		const { value: position } = await gameContract.functions
			.position({ Address: { bits: wallet.address.toAddress() } })
			.get();
		if (!position) {
			throw new Error(`not in it`);
		}
		position.x = position.x.sub(1);
		const call = await gameContract.functions.move(position, this.counter).call();
		await call.waitForResult();
		this.updateTime();
	}

	async moveRight() {
		this.counter++;
		const { value: position } = await gameContract.functions
			.position({ Address: { bits: wallet.address.toAddress() } })
			.get();
		if (!position) {
			throw new Error(`not in it`);
		}
		position.x = position.x.add(1);
		const call = await gameContract.functions.move(position, this.counter).call();
		await call.waitForResult();
		this.updateTime();
	}

	async placeBomb() {
		const call = await gameContract.functions.place_bomb().call();
		const callResult = await call.waitForResult();
		console.log(callResult);
		this.updateTime();
	}
}

export const writes = new Writes();
