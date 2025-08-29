import { Provider, ScriptTransactionRequest, Wallet, type AccountCoinQuantity } from 'fuels';
import { PUBLIC_FUEL_NODE_URL, PUBLIC_FAUCET_PRIVATE_KEY } from '$env/static/public';
import { TestContract } from 'fuel-forge-game-onchain/generated';
import { derived, writable } from 'svelte/store';

let url = PUBLIC_FUEL_NODE_URL;
let contractAddress = '0x8e353b89a7a44cf2046ec446fe04243a7dde8befadecec5c81a842e8b177a51f';

const useTestnet =
	PUBLIC_FUEL_NODE_URL.indexOf('quiknode') != -1 ||
	PUBLIC_FUEL_NODE_URL.indexOf('simplystaking') != -1;
if (useTestnet) {
	contractAddress = '0xc8014d0f7ca6fe57accb2e1ef13642b66cc9f9bda20ee60e434996d25b3bb081';
}

export const provider = new Provider(url);

const new_privateKey = Wallet.generate();
console.log({
	address: new_privateKey.address.toAddress(),
	privateKey: new_privateKey.privateKey
});

const LOCAL_STORAGE_KEY_PRIVATE_KEY = '__private_key__';
let privateKey = localStorage.getItem(LOCAL_STORAGE_KEY_PRIVATE_KEY);
if (!privateKey) {
	privateKey = Wallet.generate().privateKey;
	localStorage.setItem(LOCAL_STORAGE_KEY_PRIVATE_KEY, privateKey);
}
export const wallet = Wallet.fromPrivateKey(privateKey);
wallet.connect(provider);

export const gameContract = new TestContract(contractAddress, wallet);

export async function requestFundFromFaucet() {
	const faucetWallet = Wallet.fromPrivateKey(PUBLIC_FAUCET_PRIVATE_KEY);
	faucetWallet.connect(provider);

	const request = new ScriptTransactionRequest();

	const baseAssetId = await provider.getBaseAssetId();
	const transferAmount = 100_000;

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

	const before_fetch = performance.now();
	const block = await provider.getBlock('latest');
	const lastBlockTime = Number(convertTaiTime(block!.time));
	time.updateTime(lastBlockTime, before_fetch);
}

function convertTaiTime(num: string) {
	return Number(BigInt(num) - BigInt(Math.pow(2, 62)) - BigInt(10));
}

export type SyncedTime = {
	lastSync?: number;
	value: number;
};

export function createTime() {
	let last_time = Math.floor(Date.now() / 1000);
	let last_fetch_time = performance.now();
	const time = writable<SyncedTime>({ value: last_time }, start);

	function start() {
		let interval = setInterval(() => {
			const now = performance.now();
			const timePassed = now - last_fetch_time;
			time.set({ value: last_time + timePassed / 1000, lastSync: now });
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
		time.set({ value: last_time + timePassed / 1000, lastSync: now });
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

export function createLocalComputer(config: {
	COMMIT_PHASE_DURATION: number;
	REVEAL_PHASE_DURATION: number;
	START_TIME?: number;
}) {
	function calculateEpochInfo(currentTime: number) {
		const COMMIT_PHASE_DURATION = config.COMMIT_PHASE_DURATION;
		const REVEAL_PHASE_DURATION = config.REVEAL_PHASE_DURATION;
		const EPOCH_DURATION = COMMIT_PHASE_DURATION + REVEAL_PHASE_DURATION;
		const START_TIME = config.START_TIME || 0;

		const timePassed = currentTime - START_TIME;

		// Calculate current epoch (minimum epoch is 2 as per contract logic)
		const currentEpoch = Math.floor(timePassed / EPOCH_DURATION) + 2;

		// Calculate time within current epoch cycle
		const timeInCurrentEpochCycle = timePassed - (currentEpoch - 2) * EPOCH_DURATION;

		// Calculate time left in current epoch
		const timeLeftInEpoch = EPOCH_DURATION - timeInCurrentEpochCycle;

		// Determine if we're in commit phase or reveal phase
		const isCommitPhase = timeInCurrentEpochCycle < COMMIT_PHASE_DURATION;

		// Calculate time left for commit phase end (when commit phase will end)
		const timeLeftForCommitEnd = isCommitPhase
			? COMMIT_PHASE_DURATION - timeInCurrentEpochCycle
			: 0; // If we're in reveal phase, commit phase has already ended

		// Calculate time left for reveal phase end (when reveal phase will end, i.e., epoch end)
		const timeLeftForRevealEnd = timeLeftInEpoch;

		return {
			currentEpoch,
			timeLeftInEpoch,
			timeInCurrentEpochCycle,
			isCommitPhase,
			timeLeftInPhase: isCommitPhase
				? COMMIT_PHASE_DURATION - timeInCurrentEpochCycle
				: REVEAL_PHASE_DURATION - (timeInCurrentEpochCycle - COMMIT_PHASE_DURATION),
			timeLeftForCommitEnd,
			timeLeftForRevealEnd
		};
	}

	return {
		calculateEpochInfo
	};
}

export const localComputer = createLocalComputer({
	// TODO get it from Contract Data
	COMMIT_PHASE_DURATION: 20,
	REVEAL_PHASE_DURATION: 10,
	START_TIME: 0
});

export const epochInfo = derived(time, (t) => localComputer.calculateEpochInfo(t.value));

(globalThis as any).epochInfo = epochInfo;
(globalThis as any).time = time;
