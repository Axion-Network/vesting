import { ethers } from 'hardhat';
import { TERC20 } from '../../typechain';
import { ContractFactoryUtility } from '../../libs/ContractFactory';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

export interface UtilityContracts {
  swaptoken: TERC20;
}

interface InitOptions {
  setter: SignerWithAddress;
  bank?: SignerWithAddress;
  bankers?: [SignerWithAddress];
}

export async function initUtilityContracts({
  setter,
  bank,
  bankers,
}: InitOptions): Promise<UtilityContracts> {

  let swaptoken;
  if (bank) {
    swaptoken = await ContractFactoryUtility.getTERC20Factory().then((factory) =>
      factory
        .connect(bank)
        .deploy('2T Token', '2T', ethers.utils.parseEther('10000000000'), bank.address)
    );
    if (bankers) {
      for (var i = 0; i < bankers.length; i++) {
        await swaptoken
          .connect(bank)
          .mint(bankers[i].address, ethers.utils.parseEther('10000000000'));
      }
    }
  } else {
    swaptoken = await ContractFactoryUtility.getTERC20Factory().then((factory) =>
      factory.deploy('Hex3t Token', 'Hex3t', ethers.utils.parseEther('10000000000'), setter.address)
    );
  }

  return {
    swaptoken,
  };
}
