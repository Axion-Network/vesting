import { ContractFactoryUtility } from '../../libs/ContractFactory';
const ADDRESSES = require('../../deployed-addresses/vesting.json');

export async function getVestingContracts(network: string) {
  const { NETWORK, VESTING } = ADDRESSES;

  if (NETWORK !== network) {
    throw new Error('Network does not match');
  }

  [NETWORK, VESTING].forEach((address) => {
    if (!address) {
      throw new Error('Please check migration-output/address.json file');
    }
  });

  const vesting = await ContractFactoryUtility.getVestingAt(VESTING);

  return {
    vesting,
  };
}
