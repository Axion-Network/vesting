import { ethers } from 'hardhat';

import {
  // Utility
  Vesting,
  Vesting__factory,

  // Terc20
  TERC20,
  TERC20__factory,
} from '../typechain';

enum AxionContract {
  // Uniswap / Utility
  Vesting = 'Vesting',
  //V3
  TERC20 = 'TERC20',
}

export class ContractFactoryUtility {
  /** Utility contracts ---------------------------------------------------------------------------------------------------- */
  // TERC20
  static getTERC20Factory(): Promise<TERC20__factory> {
    return ethers.getContractFactory(AxionContract.TERC20) as Promise<TERC20__factory>;
  }

  static getTERC20At(address: string): Promise<TERC20> {
    return ethers.getContractAt(AxionContract.TERC20, address) as Promise<TERC20>;
  }
  // Vesting
  static getVestingFactory(): Promise<Vesting__factory> {
    return ethers.getContractFactory(AxionContract.Vesting) as Promise<Vesting__factory>;
  }

  static getVestingAt(address: string): Promise<Vesting> {
    return ethers.getContractAt(AxionContract.Vesting, address) as Promise<Vesting>;
  }
}
