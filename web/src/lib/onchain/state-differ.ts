type GameState<T> = Map<string, T>;

import { createEmitter } from '../emitter';

export function createStateDiffer<GameObject extends {}>() {
	let currentState = new Map<string, GameObject>();

	const { subscribe: onAdded, emit: objectAdded } = createEmitter<GameObject>();
	const { subscribe: onRemoved, emit: objectRemoved } = createEmitter<GameObject>();
	const { subscribe: onChanged, emit: objectChanged } = createEmitter<GameObject>();
	const { subscribe: onDiffCompleted, emit: diffCompleted } = createEmitter<{
		added: number;
		removed: number;
		total: number;
	}>();

	function getChanges(oldObj: GameObject, newObj: GameObject) {
		const changes: Record<string, any> = {};
		let hasChanges = false;

		// Deep comparison with change tracking
		const compare = (path: string, oldVal: any, newVal: any) => {
			if (typeof oldVal !== typeof newVal) {
				changes[path] = { from: oldVal, to: newVal };
				hasChanges = true;
				return;
			}

			if (typeof oldVal === 'object' && oldVal !== null) {
				if (Array.isArray(oldVal)) {
					// TODO this is bad
					if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
						changes[path] = { from: oldVal, to: newVal };
						hasChanges = true;
					}
				} else {
					Object.keys({ ...oldVal, ...newVal }).forEach((key) => {
						compare(path ? `${path}.${key}` : key, oldVal[key], newVal[key]);
					});
				}
			} else if (oldVal !== newVal) {
				changes[path] = { from: oldVal, to: newVal };
				hasChanges = true;
			}
		};

		compare('', oldObj, newObj);
		return hasChanges ? changes : null;
	}

	function normalizeState(state: GameState<GameObject>) {
		// if (state instanceof Map) {
		return state;
		// }
		// if (Array.isArray(state)) {
		// 	return new Map(state.map((item) => [item.id, item]));
		// }
		// return new Map(Object.entries(state));
	}

	function computeAndEmitDiff(oldState: GameState<GameObject>, newState: GameState<GameObject>) {
		const processed = new Set();

		// Check for additions and updates
		newState.forEach((value, id) => {
			processed.add(id);

			if (!oldState.has(id)) {
				objectAdded(value); // TODO ?{ id, data: value });
			} else {
				const oldValue = oldState.get(id)!;
				const changes = getChanges(oldValue, value);

				if (changes) {
					objectChanged(value);
					// TODO{
					// 	id,
					// 	previous: oldValue,
					// 	current: value,
					// 	changes
					// });
				}
			}
		});

		// Check for removals
		oldState.forEach((value, id) => {
			if (!processed.has(id)) {
				objectRemoved(value); // TODO { id, data: value });
			}
		});

		// Emit batch complete event
		diffCompleted({
			added: newState.size - oldState.size,
			removed: oldState.size - newState.size,
			total: newState.size
		});
	}

	function update(snapshot: GameState<GameObject>) {
		const newState = normalizeState(snapshot);

		// Compute diff and emit events
		computeAndEmitDiff(currentState, newState);

		currentState = newState;
	}

	return {
		update,
		onAdded,
		onRemoved,
		onChanged,
		onDiffCompleted
	};
}
