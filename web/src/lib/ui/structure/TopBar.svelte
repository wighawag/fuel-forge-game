<script lang="ts">
	import { wallet } from '$lib/connection/index.js';
	import { writes } from '$lib/onchain/writes';
	import ImgBlockie from '$lib/ui/ethereum/ImgBlockie.svelte';

	async function onclick() {
		await writes.enter();
	}
</script>

<nav
	class="fixed left-0 top-0 z-50 flex h-12 w-full items-center justify-between bg-gray-900 px-4 text-white shadow-md"
>
	<div class="flex h-full items-center space-x-2">
		<!-- Logo or App Name -->
		<span class="text-lg font-bold">{wallet.address.toAddress()}</span>
	</div>
	<div class="relative flex h-full items-center space-x-4">
		<div class="flex h-full items-center space-x-2">
			<button
				class="flex h-8 w-8 items-center justify-center focus:outline-none"
				aria-label="Account menu"
				{onclick}
			>
				<ImgBlockie
					address={wallet.address.toAddress()}
					class="h-6 w-6 rounded-full border border-gray-700"
				/>
			</button>
		</div>
	</div>
</nav>
