import dotenv from 'dotenv';
dotenv.config();

import { network, upgrades } from 'hardhat';
import path from 'path';
import fs from 'fs';
import { TEST_NETWORKS } from '../constants/common';
import { ContractFactoryUtility } from '../libs/ContractFactory';
import { Vesting } from '../typechain';

/**
 * Deploy upgradable contracts
 **/
const SCRIPT_NAME = 'DEPLOY AXION V3 CONTRACTS';

const main = async () => {
  const networkName = network.name;

  try {
    console.log(`============================ ${SCRIPT_NAME} ===============================`);
    console.log(`Running on network: ${networkName}`);

    const { DEPLOYER_ADDRESS, MANAGER_ADDRESS } = process.env;

    if (!TEST_NETWORKS.includes(networkName)) {
      [DEPLOYER_ADDRESS, MANAGER_ADDRESS].forEach((value) => {
        if (!value) {
          throw new Error('Please set the value in .env file');
        }
      });
    }

    const deployerAddress = DEPLOYER_ADDRESS;
    const managerAddress = MANAGER_ADDRESS;

    const vesting = (await upgrades.deployProxy(
      await ContractFactoryUtility.getVestingFactory(),
      [managerAddress, deployerAddress],
      {
        unsafeAllowCustomTypes: true,
        unsafeAllowLinkedLibraries: true,
      }
    )) as Vesting;
    console.log('Vesting Deployed');

    const verifyScriptPath = path.join(__dirname, '..', 'verify-contracts', 'Vesting-verify');

    fs.writeFileSync(
      verifyScriptPath,
      `
      npx hardhat verify --network ${networkName} ${vesting.address}
      `
    );

    const addressFilePath = path.join(__dirname, '..', 'deployed-addresses', 'vesting.json');

    fs.writeFileSync(
      addressFilePath,
      JSON.stringify(
        {
          NETWORK: networkName,
          VESTING: vesting.address,
        },
        null,
        2
      )
    );
    console.log('Contracts addresses saved to', addressFilePath.toString());

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
