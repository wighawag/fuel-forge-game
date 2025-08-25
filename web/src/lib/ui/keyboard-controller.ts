import { writes } from '$lib/onchain/writes';

interface KeyboardController {
	start: () => void;
	stop: () => void;
}

export function createKeyboardController(): KeyboardController {
	// Store the event handler as a property so we can remove it later

	async function onUp() {
		await writes.moveUp();
	}
	async function onDown() {
		await writes.moveDown();
	}
	async function onLeft() {
		await writes.moveLeft();
	}
	async function onRight() {
		await writes.moveRight();
	}

	async function onSpace() {
		await writes.placeBomb();
	}

	function keydownHandler(event: KeyboardEvent) {
		switch (event.key) {
			// Arrow keys
			case 'ArrowUp':
				onUp();
				break;
			case 'ArrowDown':
				onDown();
				break;
			case 'ArrowLeft':
				onLeft();
				break;
			case 'ArrowRight':
				onRight();
				break;

			// WASD keys
			case 'w':
			case 'W':
				onUp();
				break;
			case 's':
			case 'S':
				onDown();
				break;
			case 'a':
			case 'A':
				onLeft();
				break;
			case 'd':
			case 'D':
				onRight();
				break;

			case ' ':
				onSpace();
				break;
		}
	}

	// The controller object to be returned
	const controller = {
		/**
		 * Start listening for keyboard events
		 */
		start: function () {
			// Create the event handler function

			// Add the event listener
			document.addEventListener('keydown', keydownHandler);
		},

		/**
		 * Stop listening for keyboard events
		 */
		stop: function () {
			document.removeEventListener('keydown', keydownHandler);
		}
	};

	return controller;
}

export const keyboardController = createKeyboardController();
