import { gameContract } from '$lib/connection';

export class Writes {
	async enter() {
		const call = await gameContract.functions.enter().call();
		const callResult = await call.waitForResult();
		console.log(callResult);
	}
}

export const writes = new Writes();
