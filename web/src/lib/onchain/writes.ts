import { gameContract, wallet, provider, time } from '$lib/connection';
import type { LocalAction } from '$lib/view/localState';
import { Hasher } from 'fuel-ts-hasher';
import type { FunctionInvocationScope } from 'fuels';

function convertTaiTime(num: string) {
	return Number(BigInt(num) - BigInt(Math.pow(2, 62)) - BigInt(10));
}

export type TransactionExecution = { transactionID: string; wait(): Promise<void> };

const ENUM_CONTEXT = {
	ActionInput: ['Move', 'PlaceBomb']
};

async function createTransactionExecution<TArgs extends Array<any> = Array<any>, TReturn = any>(
	func: FunctionInvocationScope<TArgs, TReturn>,
	afterCallResult?: () => void
): Promise<TransactionExecution> {
	const call = await func.call();

	return {
		transactionID: call.transactionId,
		async wait() {
			const callResult = await call.waitForResult();
			console.log(callResult);
		}
	};
}

function fromActionsToActionsInput(actions: LocalAction[]) {
	return actions.map((v) => {
		if (v.type === 'move') {
			return {
				Move: { x: v.x + (1 << 30), y: v.y + (1 << 30) }
			};
		} else {
			return {
				PlaceBomb: undefined
			};
		}
	});
}

export class Writes {
	async callFunction<TArgs extends Array<any> = Array<any>, TReturn = any>(
		func: FunctionInvocationScope<TArgs, TReturn>
	) {
		return createTransactionExecution(func, () => {
			this.updateTime();
		});
	}

	async updateTime() {
		const before_fetch = performance.now();
		const block = await provider.getBlock('latest');
		const lastBlockTime = Number(convertTaiTime(block!.time));
		time.updateTime(lastBlockTime, before_fetch);
	}

	enter() {
		return this.callFunction(gameContract.functions.enter());
	}

	async commit_actions(secret: string, actions: LocalAction[]) {
		const actionsInput = fromActionsToActionsInput(actions);
		const hasher = new Hasher(ENUM_CONTEXT);
		const hash = hasher.update(actionsInput).update(secret).finalize();
		const call = await gameContract.functions.commit_actions(hash).call();

		const self = this;
		return {
			transactionID: call.transactionId,
			async wait() {
				const callResult = await call.waitForResult();
				console.log(callResult);
				self.updateTime();
			}
		};
	}

	reveal_actions(account: string, secret: string, actions: LocalAction[]) {
		const actionsInput = fromActionsToActionsInput(actions);
		return this.callFunction(
			gameContract.functions.reveal_actions({ Address: { bits: account } }, secret, actionsInput)
		);
	}
}

export const writes = new Writes();
