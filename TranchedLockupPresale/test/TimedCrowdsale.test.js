import ether from './helpers/ether';
import { advanceBlock } from './helpers/advanceToBlock';
import { increaseTimeTo, duration } from './helpers/increaseTime';
import latestTime from './helpers/latestTime';
import EVMRevert from './helpers/EVMRevert';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const TranchedLockupPresale = artifacts.require('TranchedLockupPresale');
const CustomToken = artifacts.require('CustomToken');

contract('TranchedLockupPresale_Timed', function ([account1, investor, wallet, purchaser]) {
  const rate = 1200;
  const value = ether(3);
  const tokenSupply = new BigNumber('1e26');
  const firstVestedLockUpAmount = new web3.BigNumber(4000e18);
  const gradedVestedLockUpAmounts = new web3.BigNumber(2000e18);

  describe('as a timed constraint token sale', function () {

    before(async function () {
      // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
      await advanceBlock();
    });

    beforeEach(async function () {
      await increaseTimeTo(latestTime());
      this.openingTime = latestTime() + duration.weeks(1);
      this.closingTime = this.openingTime + duration.weeks(1);
      this.afterClosingTime = this.closingTime + duration.seconds(1);
      this.lockupEndTime = [this.closingTime + duration.weeks(1), this.closingTime + duration.weeks(2), this.closingTime + duration.weeks(3), this.closingTime + duration.weeks(4), this.closingTime + duration.weeks(5), this.closingTime + duration.weeks(6)];
      this.token = await CustomToken.new();
      this.crowdsale = await TranchedLockupPresale.new(this.openingTime, this.closingTime, rate, wallet, this.lockupEndTime, firstVestedLockUpAmount, gradedVestedLockUpAmounts, this.token.address);
      await this.token.mint(this.crowdsale.address, tokenSupply);
      await this.crowdsale.addToWhitelist(account1);
      await this.crowdsale.addToWhitelist(investor);

    });

    it('should be ended only after end', async function () {
      let ended = await this.crowdsale.hasClosed();
      ended.should.equal(false);
      await increaseTimeTo(this.afterClosingTime);
      ended = await this.crowdsale.hasClosed();
      ended.should.equal(true);
    });

    describe('accepting payments', function () {
      it('should reject payments before start', async function () {
        await this.crowdsale.send(value).should.be.rejectedWith(EVMRevert);
        await this.crowdsale.buyTokens(investor, { from: purchaser, value: value }).should.be.rejectedWith(EVMRevert);
      });

      it('should accept payments after start', async function () {
        await increaseTimeTo(this.openingTime);
        await this.crowdsale.send(value, { from: investor}).should.be.fulfilled;
        await this.crowdsale.buyTokens(investor, { value: value, from: purchaser }).should.be.fulfilled;

      });

      it('should reject payments after end', async function () {
        await increaseTimeTo(this.afterClosingTime);
        await this.crowdsale.send(value).should.be.rejectedWith(EVMRevert);
        await this.crowdsale.buyTokens(investor, { value: value, from: purchaser }).should.be.rejectedWith(EVMRevert);
      });
    });
  });
});
