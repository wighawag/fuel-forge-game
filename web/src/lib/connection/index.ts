import { Provider, ScriptTransactionRequest, Wallet, type AccountCoinQuantity } from 'fuels';
import { PUBLIC_FUEL_NODE_URL } from '$env/static/public';
import { TestContract } from 'fuel-forge-game-onchain/generated';
import { writable } from 'svelte/store';

export const provider = new Provider(PUBLIC_FUEL_NODE_URL);

const LOCAL_STORAGE_KEY_PRIVATE_KEY = '__private_key__';
let privateKey = localStorage.getItem(LOCAL_STORAGE_KEY_PRIVATE_KEY);
if (!privateKey) {
	privateKey = Wallet.generate().privateKey;
	localStorage.setItem(LOCAL_STORAGE_KEY_PRIVATE_KEY, privateKey);
}
export const wallet = Wallet.fromPrivateKey(privateKey);
wallet.connect(provider);

export const gameContract = new TestContract(
	'0x9611421031a3193b2a90ab6de35300addd309ac0a1aaf89a66bee1d976983364',
	wallet
);

export async function requestFundFromFaucet() {
	const faucetWallet = Wallet.fromPrivateKey('0x1');
	faucetWallet.connect(provider);

	const request = new ScriptTransactionRequest();

	const baseAssetId = await provider.getBaseAssetId();
	const transferAmount = 1000;

	request.addCoinOutput(wallet.address, transferAmount, baseAssetId);

	const accountCoinQuantities: AccountCoinQuantity[] = [
		{
			amount: transferAmount,
			assetId: baseAssetId, // Asset ID
			account: faucetWallet
		}
	];

	// Assemble the transaction
	const { assembledRequest, gasPrice, receipts } = await provider.assembleTx({
		request,
		accountCoinQuantities,
		feePayerAccount: faucetWallet,
		blockHorizon: 10,
		estimatePredicates: true
	});

	// The assembledRequest is now ready to be signed and sent
	const submit = await faucetWallet.sendTransaction(assembledRequest);
	await submit.waitForResult();
}

function convertTaiTime(num: string) {
	return Number(BigInt(num) - BigInt(Math.pow(2, 62)) - BigInt(10));
}
export function createTime() {
	let last_time = Math.floor(Date.now() / 1000);
	let last_fetch_time = performance.now();
	const time = writable(last_time, start);

	function start() {
		let interval = setInterval(() => {
			const now = performance.now();
			const timePassed = now - last_fetch_time;
			time.set(last_time + timePassed / 1000);
		}, 1000);

		(async () => {
			const before_fetch = performance.now();
			const block = await provider.getBlock('latest');
			const lastBlockTime = Number(convertTaiTime(block!.time));
			const after_fetch = performance.now();
			const predicted_fetch_time = (before_fetch + after_fetch) / 2;
			updateTime(lastBlockTime, predicted_fetch_time);
		})();

		return () => clearInterval(interval);
	}

	function updateTime(newTime: number, fetchTime: number) {
		last_time = newTime;
		last_fetch_time = fetchTime;
		const now = performance.now();
		const timePassed = now - last_fetch_time;
		time.set(last_time + timePassed / 1000);
	}

	function now() {
		const now = performance.now();
		const timePassed = now - last_fetch_time;
		return last_time + timePassed / 1000;
	}

	return {
		now,
		updateTime,
		subscribe: time.subscribe
	};
}

export const time = createTime();
