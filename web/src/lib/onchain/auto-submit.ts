import { localComputer, time } from '$lib/connection';
import { localState } from '$lib/view/localState';

export function createAutoSubmitter() {
	function start() {
		return time.subscribe(($time) => {
			const epochInfo = localComputer.calculateEpochInfo($time.value);

			const localData = localState.value;
			if (epochInfo.isCommitPhase) {
				if (epochInfo.timeLeftForCommitEnd < 5) {
					if (!localData.submission || localData.submission.commit.epoch < epochInfo.currentEpoch) {
						localState.commit();
					} else {
						// already submiited
					}
				} else {
					// still time for player to setup its move
				}
			} else {
				if (
					!localData.submission?.reveal ||
					localData.submission.reveal.epoch < epochInfo.currentEpoch
				) {
					localState.reveal();
				} else {
					// already submiited
				}
			}
		});
	}

	return {
		start
	};
}
