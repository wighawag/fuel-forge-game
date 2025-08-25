import { launchTestNode, TestAssetId } from 'fuels/test-utils';

import { describe, test, expect, assert } from 'vitest';

import { TestContractFactory } from '../typescript/src/contracts/TestContractFactory';
import {ENTRANCE, calculateSurroundingZones, calculateZone} from '../typescript/lib/index.js'

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
    
    let {value: list_of_player_list} = await contract.functions.entities_in_zones([expected_zone]).get();
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

     let {value: initial_list_of_player_list} = await contract.functions.entities_in_zones([calculateZone(ENTRANCE)]).get();

    console.log(JSON.stringify(initial_list_of_player_list, null, 2));

    // move first account so it is in a different zone
    contract.account = wallets[0];
    await contract.functions.move({x: ENTRANCE.x + 33, y:ENTRANCE.y}).call();


  
    const zones = calculateSurroundingZones(ENTRANCE);

    
    
    let {value: list_of_player_list} = await contract.functions.entities_in_zones(zones).get();

    console.log(JSON.stringify(list_of_player_list, null, 2));

    expect(list_of_player_list[0][0].account.Address?.bits).to.equal(wallets[2].address.toAddress());
    expect(list_of_player_list[0][1].account.Address?.bits).to.equal(wallets[1].address.toAddress());
    expect(list_of_player_list[3][0].account.Address?.bits).to.equal(wallets[0].address.toAddress());
  });

});
