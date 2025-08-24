import { Provider, Wallet } from 'fuels';
import { PUBLIC_FUEL_NODE_URL } from '$env/static/public';

export const provider = new Provider(PUBLIC_FUEL_NODE_URL);

const LOCAL_STORAGE_KEY_PRIVATE_KEY = '__private_key__';
let privateKey = localStorage.getItem(LOCAL_STORAGE_KEY_PRIVATE_KEY);
if (!privateKey) {
	privateKey = Wallet.generate().privateKey;
	localStorage.setItem(LOCAL_STORAGE_KEY_PRIVATE_KEY, privateKey);
}
export const wallet = Wallet.fromPrivateKey(privateKey);
