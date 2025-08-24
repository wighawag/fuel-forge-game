import { launchTestNode, TestAssetId } from 'fuels/test-utils';

import { describe, test, expect, assert } from 'vitest';

import { TestContractFactory } from '../typescript/src/contracts/TestContractFactory';
import { BN } from 'fuels';


const ENTRANCE = { x: 1 << 30, y: 1 << 30};

// TypeScript implementation of _calculate_zone from Sway
function calculateZone(position: { x: number, y: number }): BN {
  // Define zone size (how many position units per zone)
  // Using power of 2 for efficient division
  const zoneSize = 63n;
  const halfZone = zoneSize / 2n;
  
  // Add half_zone to center zones around entrance position
  // This ensures entrance ± half_zone are in the same zone
  const xZone = (BigInt(position.x) + halfZone) / zoneSize;
  const yZone = (BigInt(position.y) + halfZone) / zoneSize;
  
  // Calculate a unique zone index using bit manipulation
  // This creates a unique number for each (x,y) zone coordinate pair
  // Using 32 bits for each coordinate (more than enough for game zones)
  // Zone index = (y_zone << 32) | x_zone
  return new BN(((yZone << 32n) | xZone).toString());
}


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
      wallets: [wallet]
    } = testNode;
    let {value: identity} = await contract.functions.identity().get();

    await contract.functions.enter().call();
    
    let new_position = {x: 1, y: 2};
    await contract.functions.move(new_position).call();
    let {value: current_position} = await contract.functions.position(identity).get();
    expect(current_position?.x.toNumber()).to.equal(new_position.x);
    expect(current_position?.y.toNumber()).to.equal(new_position.y);

  });


  test('Can get Players Per Zones', async () => {
    using testNode = await launchTestNode({
      contractsConfigs: [
        {
          factory: TestContractFactory
        },
      ],
    });

    const {
      contracts: [contract],
      wallets: [wallet]
    } = testNode;
    let {value: identity} = await contract.functions.identity().get();

    await contract.functions.enter().call();
  
    const expected_zone = calculateZone(ENTRANCE);
    
    let {value: list_of_player_list} = await contract.functions.players_in_zones([expected_zone]).get();
    expect(list_of_player_list[0][0].account.Address?.bits).to.equal(identity.Address?.bits);
  });

});
