import { Provider, ScriptTransactionRequest, Wallet, type AccountCoinQuantity } from 'fuels';
import { PUBLIC_FUEL_NODE_URL } from '$env/static/public';
import { TestContract } from 'fuel-forge-game-onchain/generated';

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
	'0x3db74ed73dbde6b9f87c15fb618725baa7d79fb95f3794c42a03219575db09d0',
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
