import { Provider, Wallet } from 'fuels';
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
	'0x837dcf5e4f69c77b7adc673d5fc505c8420d325af43a2782013e81e3d5376017',
	wallet
);
