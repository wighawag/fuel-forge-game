import { ContractFactory as __ContractFactory } from "fuels";
import type { Provider, Account, DeployContractOptions } from "fuels";
import { TestContract } from "./TestContract.js";
export declare class TestContractFactory extends __ContractFactory<TestContract> {
    static readonly bytecode: Uint8Array<ArrayBufferLike>;
    constructor(accountOrProvider: Account | Provider);
    static deploy(wallet: Account, options?: DeployContractOptions): Promise<import("fuels").DeployContractResult<TestContract>>;
}
//# sourceMappingURL=TestContractFactory.d.ts.map