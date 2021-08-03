import dotenv from 'dotenv';
dotenv.config();

import { network, upgrades } from 'hardhat';
import { getVestingContracts } from './utils/get_vesting_deployed_contracts';
import { ContractFactoryUtility } from '../libs/ContractFactory';

/**
 * Upgrade all contracts apart from AuctionManager
 **/
const SCRIPT_NAME = 'UPGRADE v3 CONTRACTS';

const main = async () => {
  const networkName = network.name;

  try {
    console.log(`============================ ${SCRIPT_NAME} ===============================`);
    console.log(`Running on network: ${networkName}`);

    const { vesting } = await getVestingContracts(networkName);

    const vestingUpgrade = await upgrades.upgradeProxy(
      vesting.address,
      await ContractFactoryUtility.getVestingFactory(),
      {
        unsafeAllowLinkedLibraries: true,
      }
    );
    console.log('Upgraded auction contract - ', vestingUpgrade.address);

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
