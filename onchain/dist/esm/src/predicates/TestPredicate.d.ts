import { BigNumberish, Predicate as __Predicate, PredicateParams } from 'fuels';
export type TestPredicateConfigurables = undefined;
export type TestPredicateInputs = [password: BigNumberish];
export type TestPredicateParameters = Omit<PredicateParams<TestPredicateInputs, TestPredicateConfigurables>, 'abi' | 'bytecode'>;
export declare class TestPredicate extends __Predicate<TestPredicateInputs, TestPredicateConfigurables> {
    static readonly abi: {
        programType: string;
        specVersion: string;
        encodingVersion: string;
        concreteTypes: {
            type: string;
            concreteTypeId: string;
        }[];
        metadataTypes: never[];
        functions: {
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
        }[];
        loggedTypes: never[];
        messagesTypes: never[];
        configurables: never[];
        errorCodes: {};
    };
    static readonly bytecode: Uint8Array<ArrayBufferLike>;
    constructor(params: TestPredicateParameters);
}
//# sourceMappingURL=TestPredicate.d.ts.map