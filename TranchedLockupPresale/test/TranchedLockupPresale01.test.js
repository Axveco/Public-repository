import ether from './helpers/ether';
import latestTime from './helpers/latestTime';
import { increaseTimeTo, duration } from './helpers/increaseTime';
import EVMRevert from './helpers/EVMRevert';
import { advanceBlock } from './helpers/advanceToBlock';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const TranchedLockupPresale = artifacts.require('TranchedLockupPresale');
const CustomToken = artifacts.require('CustomToken');

contract('TranchedLockupPresale_Lockup', function ([account1, wallet, investor, non_owner]) {
  const rate = 1000;
  const value = ether(3);
  const tokenSupply = new BigNumber('1e26');
  const firstVestedLockUpAmount = new web3.BigNumber(4000e18);
  const gradedVestedLockUpAmounts = new web3.BigNumber(2000e18);

  describe('as a sale with a token lock-up', function () {
    beforeEach(async function () {
      await increaseTimeTo(latestTime());
      this.openingTime = latestTime() + duration.minutes(10);
      this.closingTime = this.openingTime + duration.weeks(1);
      this.lockupEndTime = [this.closingTime + duration.weeks(1), this.closingTime + duration.weeks(2), this.closingTime + duration.weeks(3), this.closingTime + duration.weeks(4), this.closingTime + duration.weeks(5), this.closingTime + duration.weeks(6)];

      this.beforeLockupEndTime = this.lockupEndTime[0] - duration.hours(1);
      this.token = await CustomToken.new();
      this.crowdsale = await TranchedLockupPresale.new(this.openingTime, this.closingTime, rate, wallet, this.lockupEndTime, firstVestedLockUpAmount, gradedVestedLockUpAmounts, this.token.address);
      await this.token.mint(this.crowdsale.address, tokenSupply);
      await this.crowdsale.addToWhitelist(investor);
      await this.crowdsale.addToWhitelist(account1);

    });

    it('should not immediately assign tokens to beneficiary', async function () {
      await increaseTimeTo(this.openingTime);
      await this.crowdsale.buyTokens(investor, { value: value, from: investor });
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(0);
    });

    it('should not allow beneficiaries to withdraw tokens before first lockup ends', async function () {
      await increaseTimeTo(this.openingTime);
      await this.crowdsale.buyTokens(investor, { value: value, from: investor });
      await increaseTimeTo(this.beforeLockupEndTime);
      await this.crowdsale.withdrawTokens({ from: investor }).should.be.rejectedWith(EVMRevert);
    });

    it('should allow beneficiaries to withdraw tokens (first stage) after first lockup ends', async function () {
      await increaseTimeTo(this.openingTime);
      await this.crowdsale.buyTokens(investor, { value: value, from: investor });
      await increaseTimeTo(this.lockupEndTime[0] + duration.hours(1));
      await this.crowdsale.withdrawTokens({ from: investor }).should.be.fulfilled;
    });

    it('should return the amount of tokens bought', async function () {
      await increaseTimeTo(this.openingTime);
      await this.crowdsale.buyTokens(investor, { value: value, from: investor });
      await increaseTimeTo(this.lockupEndTime[0] + duration.hours(1));
      await this.crowdsale.withdrawTokens({ from: investor });
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(ether(3)*rate);
    });

    it('should allow beneficiaries to withdraw tokens according to vesting scheme (partial withdrawals)', async function () {
      const ethersInvested = 7;
      let valueHigh = ether(ethersInvested);

      await increaseTimeTo(this.openingTime);
      await this.crowdsale.buyTokens(investor, { value: valueHigh, from: investor });

      await increaseTimeTo(this.lockupEndTime[0] + duration.hours(1));
      await this.crowdsale.withdrawTokens({ from: investor }).should.be.fulfilled;
      let balance_investor = await this.token.balanceOf(investor);
      balance_investor.should.be.bignumber.equal(firstVestedLockUpAmount);
      let balance_contract = await this.crowdsale.balances(investor);
      balance_contract.should.be.bignumber.equal((ether(ethersInvested)*rate) - firstVestedLockUpAmount);

      await increaseTimeTo(this.lockupEndTime[1] + duration.hours(1));
      await this.crowdsale.withdrawTokens({ from: investor }).should.be.fulfilled;
      balance_investor = await this.token.balanceOf(investor);
      balance_investor.should.be.bignumber.equal(firstVestedLockUpAmount.plus(gradedVestedLockUpAmounts));
      balance_contract = await this.crowdsale.balances(investor);
      balance_contract.should.be.bignumber.equal((ether(ethersInvested)*rate) - firstVestedLockUpAmount - gradedVestedLockUpAmounts);

      await increaseTimeTo(this.lockupEndTime[2] + duration.hours(1));
      await this.crowdsale.withdrawTokens({ from: investor }).should.be.fulfilled;
      balance_investor = await this.token.balanceOf(investor);
      balance_investor.should.be.bignumber.equal(ether(ethersInvested)*rate);
      balance_contract = await this.crowdsale.balances(investor);
      balance_contract.should.be.bignumber.equal(0);

    });

    it('should allow beneficiaries to withdraw tokens according to vesting scheme (partial withdrawals, directly when lock-up stage ends)', async function () {
      const ethersInvested = 7;
      let valueHigh = ether(ethersInvested);

      await increaseTimeTo(this.openingTime);
      await this.crowdsale.buyTokens(investor, { value: valueHigh, from: investor });

      await increaseTimeTo(this.lockupEndTime[0]);
      await this.crowdsale.withdrawTokens({ from: investor }).should.be.fulfilled;
      let balance_investor = await this.token.balanceOf(investor);
      balance_investor.should.be.bignumber.equal(firstVestedLockUpAmount);
      let balance_contract = await this.crowdsale.balances(investor);
      balance_contract.should.be.bignumber.equal((ether(ethersInvested)*rate) - firstVestedLockUpAmount);

      await increaseTimeTo(this.lockupEndTime[1]);
      await this.crowdsale.withdrawTokens({ from: investor }).should.be.fulfilled;
      balance_investor = await this.token.balanceOf(investor);
      balance_investor.should.be.bignumber.equal(firstVestedLockUpAmount.plus(gradedVestedLockUpAmounts));
      balance_contract = await this.crowdsale.balances(investor);
      balance_contract.should.be.bignumber.equal((ether(ethersInvested)*rate) - firstVestedLockUpAmount - gradedVestedLockUpAmounts);

      await increaseTimeTo(this.lockupEndTime[2]);
      await this.crowdsale.withdrawTokens({ from: investor }).should.be.fulfilled;
      balance_investor = await this.token.balanceOf(investor);
      balance_investor.should.be.bignumber.equal(ether(ethersInvested)*rate);
      balance_contract = await this.crowdsale.balances(investor);
      balance_contract.should.be.bignumber.equal(0);

    });

    it('should not allow beneficiaries to withdraw more tokens according to vesting scheme (partial withdrawals, just a moment before lock-up stage ends)', async function () {
      const ethersInvested = 7;
      let valueHigh = ether(ethersInvested);

      await increaseTimeTo(this.openingTime);
      await this.crowdsale.buyTokens(investor, { value: valueHigh, from: investor });

      await increaseTimeTo(this.lockupEndTime[0] - duration.minutes(1));
      await this.crowdsale.withdrawTokens({ from: investor }).should.be.rejected;
      let balance_investor = await this.token.balanceOf(investor);
      balance_investor.should.be.bignumber.equal(0);
      let balance_contract = await this.crowdsale.balances(investor);
      balance_contract.should.be.bignumber.equal(ether(ethersInvested)*rate);

      await increaseTimeTo(this.lockupEndTime[1] - duration.minutes(1));
      await this.crowdsale.withdrawTokens({ from: investor }).should.be.fulfilled;
      balance_investor = await this.token.balanceOf(investor);
      balance_investor.should.be.bignumber.equal(firstVestedLockUpAmount);
      balance_contract = await this.crowdsale.balances(investor);
      balance_contract.should.be.bignumber.equal((ether(ethersInvested)*rate) - firstVestedLockUpAmount);

      await increaseTimeTo(this.lockupEndTime[2] - duration.minutes(1));
      await this.crowdsale.withdrawTokens({ from: investor }).should.be.fulfilled;
      balance_investor = await this.token.balanceOf(investor);
      balance_investor.should.be.bignumber.equal(firstVestedLockUpAmount.plus(gradedVestedLockUpAmounts));
      balance_contract = await this.crowdsale.balances(investor);
      balance_contract.should.be.bignumber.equal((ether(ethersInvested)*rate) - firstVestedLockUpAmount - gradedVestedLockUpAmounts);

      await increaseTimeTo(this.lockupEndTime[3] - duration.minutes(1));
      await this.crowdsale.withdrawTokens({ from: investor }).should.be.fulfilled;
      balance_investor = await this.token.balanceOf(investor);
      balance_investor.should.be.bignumber.equal(ether(ethersInvested)*rate);
      balance_contract = await this.crowdsale.balances(investor);
      balance_contract.should.be.bignumber.equal(0);

    });


    it('should allow beneficiaries to withdraw tokens according to vesting scheme (one withdrawal at the end)', async function () {
      const ethersInvested = 7;
      let valueHigh = ether(ethersInvested);

      await increaseTimeTo(this.openingTime);
      await this.crowdsale.buyTokens(investor, { value: valueHigh, from: investor });

      await increaseTimeTo(this.lockupEndTime[2] + duration.hours(1));
      await this.crowdsale.withdrawTokens({ from: investor }).should.be.fulfilled;

      let balance_investor = await this.token.balanceOf(investor);
      balance_investor.should.be.bignumber.equal(ether(ethersInvested)*rate);
      let balance_contract = await this.crowdsale.balances(investor);
      balance_contract.should.be.bignumber.equal(0);

    });

    it('should allow beneficiaries to withdraw large amount of tokens directly after last lock-up stage)', async function () {
      const ethersInvested = 15; // lock-up stages: 4 + 2 + 2 + 2 + 2 + 2 = 14
      let valueHigh = ether(ethersInvested);

      await increaseTimeTo(this.openingTime);
      await this.crowdsale.buyTokens(investor, { value: valueHigh, from: investor });

      await increaseTimeTo(this.lockupEndTime[5] + duration.hours(1));

      await this.crowdsale.withdrawTokens({ from: investor }).should.be.fulfilled;
      let balance_investor = await this.token.balanceOf(investor);
      balance_investor.should.be.bignumber.equal(ether(ethersInvested)*rate);
      let balance_contract = await this.crowdsale.balances(investor);
      balance_contract.should.be.bignumber.equal(0);

    });

    it('should allow beneficiaries to withdraw exact amount of tokens of first stage after lock-up ends)', async function () {
      const ethersInvested = 4; // lock-up stages: 4 + 2 + 2 + 2 + 2 + 2 = 14
      let valueHigh = ether(ethersInvested);

      await increaseTimeTo(this.openingTime);
      await this.crowdsale.buyTokens(investor, { value: valueHigh, from: investor });

      await increaseTimeTo(this.lockupEndTime[0]);

      await this.crowdsale.withdrawTokens({ from: investor }).should.be.fulfilled;
      let balance_investor = await this.token.balanceOf(investor);
      balance_investor.should.be.bignumber.equal(ether(ethersInvested)*rate);
      let balance_contract = await this.crowdsale.balances(investor);
      balance_contract.should.be.bignumber.equal(0);

    });

    it('should allow beneficiaries to withdraw exact amount of tokens of first 2 stages after lock-up ends (partial withdrawal))', async function () {
      const ethersFirst = 4; // lock-up stages: 4 + 2 + 2 + 2 + 2 + 2 = 14
      const ethersSecond = 2; // lock-up stages: 4 + 2 + 2 + 2 + 2 + 2 = 14
      let valueHigh = ether(ethersFirst + ethersSecond);

      await increaseTimeTo(this.openingTime);
      await this.crowdsale.buyTokens(investor, { value: valueHigh, from: investor });

      await increaseTimeTo(this.lockupEndTime[0]);

      await this.crowdsale.withdrawTokens({ from: investor }).should.be.fulfilled;
      let balance_investor = await this.token.balanceOf(investor);
      balance_investor.should.be.bignumber.equal(ether(ethersFirst)*rate);
      let balance_contract = await this.crowdsale.balances(investor);
      balance_contract.should.be.bignumber.equal(ether(ethersSecond)*rate);

      await increaseTimeTo(this.lockupEndTime[1]);

      await this.crowdsale.withdrawTokens({ from: investor }).should.be.fulfilled;
      balance_investor = await this.token.balanceOf(investor);
      balance_investor.should.be.bignumber.equal(ether(ethersFirst+ethersSecond)*rate);
      balance_contract = await this.crowdsale.balances(investor);
      balance_contract.should.be.bignumber.equal(0);

    });

  });

});
