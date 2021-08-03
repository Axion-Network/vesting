import dotenv from 'dotenv';
dotenv.config();

import { network } from 'hardhat';
import { TEST_NETWORKS } from '../constants/common';
import { getVestingContracts } from './utils/get_vesting_deployed_contracts';
import { ethers } from 'ethers';
import { DAY, ZERO_ADDRESS } from '../test/utils/constants';
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

    const { vesting } = await getVestingContracts(networkName);

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
