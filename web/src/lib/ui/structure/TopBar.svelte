<script lang="ts">
	import { requestFundFromFaucet, time, wallet } from '$lib/connection/index.js';
	import { writes } from '$lib/onchain/writes';
	import ImgBlockie from '$lib/ui/ethereum/ImgBlockie.svelte';

	async function enter() {
		await writes.enter();
	}

	async function faucet() {
		const result = await requestFundFromFaucet();
		console.log(result);
	}
</script>

<nav
	class="fixed left-0 top-0 z-50 flex h-12 w-full items-center justify-between bg-gray-900 px-4 text-white shadow-md"
>
	<div class="flex h-full items-center space-x-2">
		<!-- Logo or App Name -->
		<button onclick={faucet} class="text-lg font-bold">{wallet.address.toAddress()}</button>
		<span>{new Date($time * 1000)}</span>
	</div>
	<div class="relative flex h-full items-center space-x-4">
		<div class="flex h-full items-center space-x-2">
			<button
				class="flex h-8 w-8 items-center justify-center focus:outline-none"
				aria-label="Account menu"
				onclick={enter}
			>
				<ImgBlockie
					address={wallet.address.toAddress()}
					class="h-6 w-6 rounded-full border border-gray-700"
				/>
			</button>
		</div>
	</div>
</nav>
