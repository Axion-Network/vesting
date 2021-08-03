import { initUtilityContracts, UtilityContracts } from './utils/initUtilityContracts';
import { AirdropperContracts, initAirdropperContracts } from './utils/initAirdropper';
// import { AxionContractsV3, initV3Contracts } from './utils/initV3Contracts';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { expect } from 'chai';
import { TestUtil } from './utils/TestUtil';
import { DAY, SECONDS_IN_DAY } from './utils/constants';
import Web3 from 'web3';

const EthCrypto = require('eth-crypto');

const testSigner = Web3.utils.toChecksumAddress('0x98C8088802EE7ED7459a59A1090CB6Fc14FDe9b9');
const testSignerPriv = 'dc27806047dee704c158d1dc874524de4eb2b3be6d97182786a8f73cffa91457';
const getMessageHash = (encodeTypes, args) => {
  const encoder = ethers.utils.defaultAbiCoder;

  let encoded = encoder.encode(encodeTypes, args);
  return ethers.utils.sha256(encoded);
};

const sign = (address, pkey, messageParamsTypes, messageParams) => {
  const messageHash = getMessageHash(messageParamsTypes, messageParams);
  return EthCrypto.sign(pkey, messageHash);
};

describe('Vester', async () => {
  let setter: SignerWithAddress;
  let staker: SignerWithAddress;
  let airdropperContracts: AirdropperContracts;
  let utilityContracts: UtilityContracts;

  beforeEach(async () => {
    const [_setter, _staker] = await ethers.getSigners();
    setter = _setter;
    staker = _staker;

    utilityContracts = await initUtilityContracts({
      setter,
      bank: setter,
    });

    airdropperContracts = await initAirdropperContracts({
      setter,
    });
    /** Create v2 stakes, and upgrade v1 stakes to v2 */
  });

  describe('initialize', () => {});
  describe('Add items', () => {
    const name = 'Vesting Of the day';
    it('should add items to contract', async () => {
      const startTime = Math.ceil(new Date().getTime() / 1000);

      await utilityContracts.swaptoken
        .connect(setter)
        .approve(airdropperContracts.vesting.address, ethers.utils.parseEther('100000'));
      await airdropperContracts.vesting
        .connect(setter)
        .addItem(
          utilityContracts.swaptoken.address,
          name,
          ethers.utils.parseEther('5000'),
          startTime + DAY,
          0,
          DAY,
          startTime + DAY * 20,
          testSigner
        );

      const item = await airdropperContracts.vesting.items(name);
      expect(item.token).to.be.equal(utilityContracts.swaptoken.address);
      expect(item.amount.toString()).to.be.equal(ethers.utils.parseEther('5000'));
      expect(item.startTime.toNumber()).to.be.equal(startTime + DAY);
      expect(item.cliffTime.toNumber()).to.be.equal(0);
      expect(item.timeBetweenUnlocks.toNumber()).to.be.equal(DAY);
      expect(item.bonusUnlockTime.toNumber()).to.be.equal(startTime + DAY * 20);
    });
  });
  describe('Withdraws', () => {
    const name = 'Vesting Of the day';
    beforeEach(async () => {
      const startTime = Math.ceil(new Date().getTime() / 1000);

      await utilityContracts.swaptoken
        .connect(setter)
        .approve(airdropperContracts.vesting.address, ethers.utils.parseEther('100000'));

      await airdropperContracts.vesting
        .connect(setter)
        .addItem(
          utilityContracts.swaptoken.address,
          name,
          ethers.utils.parseEther('5000'),
          startTime + DAY,
          DAY,
          DAY,
          startTime + DAY * 20,
          testSigner
        );
    });

    it('should withdraw', async () => {
      await expect(airdropperContracts.vesting.connect(staker).withdraw(name)).to.be.revertedWith(
        'User Record does not exist'
      );

      await airdropperContracts.vesting.connect(setter).addMultipleVesters({
        _name: [name],
        _vester: [staker.address],
        _amount: [ethers.utils.parseEther('100')], // 111111372
        _percentInitialAmount: [50],
        _percentAmountPerWithdraw: [10],
        _percentBonus: [0],
      });
      await expect(airdropperContracts.vesting.connect(staker).withdraw(name)).to.be.revertedWith(
        'Has not begun yet'
      );
      TestUtil.increaseTime(DAY * 1);
      await airdropperContracts.vesting.connect(staker).withdraw(name);
      // Cliff time
      await expect(airdropperContracts.vesting.connect(staker).withdraw(name)).to.be.revertedWith(
        'Withdrawal not allowed at this time'
      );
      TestUtil.increaseTime(DAY * 2);
      await airdropperContracts.vesting.connect(staker).withdraw(name);
      await expect(airdropperContracts.vesting.connect(staker).withdraw(name)).to.be.revertedWith(
        'No withdrawals to pay at this time'
      );

      TestUtil.increaseTime(DAY * 4);
      await airdropperContracts.vesting.connect(staker).withdraw(name);
      TestUtil.increaseTime(DAY * 5);

      await expect(airdropperContracts.vesting.connect(staker).withdraw(name)).to.be.revertedWith(
        'No withdrawals to pay at this time'
      );

      const record = await airdropperContracts.vesting
        .connect(staker)
        .records(staker.address, name);
      expect(record.amount.toString()).to.be.equal(record.totalWithdrawn.toString());
    });

    it('should withdraw bonus', async () => {
      await airdropperContracts.vesting.connect(setter).addMultipleVesters({
        _name: [name],
        _vester: [staker.address],
        _amount: [ethers.utils.parseEther('100')], // 111111372
        _percentInitialAmount: [50],
        _percentAmountPerWithdraw: [10],
        _percentBonus: [0],
      });

      await expect(airdropperContracts.vesting.connect(staker).bonus(name)).to.be.revertedWith(
        'Bonus is not unlocked yet'
      );

      await TestUtil.increaseTime(DAY * 21);

      await airdropperContracts.vesting.connect(staker).bonus(name);

      await expect(airdropperContracts.vesting.connect(staker).bonus(name)).to.be.revertedWith(
        'Bonus already withdrawn'
      );
    });
  });

  describe('Getters', async () => {
    const name1 = 'Vesting1';
    const name2 = 'Vesting2';
    const name3 = 'Vesting3';
    beforeEach(async () => {
      const startTime = Math.ceil(new Date().getTime() / 1000);

      await utilityContracts.swaptoken
        .connect(setter)
        .approve(airdropperContracts.vesting.address, ethers.utils.parseEther('100000'));

      await airdropperContracts.vesting
        .connect(setter)
        .addItem(
          utilityContracts.swaptoken.address,
          name1,
          ethers.utils.parseEther('5000'),
          startTime + DAY,
          DAY,
          DAY,
          startTime + DAY * 20,
          testSigner
        );

      await airdropperContracts.vesting
        .connect(setter)
        .addItem(
          utilityContracts.swaptoken.address,
          name2,
          ethers.utils.parseEther('5000'),
          startTime + DAY,
          DAY,
          DAY,
          startTime + DAY * 20,
          testSigner
        );
      await airdropperContracts.vesting
        .connect(setter)
        .addItem(
          utilityContracts.swaptoken.address,
          name3,
          ethers.utils.parseEther('5000'),
          startTime + DAY,
          DAY,
          DAY,
          startTime + DAY * 20,
          testSigner
        );

      await airdropperContracts.vesting.connect(setter).addMultipleVesters({
        _name: [name1],
        _vester: [staker.address],
        _amount: [ethers.utils.parseEther('100')], // 111111372
        _percentInitialAmount: [50],
        _percentAmountPerWithdraw: [10],
        _percentBonus: [0],
      });
      await airdropperContracts.vesting.connect(setter).addMultipleVesters({
        _name: [name2],
        _vester: [staker.address],
        _amount: [ethers.utils.parseEther('100')], // 111111372
        _percentInitialAmount: [50],
        _percentAmountPerWithdraw: [10],
        _percentBonus: [0],
      });
      await airdropperContracts.vesting.connect(setter).addMultipleVesters({
        _name: [name3],
        _vester: [staker.address],
        _amount: [ethers.utils.parseEther('100')], // 111111372
        _percentInitialAmount: [50],
        _percentAmountPerWithdraw: [10],
        _percentBonus: [0],
      });
    });

    it('should get items', async () => {
      const namesLength = await airdropperContracts.vesting.getNamesLength();
      const names = await airdropperContracts.vesting.getNames(0, namesLength.toNumber());
      const items = await airdropperContracts.vesting.getItems(0, namesLength.toNumber());
      const allItems = await airdropperContracts.vesting.getAllItems();

      expect(names.length).to.be.equal(namesLength);
      expect(items.length).to.be.equal(allItems.length);
    });

    it('should get user items', async () => {
      const userVestLength = await airdropperContracts.vesting.getUserVestsLength(staker.address);

      await airdropperContracts.vesting.getUserItems(staker.address, 0, userVestLength.toNumber());
    });
  });

  describe('signing vester', () => {
    const name = 'Vesting Of the day';
    beforeEach(async () => {
      await TestUtil.resetBlockTimestamp();
      const startTime = Math.ceil(new Date().getTime() / 1000);

      await utilityContracts.swaptoken
        .connect(setter)
        .approve(airdropperContracts.vesting.address, ethers.utils.parseEther('100000'));

      await airdropperContracts.vesting
        .connect(setter)
        .addItem(
          utilityContracts.swaptoken.address,
          name,
          ethers.utils.parseEther('5000'),
          startTime + DAY,
          DAY,
          DAY,
          startTime + DAY * 20,
          testSigner
        );
    });

    it('should not allow users to get messed up by managers', async () => {
      const testSignature = sign(
        testSigner,
        testSignerPriv,
        ['string', 'uint8', 'uint8', 'uint8', 'uint104', 'address'],
        [name, '101', '17', '20', ethers.utils.parseEther('100'), staker.address]
      );

      await TestUtil.increaseTime(DAY);
      await expect(
        airdropperContracts.vesting
          .connect(staker)
          .addVesterCryptography(
            testSignature,
            name,
            '101',
            '17',
            '20',
            ethers.utils.parseEther('100')
          )
      ).to.be.revertedWith('Exceeds allowed amount');
    });

    it('should sign and withdraw', async () => {
      const testSignature = sign(
        testSigner,
        testSignerPriv,
        ['string', 'uint8', 'uint8', 'uint8', 'uint104', 'address'],
        [name, '15', '17', '20', ethers.utils.parseEther('100'), staker.address]
      );

      await airdropperContracts.vesting
        .connect(staker)
        .addVesterCryptography(
          testSignature,
          name,
          '15',
          '17',
          '20',
          ethers.utils.parseEther('100')
        );

      const _record1 = await airdropperContracts.vesting.records(staker.address, name);
      expect(_record1.totalWithdrawn.toString()).to.be.equal('0');

      await expect(airdropperContracts.vesting.connect(staker).withdraw(name)).to.be.revertedWith(
        'Has not begun yet'
      );
      TestUtil.increaseTime(DAY * 1);
      await airdropperContracts.vesting.connect(staker).withdraw(name);
      await expect(airdropperContracts.vesting.connect(staker).withdraw(name)).to.be.revertedWith(
        'Withdrawal not allowed at this time'
      );
      TestUtil.increaseTime(DAY * 2);
      await airdropperContracts.vesting.connect(staker).withdraw(name);
      await expect(airdropperContracts.vesting.connect(staker).withdraw(name)).to.be.revertedWith(
        'No withdrawals to pay at this time'
      );

      TestUtil.increaseTime(DAY * 4);
      await airdropperContracts.vesting.connect(staker).withdraw(name);
      TestUtil.increaseTime(DAY * 5);

      await expect(airdropperContracts.vesting.connect(staker).withdraw(name)).to.be.revertedWith(
        'No withdrawals to pay at this time'
      );

      const record = await airdropperContracts.vesting
        .connect(staker)
        .records(staker.address, name);
      expect(record.amount.toString()).to.be.equal(record.totalWithdrawn.toString());
    });

    it('should withdraw on sign if start time has passed', async () => {
      const testSignatureWrong = sign(
        testSigner,
        testSignerPriv,
        ['string', 'uint8', 'uint8', 'uint8', 'uint104', 'address'],
        [name, '15', '18', '20', ethers.utils.parseEther('100'), staker.address]
      );
      await expect(
        airdropperContracts.vesting
          .connect(staker)
          .addVesterCryptography(
            testSignatureWrong,
            name,
            '15',
            '17',
            '20',
            ethers.utils.parseEther('100')
          )
      ).to.be.revertedWith('Record not found');

      const testSignature = sign(
        testSigner,
        testSignerPriv,
        ['string', 'uint8', 'uint8', 'uint8', 'uint104', 'address'],
        [name, '15', '17', '20', ethers.utils.parseEther('100'), staker.address]
      );

      await airdropperContracts.vesting
        .connect(staker)
        .addVesterCryptography(
          testSignature,
          name,
          '15',
          '17',
          '20',
          ethers.utils.parseEther('100')
        );
      TestUtil.increaseTime(DAY * 1);

      const _record = await airdropperContracts.vesting.records(staker.address, name);
      expect(_record.totalWithdrawn.toString()).to.equal('0');
    });
  });

  describe('edge cases', async () => {
    it('should not create an item that already exists', async () => {
      const name = 'test-name';
      const startTime = Math.ceil(new Date().getTime() / 1000);

      await utilityContracts.swaptoken
        .connect(setter)
        .approve(airdropperContracts.vesting.address, ethers.utils.parseEther('100000'));

      await airdropperContracts.vesting
        .connect(setter)
        .addItem(
          utilityContracts.swaptoken.address,
          name,
          ethers.utils.parseEther('5000'),
          startTime + DAY,
          DAY,
          DAY,
          startTime + DAY * 20,
          testSigner
        );

      await expect(
        airdropperContracts.vesting
          .connect(setter)
          .addItem(
            utilityContracts.swaptoken.address,
            name,
            ethers.utils.parseEther('5000'),
            startTime + DAY,
            DAY,
            DAY,
            startTime + DAY * 20,
            testSigner
          )
      ).to.be.revertedWith('Item already exists');
    });

    it('should not create addVester for item that DNE', async () => {
      const name = 'test-name';

      await expect(
        airdropperContracts.vesting.connect(setter).addMultipleVesters({
          _name: [name],
          _vester: [staker.address],
          _amount: [ethers.utils.parseEther('100')], // 111111372
          _percentInitialAmount: [50],
          _percentAmountPerWithdraw: [10],
          _percentBonus: [0],
        })
      ).to.be.revertedWith('Item does not exist');
    });

    it('should not create a record for an item that DNE', async () => {
      const name = 'test-name';
      const testSignature = sign(
        testSigner,
        testSignerPriv,
        ['string', 'uint8', 'uint8', 'uint8', 'uint104', 'address'],
        [name, '15', '17', '20', ethers.utils.parseEther('100'), staker.address]
      );

      await expect(
        airdropperContracts.vesting
          .connect(staker)
          .addVesterCryptography(
            testSignature,
            name,
            '15',
            '17',
            '20',
            ethers.utils.parseEther('100')
          )
      ).to.be.revertedWith('Record not found');
    });

    it('should not try to create a second record', async () => {
      const name = 'test-name';
      const startTime = Math.ceil(new Date().getTime() / 1000);

      await utilityContracts.swaptoken
        .connect(setter)
        .approve(airdropperContracts.vesting.address, ethers.utils.parseEther('100000'));

      await airdropperContracts.vesting
        .connect(setter)
        .addItem(
          utilityContracts.swaptoken.address,
          name,
          ethers.utils.parseEther('5000'),
          startTime + DAY,
          DAY,
          DAY,
          startTime + DAY * 20,
          testSigner
        );

      const testSignature = sign(
        testSigner,
        testSignerPriv,
        ['string', 'uint8', 'uint8', 'uint8', 'uint104', 'address'],
        [name, '15', '17', '20', ethers.utils.parseEther('100'), staker.address]
      );

      await airdropperContracts.vesting
        .connect(staker)
        .addVesterCryptography(
          testSignature,
          name,
          '15',
          '17',
          '20',
          ethers.utils.parseEther('100')
        );

      await expect(
        airdropperContracts.vesting
          .connect(staker)
          .addVesterCryptography(
            testSignature,
            name,
            '15',
            '17',
            '20',
            ethers.utils.parseEther('100')
          )
      ).to.be.revertedWith('Record already exists');
    });

    it.only('should allow 100 initial percent', async () => {
      const name = 'test-name';
      const startTime = Math.ceil(new Date().getTime() / 1000) - DAY;

      await utilityContracts.swaptoken
        .connect(setter)
        .approve(airdropperContracts.vesting.address, ethers.utils.parseEther('100000'));

      await airdropperContracts.vesting
        .connect(setter)
        .addItem(
          utilityContracts.swaptoken.address,
          name,
          ethers.utils.parseEther('5000'),
          startTime,
          DAY,
          DAY,
          startTime + DAY * 20,
          testSigner
        );

      const testSignature = sign(
        testSigner,
        testSignerPriv,
        ['string', 'uint8', 'uint8', 'uint8', 'uint104', 'address'],
        [name, '100', '0', '20', ethers.utils.parseEther('100'), staker.address]
      );

      await airdropperContracts.vesting
        .connect(staker)
        .addVesterCryptography(
          testSignature,
          name,
          '100',
          '0',
          '20',
          ethers.utils.parseEther('100')
        );

      await expect(airdropperContracts.vesting.connect(staker).withdraw(name)).to.be.revertedWith(
        'No withdrawals to pay at this time'
      );
    });
  });
});
