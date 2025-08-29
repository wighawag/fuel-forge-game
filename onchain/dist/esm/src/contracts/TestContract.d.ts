import { Contract as __Contract, Interface } from "fuels";
import type { Provider, Account, StorageSlot, Address, BigNumberish, BN, FunctionFragment, InvokeFunction } from 'fuels';
import type { Option, Enum, Vec } from "./common.js";
export type ActionInput = Enum<{
    Move: PositionInput;
    PlaceBomb: undefined;
}>;
export type ActionOutput = Enum<{
    Move: PositionOutput;
    PlaceBomb: void;
}>;
export type EntityInput = Enum<{
    Player: PlayerInput;
    Bomb: BombInput;
}>;
export type EntityOutput = Enum<{
    Player: PlayerOutput;
    Bomb: BombOutput;
}>;
export declare enum GameErrorInput {
    PlayerAlreadyIn = "PlayerAlreadyIn",
    PlayerNotIn = "PlayerNotIn",
    PlayerIsDead = "PlayerIsDead",
    CommitmentHashNotMatching = "CommitmentHashNotMatching",
    PreviousCommitmentNotRevealed = "PreviousCommitmentNotRevealed",
    InRevealPhase = "InRevealPhase",
    InCommitmentPhase = "InCommitmentPhase",
    NothingToReveal = "NothingToReveal",
    InvalidEpoch = "InvalidEpoch",
    PlayerNeedsToWait = "PlayerNeedsToWait"
}
export declare enum GameErrorOutput {
    PlayerAlreadyIn = "PlayerAlreadyIn",
    PlayerNotIn = "PlayerNotIn",
    PlayerIsDead = "PlayerIsDead",
    CommitmentHashNotMatching = "CommitmentHashNotMatching",
    PreviousCommitmentNotRevealed = "PreviousCommitmentNotRevealed",
    InRevealPhase = "InRevealPhase",
    InCommitmentPhase = "InCommitmentPhase",
    NothingToReveal = "NothingToReveal",
    InvalidEpoch = "InvalidEpoch",
    PlayerNeedsToWait = "PlayerNeedsToWait"
}
export type IdentityInput = Enum<{
    Address: AddressInput;
    ContractId: ContractIdInput;
}>;
export type IdentityOutput = Enum<{
    Address: AddressOutput;
    ContractId: ContractIdOutput;
}>;
export type AddressInput = {
    bits: string;
};
export type AddressOutput = AddressInput;
export type BombInput = {
    position: PositionInput;
    length: BigNumberish;
    start: BigNumberish;
    end: BigNumberish;
};
export type BombOutput = {
    position: PositionOutput;
    length: BN;
    start: BN;
    end: BN;
};
export type CommitmentSubmittedInput = {
    account: IdentityInput;
    epoch: BigNumberish;
    hash: string;
};
export type CommitmentSubmittedOutput = {
    account: IdentityOutput;
    epoch: BN;
    hash: string;
};
export type ContractIdInput = {
    bits: string;
};
export type ContractIdOutput = ContractIdInput;
export type PlayerInput = {
    account: IdentityInput;
    position: PositionInput;
    epoch: BigNumberish;
    life: BigNumberish;
};
export type PlayerOutput = {
    account: IdentityOutput;
    position: PositionOutput;
    epoch: BN;
    life: BN;
};
export type PositionInput = {
    x: BigNumberish;
    y: BigNumberish;
};
export type PositionOutput = {
    x: BN;
    y: BN;
};
export type ZonesInfoInput = {
    zones: Vec<Vec<EntityInput>>;
};
export type ZonesInfoOutput = {
    zones: Vec<Vec<EntityOutput>>;
};
export declare class TestContractInterface extends Interface {
    constructor();
    functions: {
        calculate_zone: FunctionFragment;
        commit_actions: FunctionFragment;
        enter: FunctionFragment;
        get_time: FunctionFragment;
        get_zones: FunctionFragment;
        identity: FunctionFragment;
        increase_time: FunctionFragment;
        position: FunctionFragment;
        reveal_actions: FunctionFragment;
    };
}
export declare class TestContract extends __Contract {
    static readonly abi: {
        programType: string;
        specVersion: string;
        encodingVersion: string;
        concreteTypes: ({
            type: string;
            concreteTypeId: string;
            metadataTypeId?: undefined;
            typeArguments?: undefined;
        } | {
            type: string;
            concreteTypeId: string;
            metadataTypeId: number;
            typeArguments?: undefined;
        } | {
            type: string;
            concreteTypeId: string;
            metadataTypeId: number;
            typeArguments: string[];
        })[];
        metadataTypes: ({
            type: string;
            metadataTypeId: number;
            components: ({
                name: string;
                typeId: number;
            } | {
                name: string;
                typeId: string;
            })[];
            typeParameters?: undefined;
        } | {
            type: string;
            metadataTypeId: number;
            components: {
                name: string;
                typeId: string;
                errorMessage: string;
            }[];
            typeParameters?: undefined;
        } | {
            type: string;
            metadataTypeId: number;
            components: ({
                name: string;
                typeId: string;
            } | {
                name: string;
                typeId: number;
            })[];
            typeParameters: number[];
        } | {
            type: string;
            metadataTypeId: number;
            components?: undefined;
            typeParameters?: undefined;
        } | {
            type: string;
            metadataTypeId: number;
            components: {
                name: string;
                typeId: number;
                typeArguments: {
                    name: string;
                    typeId: number;
                    typeArguments: {
                        name: string;
                        typeId: number;
                    }[];
                }[];
            }[];
            typeParameters?: undefined;
        } | {
            type: string;
            metadataTypeId: number;
            components: ({
                name: string;
                typeId: number;
                typeArguments: {
                    name: string;
                    typeId: number;
                }[];
            } | {
                name: string;
                typeId: string;
                typeArguments?: undefined;
            })[];
            typeParameters: number[];
        })[];
        functions: ({
            name: string;
            inputs: {
                name: string;
                concreteTypeId: string;
            }[];
            output: string;
            attributes: null;
        } | {
            name: string;
            inputs: {
                name: string;
                concreteTypeId: string;
            }[];
            output: string;
            attributes: {
                name: string;
                arguments: string[];
            }[];
        })[];
        loggedTypes: {
            logId: string;
            concreteTypeId: string;
        }[];
        messagesTypes: never[];
        configurables: never[];
        errorCodes: {
            "18446744069414584320": {
                pos: {
                    pkg: string;
                    file: string;
                    line: number;
                    column: number;
                };
                logId: string;
                msg: null;
            };
            "18446744069414584321": {
                pos: {
                    pkg: string;
                    file: string;
                    line: number;
                    column: number;
                };
                logId: string;
                msg: null;
            };
            "18446744069414584322": {
                pos: {
                    pkg: string;
                    file: string;
                    line: number;
                    column: number;
                };
                logId: string;
                msg: null;
            };
            "18446744069414584323": {
                pos: {
                    pkg: string;
                    file: string;
                    line: number;
                    column: number;
                };
                logId: string;
                msg: null;
            };
            "18446744069414584324": {
                pos: {
                    pkg: string;
                    file: string;
                    line: number;
                    column: number;
                };
                logId: string;
                msg: null;
            };
            "18446744069414584325": {
                pos: {
                    pkg: string;
                    file: string;
                    line: number;
                    column: number;
                };
                logId: string;
                msg: null;
            };
            "18446744069414584326": {
                pos: {
                    pkg: string;
                    file: string;
                    line: number;
                    column: number;
                };
                logId: string;
                msg: null;
            };
            "18446744069414584327": {
                pos: {
                    pkg: string;
                    file: string;
                    line: number;
                    column: number;
                };
                logId: string;
                msg: null;
            };
            "18446744069414584328": {
                pos: {
                    pkg: string;
                    file: string;
                    line: number;
                    column: number;
                };
                logId: string;
                msg: null;
            };
            "18446744069414584329": {
                pos: {
                    pkg: string;
                    file: string;
                    line: number;
                    column: number;
                };
                logId: string;
                msg: null;
            };
        };
    };
    static readonly storageSlots: StorageSlot[];
    interface: TestContractInterface;
    functions: {
        calculate_zone: InvokeFunction<[position: PositionInput], BN>;
        commit_actions: InvokeFunction<[hash: string], void>;
        enter: InvokeFunction<[], void>;
        get_time: InvokeFunction<[], BN>;
        get_zones: InvokeFunction<[zones: Vec<BigNumberish>, epoch_provided: BigNumberish], ZonesInfoOutput>;
        identity: InvokeFunction<[], IdentityOutput>;
        increase_time: InvokeFunction<[seconds: BigNumberish], void>;
        position: InvokeFunction<[account: IdentityInput], Option<PositionOutput>>;
        reveal_actions: InvokeFunction<[account: IdentityInput, secret: string, actions: Vec<ActionInput>], void>;
    };
    constructor(id: string | Address, accountOrProvider: Account | Provider);
}
//# sourceMappingURL=TestContract.d.ts.map