import '@nomiclabs/hardhat-waffle';
import 'hardhat-typechain';
import { task, HardhatUserConfig } from 'hardhat/config';
import 'solidity-coverage';
import '@openzeppelin/hardhat-upgrades';
import '@nomiclabs/hardhat-etherscan';
import dotenv from 'dotenv';
import { NetworkUserConfig } from 'hardhat/types';
dotenv.config();

/* uncomment to see the gas report after running the test */
// import 'hardhat-gas-reporter'

task('accounts', 'Prints the list of accounts', async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const { DEPLOYER_SECRET, DEPLOY_GAS_LIMIT, DEPLOY_GAS_PRICE } = process.env;

const INFURA_URL = 'https://mainnet.infura.io/v3/a4d00fd3d7ff47e4bd590b9c39ad1409';
const ETHERSCAN_API_KEY = '89R34PEUMA4CZDH2FMP8YM9R8GT9SVNI6P';

const getNetworkConfig = (chainId: number) => {
  if (!INFURA_URL || !DEPLOYER_SECRET || !DEPLOY_GAS_LIMIT || !DEPLOY_GAS_PRICE) {
    return {
      url: 'please update .env file',
    } as NetworkUserConfig;
  }

  return {
    chainId,
    url: INFURA_URL,
    accounts: [DEPLOYER_SECRET],
    gas: Number(DEPLOY_GAS_LIMIT),
    gasPrice: Number(DEPLOY_GAS_PRICE) * 1000000000, // gwei unit
    timeout: 600 * 1000 * 2, // milliseconds
    throwOnCallFailures: true,
    throwOnTransactionFailures: true,
    loggingEnabled: true,
  } as NetworkUserConfig;
};

export default {
  networks: {
    dev: {
      url: 'http://127.0.0.1:8545/',
    },
    hardhat: {
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      allowUnlimitedContractSize: true,
      blockGasLimit: 0x1fffffffffffff,
    },
    ropsten: getNetworkConfig(3),
    rinkeby: getNetworkConfig(4),
    live: getNetworkConfig(1),
    binance: getNetworkConfig(56), // https://bsc-dataseed.binance.org/
    btest: getNetworkConfig(97), // https://data-seed-prebsc-1-s1.binance.org:8545/
  },
  solidity: {
    version: '0.8.3',
    settings: {
      optimizer: {
        enabled: true,
        runs: 50000,
      },
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
} as HardhatUserConfig;
