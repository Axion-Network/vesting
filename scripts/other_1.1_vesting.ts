import dotenv from 'dotenv';
dotenv.config();

import { network } from 'hardhat';
import { TEST_NETWORKS } from '../constants/common';
import { getVestingContracts } from './utils/get_vesting_deployed_contracts';
import { getDeployedContractsV1 } from './utils/get_v1_deployed_contracts';
import { ethers } from 'ethers';
import { DAY } from '../test/utils/constants';
const ADDRESSES = require('../deployed-addresses/vesting.json');

// FOREIGN SWAP
// I got these values from (@see https://etherscan.io/address/0x25be894d8b04ea2a3d916fec9b32ec0f38d08aa9#readContract)
// Need to clarify what they are

/**
 * INIT CONTRACTS (After deployment / snapshot restoration)
 **/
const SCRIPT_NAME = 'CUSTOM SETTERS';

const main = async () => {
  const networkName = network.name;

  try {
    console.log(`============================ ${SCRIPT_NAME} ===============================`);
    console.log(`Running on network: ${networkName}`);

    const { NETWORK, VESTING } = ADDRESSES;

    if (NETWORK !== networkName) {
      throw new Error('Network does not match');
    }

    [NETWORK, VESTING].forEach((address) => {
      if (!address) {
        throw new Error('Please check migration-output/address.json file');
      }
    });

    const v1Contracts = await getDeployedContractsV1(networkName);
    const { vesting } = await getVestingContracts(networkName);
    /** Add amount to fill by */
    const signer = await vesting.setSigner(process.env.DEPLOYER_ADDRESS!);
    await signer.wait();

    const approve = await v1Contracts.hex4TokenV1?.approve(
      vesting.address,
      ethers.utils.parseEther('99999999')
    );
    await approve?.wait();

    const testStaker = '0x98C8088802EE7ED7459a59A1090CB6Fc14FDe9b9';
    const vestName = 'Vabble Test';
    const startTime = Math.ceil(new Date().getTime() / 1000);

    const addItem = await vesting.addItem(
      v1Contracts.hex4TokenV1?.address!,
      vestName,
      '933750000000000000000000',
      '1624482000',
      '4320',
      '1728',
      '1624489200'
    );
    await addItem.wait();
    // const addVestor = await vesting.addVester(
    //   vestName,
    //   testStaker,
    //   15,
    //   17,
    //   20,
    //   ethers.utils.parseEther('100')
    // );
    // await addVestor.wait();

    console.log(
      `============================ ${SCRIPT_NAME}: DONE ===============================`
    );
  } catch (e) {
    console.error(
      `============================ ${SCRIPT_NAME}: FAILED ===============================`
    );
    throw e;
  }
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
