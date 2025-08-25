import { gameContract, wallet } from '$lib/connection';

export class Writes {
	async enter() {
		const call = await gameContract.functions.enter().call();
		const callResult = await call.waitForResult();
		console.log(callResult);
	}

	async moveUp() {
		const { value: position } = await gameContract.functions
			.position({ Address: { bits: wallet.address.toAddress() } })
			.get();
		if (!position) {
			throw new Error(`not in it`);
		}
		position.y = position.y.sub(1);
		const call = await gameContract.functions.move(position).call();
		await call.waitForResult();
	}

	async moveDown() {
		const { value: position } = await gameContract.functions
			.position({ Address: { bits: wallet.address.toAddress() } })
			.get();
		if (!position) {
			throw new Error(`not in it`);
		}
		position.y = position.y.add(1);
		const call = await gameContract.functions.move(position).call();
		await call.waitForResult();
	}

	async moveLeft() {
		const { value: position } = await gameContract.functions
			.position({ Address: { bits: wallet.address.toAddress() } })
			.get();
		if (!position) {
			throw new Error(`not in it`);
		}
		position.x = position.x.sub(1);
		const call = await gameContract.functions.move(position).call();
		await call.waitForResult();
	}

	async moveRight() {
		const { value: position } = await gameContract.functions
			.position({ Address: { bits: wallet.address.toAddress() } })
			.get();
		if (!position) {
			throw new Error(`not in it`);
		}
		position.x = position.x.add(1);
		const call = await gameContract.functions.move(position).call();
		await call.waitForResult();
	}
}

export const writes = new Writes();
