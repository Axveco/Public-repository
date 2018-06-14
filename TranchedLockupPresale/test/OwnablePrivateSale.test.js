import ether from './helpers/ether';
import { increaseTimeTo, duration } from './helpers/increaseTime';
import latestTime from './helpers/latestTime';

const BigNumber = web3.BigNumber;


import assertRevert from './helpers/assertRevert';

const TranchedLockupPresale = artifacts.require('TranchedLockupPresale');
const CustomToken = artifacts.require('CustomToken');

contract('TranchedLockupPresale_Ownable', function (accounts) {
  let ownable;
  const rate = 120000;
  const value = ether(1);
  const tokenSupply = new BigNumber('1e10');
  const firstVestedLockUpAmount = new web3.BigNumber(4000e18);
  const gradedVestedLockUpAmounts = new web3.BigNumber(2000e18);

  beforeEach(async function () {
    await increaseTimeTo(latestTime());
    this.openingTime = latestTime() + duration.weeks(1);
    this.closingTime = this.openingTime + duration.weeks(1);
    this.afterClosingTime = this.closingTime + duration.seconds(1);
    this.lockupEndTime = [this.closingTime + duration.weeks(1), this.closingTime + duration.weeks(2), this.closingTime + duration.weeks(3), this.closingTime + duration.weeks(4), this.closingTime + duration.weeks(5), this.closingTime + duration.weeks(6)];
    this.token = await CustomToken.new();
    ownable = await TranchedLockupPresale.new(this.openingTime, this.closingTime, rate, accounts[3], this.lockupEndTime, firstVestedLockUpAmount, gradedVestedLockUpAmounts,  this.token.address);

  });

  it('should have an owner', async function () {
    let owner = await ownable.owner();
    assert.isTrue(owner !== 0);
  });

  it('changes owner after transfer', async function () {
    let other = accounts[1];
    await ownable.transferOwnership(other);
    let owner = await ownable.owner();

    assert.isTrue(owner === other);
  });

  it('should prevent non-owners from transfering', async function () {
    const other = accounts[2];
    const owner = await ownable.owner.call();
    assert.isTrue(owner !== other);
    await assertRevert(ownable.transferOwnership(other, { from: other }));
  });

  it('should guard ownership against stuck state', async function () {
    let originalOwner = await ownable.owner();
    await assertRevert(ownable.transferOwnership(null, { from: originalOwner }));
  });
});
