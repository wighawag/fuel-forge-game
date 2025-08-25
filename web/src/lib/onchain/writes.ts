import { gameContract, wallet } from '$lib/connection';

export class Writes {
	async enter() {
		const call = await gameContract.functions.enter().call();
		const callResult = await call.waitForResult();
		console.log(callResult);
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
	}

	async placeBomb() {
		const call = await gameContract.functions.place_bomb().call();
		const callResult = await call.waitForResult();
		console.log(callResult);
	}
}

export const writes = new Writes();
