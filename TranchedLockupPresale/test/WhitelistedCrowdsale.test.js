import ether from './helpers/ether';
import latestTime from './helpers/latestTime';
import { increaseTimeTo, duration } from './helpers/increaseTime';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .should();

const TranchedLockupPresale = artifacts.require('TranchedLockupPresale');
const CustomToken = artifacts.require('CustomToken');

contract('TranchedLockupPresale_Whitelisted', function ([account1, wallet, authorized, unauthorized, anotherAuthorized]) {
  const rate = 1200;
  const value = ether(3);
  const tokenSupply = new BigNumber('1e26');
  const firstVestedLockUpAmount = new web3.BigNumber(4000e18);
  const gradedVestedLockUpAmounts = new web3.BigNumber(2000e18);

  describe('as a whitelisted token sale', function () {

    describe('single user whitelisting', function () {
      beforeEach(async function () {
        await increaseTimeTo(latestTime());
        this.openingTime = latestTime() + duration.minutes(10);
        this.closingTime = this.openingTime + duration.weeks(1);
        this.lockupEndTime = [this.closingTime + duration.weeks(1), this.closingTime + duration.weeks(2), this.closingTime + duration.weeks(3), this.closingTime + duration.weeks(4), this.closingTime + duration.weeks(5), this.closingTime + duration.weeks(6)];
        this.token = await CustomToken.new();
        this.crowdsale = await TranchedLockupPresale.new(this.openingTime, this.closingTime, rate, wallet, this.lockupEndTime, firstVestedLockUpAmount, gradedVestedLockUpAmounts, this.token.address);
        await this.token.mint(this.crowdsale.address, tokenSupply);
        await this.crowdsale.addToWhitelist(authorized);
        await increaseTimeTo(this.openingTime);

      });

      describe('accepting payments', function () {
        it('should accept payments to whitelisted (from whichever buyers)', async function () {
          await this.crowdsale.buyTokens(authorized, { value: value, from: authorized }).should.be.fulfilled;
          await this.crowdsale.buyTokens(authorized, { value: value, from: unauthorized }).should.be.fulfilled;
        });

        it('should reject payments to not whitelisted (from whichever buyers)', async function () {
          await this.crowdsale.send(value).should.be.rejected;
          await this.crowdsale.buyTokens(unauthorized, { value: value, from: unauthorized }).should.be.rejected;
          await this.crowdsale.buyTokens(unauthorized, { value: value, from: authorized }).should.be.rejected;
        });

        it('should reject payments to addresses removed from whitelist', async function () {
          await this.crowdsale.removeFromWhitelist(authorized);
          await this.crowdsale.buyTokens(authorized, { value: value, from: authorized }).should.be.rejected;
        });
      });

      describe('reporting whitelisted', function () {
        it('should correctly report whitelisted addresses', async function () {
          let isAuthorized = await this.crowdsale.whitelist(authorized);
          isAuthorized.should.equal(true);
          let isntAuthorized = await this.crowdsale.whitelist(unauthorized);
          isntAuthorized.should.equal(false);
        });
      });
    });

    describe('many user whitelisting', function () {
      beforeEach(async function () {
        this.openingTime = latestTime() + duration.seconds(10);
        this.closingTime = this.openingTime + duration.weeks(1);
        this.token = await CustomToken.new();
        this.lockupEndTime = [this.closingTime + duration.weeks(1), this.closingTime + duration.weeks(2), this.closingTime + duration.weeks(3), this.closingTime + duration.weeks(4), this.closingTime + duration.weeks(5), this.closingTime + duration.weeks(6)];
        this.crowdsale = await TranchedLockupPresale.new(this.openingTime, this.closingTime, rate, wallet, this.lockupEndTime, firstVestedLockUpAmount, gradedVestedLockUpAmounts, this.token.address);

        await this.token.mint(this.crowdsale.address, tokenSupply);

        await this.crowdsale.addManyToWhitelist([authorized, anotherAuthorized]);
        await increaseTimeTo(this.openingTime);

      });

      describe('accepting payments', function () {
        it('should accept payments to whitelisted (from whichever buyers)', async function () {
          await this.crowdsale.buyTokens(authorized, { value: value, from: authorized }).should.be.fulfilled;
          await this.crowdsale.buyTokens(authorized, { value: value, from: unauthorized }).should.be.fulfilled;
          await this.crowdsale.buyTokens(anotherAuthorized, { value: value, from: authorized }).should.be.fulfilled;
          await this.crowdsale.buyTokens(anotherAuthorized, { value: value, from: unauthorized }).should.be.fulfilled;
        });

        it('should reject payments to not whitelisted (with whichever buyers)', async function () {
          await this.crowdsale.send(value).should.be.rejected;
          await this.crowdsale.buyTokens(unauthorized, { value: value, from: unauthorized }).should.be.rejected;
          await this.crowdsale.buyTokens(unauthorized, { value: value, from: authorized }).should.be.rejected;
        });

        it('should reject payments to addresses removed from whitelist', async function () {
          await this.crowdsale.removeFromWhitelist(anotherAuthorized);
          await this.crowdsale.buyTokens(authorized, { value: value, from: authorized }).should.be.fulfilled;
          await this.crowdsale.buyTokens(anotherAuthorized, { value: value, from: authorized }).should.be.rejected;
        });
      });

      describe('reporting whitelisted', function () {
        it('should correctly report whitelisted addresses', async function () {
          let isAuthorized = await this.crowdsale.whitelist(authorized);
          isAuthorized.should.equal(true);
          let isAnotherAuthorized = await this.crowdsale.whitelist(anotherAuthorized);
          isAnotherAuthorized.should.equal(true);
          let isntAuthorized = await this.crowdsale.whitelist(unauthorized);
          isntAuthorized.should.equal(false);
        });
      });
    });
  });
});
