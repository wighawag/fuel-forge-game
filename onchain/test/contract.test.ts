import { launchTestNode, TestAssetId } from 'fuels/test-utils';

import { describe, test, expect } from 'vitest';

import { TestContractFactory } from '../typescript/src/contracts/TestContractFactory';

describe('Game', () => {
  test('Can Move', async () => {
    using testNode = await launchTestNode({
      contractsConfigs: [
        {
          factory: TestContractFactory
        },
      ],
    });

    const {
      contracts: [contract],
    } = testNode;

  });


});
