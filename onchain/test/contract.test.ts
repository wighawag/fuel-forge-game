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

/**
 * Returns the current zone and 8 surrounding zones in clockwise order starting from center and then top
 * Order: center, top, top-right, right, bottom-right, bottom, bottom-left, left, top-left
 * With x axis moving from left to right and y from top to bottom
 */
function calculateSurroundingZones(position: { x: number, y: number }): BN[] {
  // Define zone size (how many position units per zone)
  const zoneSize = 63n;
  const halfZone = zoneSize / 2n;
  
  // Calculate the zone coordinates for the current position
  const xZone = (BigInt(position.x) + halfZone) / zoneSize;
  const yZone = (BigInt(position.y) + halfZone) / zoneSize;
  
  // Define the offsets in clockwise order starting from center and then top
  // y-1,x+0 (top) → y-1,x+1 (top-right) → y+0,x+1 (right) → 
  // y+1,x+1 (bottom-right) → y+1,x+0 (bottom) → y+1,x-1 (bottom-left) → 
  // y+0,x-1 (left) → y-1,x-1 (top-left) → y+0,x+0 (center)
  const offsets = [
    { y: 0n, x: 0n },    // center (current zone)
    { y: -1n, x: 0n },  // top
    { y: -1n, x: 1n },  // top-right
    { y: 0n, x: 1n },   // right
    { y: 1n, x: 1n },   // bottom-right
    { y: 1n, x: 0n },   // bottom
    { y: 1n, x: -1n },  // bottom-left
    { y: 0n, x: -1n },  // left
    { y: -1n, x: -1n }, // top-left
    
  ];
  
  // Generate the zones based on the defined offsets
  const zones: BN[] = offsets.map(offset => {
    const newXZone = xZone + offset.x;
    const newYZone = yZone + offset.y;
    return new BN(((newYZone << 32n) | newXZone).toString());
  });
  
  return zones;
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


  test('Can get Players Per Zones For Entrance', async () => {
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


  test('Can get Players Per Different Zones', async () => {
    using testNode = await launchTestNode({
      walletsConfig: {
        count: 3,
      },
      contractsConfigs: [
        {
          factory: TestContractFactory
        },
      ],
    });

    const {
      contracts: [contract],
      wallets
    } = testNode;


    for (const wallet of wallets) {
      console.log(wallet.address.toAddress());
      contract.account = wallet;
      await contract.functions.enter().call();
    }

     let {value: initial_list_of_player_list} = await contract.functions.players_in_zones([calculateZone(ENTRANCE)]).get();

    console.log(JSON.stringify(initial_list_of_player_list, null, 2));

    // move first account so it is in a different zone
    contract.account = wallets[0];
    await contract.functions.move({x: ENTRANCE.x + 33, y:ENTRANCE.y}).call();


  
    const zones = calculateSurroundingZones(ENTRANCE);

    
    
    let {value: list_of_player_list} = await contract.functions.players_in_zones(zones).get();

    console.log(JSON.stringify(list_of_player_list, null, 2));

    expect(list_of_player_list[0][0].account.Address?.bits).to.equal(wallets[2].address.toAddress());
    expect(list_of_player_list[0][1].account.Address?.bits).to.equal(wallets[1].address.toAddress());
    expect(list_of_player_list[3][0].account.Address?.bits).to.equal(wallets[0].address.toAddress());
  });

});
