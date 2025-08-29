import { localComputer, time } from '$lib/connection';
import { localState } from '$lib/view/localState';

export function createAutoSubmitter() {
	function start() {
		return time.subscribe(($time) => {
			const localData = localState.value;
			if (localData.actions.length == 0) {
				return;
			}

			const epochInfo = localComputer.calculateEpochInfo($time.value);

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
				// TODO remove
				if (epochInfo.timeLeftForRevealEnd > 7) {
					return;
				}
				if (localData.submission && localData.submission.commit.epoch == epochInfo.currentEpoch) {
					if (
						!localData.submission.reveal ||
						localData.submission.reveal.epoch < epochInfo.currentEpoch
					) {
						localState.reveal();
					} else {
						// already submiited
					}
				}
			}
		});
	}

	return {
		start
	};
}
