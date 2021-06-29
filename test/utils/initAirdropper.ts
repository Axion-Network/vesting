import { upgrades } from 'hardhat';
import { ContractFactoryUtility } from '../../libs/ContractFactory';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { Vesting } from '../../typechain';

export interface AirdropperContracts {
  vesting: Vesting;
}

interface InitOptions {
  setter: SignerWithAddress;
  bank?: SignerWithAddress;
}

export async function initAirdropperContracts({
  setter,
}: InitOptions): Promise<AirdropperContracts> {
  const vesting = (await upgrades.deployProxy(
    await ContractFactoryUtility.getVestingFactory(),
    [setter.address, setter.address],
    {
      unsafeAllowCustomTypes: true,
      unsafeAllowLinkedLibraries: true,
    }
  )) as Vesting;

  return { vesting };
}
