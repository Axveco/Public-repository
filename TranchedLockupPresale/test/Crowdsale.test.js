import ether from './helpers/ether';
import latestTime from './helpers/latestTime';
import { increaseTimeTo, duration } from './helpers/increaseTime';

const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const CustomToken = artifacts.require('Customtoken');
const TranchedLockupPresale = artifacts.require('TranchedLockupPresale');

contract('TranchedLockupPresale_Crowdsale', function ([account1, investor, wallet, purchaser]) {
  const rate = 1200;
  const value = ether(3);
  const tokenSupplyEther = 12;
  const tokenSupply = new BigNumber(rate*ether(tokenSupplyEther));
  const firstVestedLockUpAmount = new web3.BigNumber(4000e18);
  const gradedVestedLockUpAmounts = new web3.BigNumber(2000e18);

  const expectedTokenAmount = (rate * value);

  beforeEach(async function () {
    await increaseTimeTo(latestTime());
    this.openingTime = latestTime() + duration.minutes(10);
    this.closingTime = this.openingTime + duration.weeks(1);
    this.lockupEndTime = [this.closingTime + duration.weeks(1), this.closingTime + duration.weeks(2), this.closingTime + duration.weeks(3), this.closingTime + duration.weeks(4), this.closingTime + duration.weeks(5), this.closingTime + duration.weeks(6)];

    this.token = await CustomToken.new();
    this.crowdsale = await TranchedLockupPresale.new(this.openingTime, this.closingTime, rate, wallet, this.lockupEndTime, firstVestedLockUpAmount, gradedVestedLockUpAmounts, this.token.address);
    await this.token.mint(this.crowdsale.address, tokenSupply);
    await this.crowdsale.addToWhitelist(investor);
    await this.crowdsale.addToWhitelist(account1);
    await increaseTimeTo(this.openingTime);

  });

  describe('accepting payments', function () {
    it('should accept payments', async function () {
      await this.crowdsale.send(value).should.be.fulfilled;
      await this.crowdsale.buyTokens(investor, { value: value, from: purchaser }).should.be.fulfilled;
    });
  });

  describe('high-level purchase', function () {
    it('should log purchase', async function () {
      const { logs } = await this.crowdsale.sendTransaction({ value: value, from: investor });
      const event = logs.find(e => e.event === 'TokenPurchase');
      should.exist(event);
      event.args.purchaser.should.equal(investor);
      event.args.beneficiary.should.equal(investor);
      event.args.value.should.be.bignumber.equal(value);
      event.args.amount.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should assign tokens to sender', async function () {
      await this.crowdsale.sendTransaction({ value: value, from: investor });

      await increaseTimeTo(this.lockupEndTime[0] + duration.hours(1));
      await this.crowdsale.withdrawTokens({ from: investor });

      let balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should forward funds to wallet', async function () {
      const pre = web3.eth.getBalance(wallet);
      await this.crowdsale.sendTransaction({ value, from: investor });
      const post = web3.eth.getBalance(wallet);
      post.minus(pre).should.be.bignumber.equal(value);
    });

    it('should update tokensSold after buying tokens', async function () {
      let tokensSold = await this.crowdsale.tokensStillInLockup();
      tokensSold.should.be.bignumber.equal(0);

      await this.crowdsale.sendTransaction({ value, from: investor });

      tokensSold = await this.crowdsale.tokensStillInLockup();
      tokensSold.should.be.bignumber.equal(value*rate);

    });


    it('should prevent buying more tokens than available', async function () {
      let tokensSold = await this.crowdsale.tokensStillInLockup();
      tokensSold.should.be.bignumber.equal(0);

      //first buy max investment
      await this.crowdsale.sendTransaction({ value: ether(tokenSupplyEther-2), from: account1 });
      let balance_account1 = await this.crowdsale.balances(account1);
      balance_account1.should.be.bignumber.equal(rate*ether(tokenSupplyEther-2));

      tokensSold = await this.crowdsale.tokensStillInLockup();
      tokensSold.should.be.bignumber.equal((rate*ether(tokenSupplyEther-2)));

      //then buy till total supply
      await this.crowdsale.sendTransaction({ value: ether(2), from: investor });

      let balance_investor = await this.crowdsale.balances(investor);
      balance_investor.should.be.bignumber.equal(rate*ether(2));

      tokensSold = await this.crowdsale.tokensStillInLockup();
      tokensSold.should.be.bignumber.equal((rate*ether(tokenSupplyEther)));

      //then try to buy more total supply
      await this.crowdsale.sendTransaction({ value: ether(1), from: investor }).should.be.rejected;
      await this.crowdsale.sendTransaction({ value: ether(1), from: account1 }).should.be.rejected;

      let balance = await this.crowdsale.balances(investor);
      balance.should.be.bignumber.equal(balance_investor);

      balance = await this.crowdsale.balances(account1);
      balance.should.be.bignumber.equal(balance_account1);

    });

  });

  describe('low-level purchase', function () {
    it('should log purchase', async function () {
      const { logs } = await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
      const event = logs.find(e => e.event === 'TokenPurchase');
      should.exist(event);
      event.args.purchaser.should.equal(purchaser);
      event.args.beneficiary.should.equal(investor);
      event.args.value.should.be.bignumber.equal(value);
      event.args.amount.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should assign tokens to beneficiary', async function () {
      await this.crowdsale.buyTokens(investor, { value, from: purchaser });
      await increaseTimeTo(this.lockupEndTime[0]+ duration.hours(1));
      await this.crowdsale.withdrawTokens({ from: investor });

      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokenAmount);
    });

    it('should forward funds to wallet', async function () {
      const pre = web3.eth.getBalance(wallet);
      await this.crowdsale.buyTokens(investor, { value, from: purchaser });
      const post = web3.eth.getBalance(wallet);
      post.minus(pre).should.be.bignumber.equal(value);
    });

    it('should prevent buying more tokens than available', async function () {
      let tokensSold = await this.crowdsale.tokensStillInLockup();
      tokensSold.should.be.bignumber.equal(0);

      //first buy max investment
      await this.crowdsale.buyTokens(account1, { value: ether(tokenSupplyEther-2), from: account1 });
//      await this.crowdsale.buyTokens(account1, { value: ether(tokenSupplyEther-2), from: account1 });
      let balance_account1 = await this.crowdsale.balances(account1);
      balance_account1.should.be.bignumber.equal(rate*ether(tokenSupplyEther-2));

      tokensSold = await this.crowdsale.tokensStillInLockup();
      tokensSold.should.be.bignumber.equal((rate*ether(tokenSupplyEther-2)));

      //then buy till total supply
      await this.crowdsale.buyTokens(investor, { value: ether(2), from: purchaser });
      let balance_investor = await this.crowdsale.balances(investor);
      balance_investor.should.be.bignumber.equal(rate*ether(2));

      tokensSold = await this.crowdsale.tokensStillInLockup();
      tokensSold.should.be.bignumber.equal((rate*ether(tokenSupplyEther)));

      //then try to buy more total supply
      await this.crowdsale.buyTokens(investor, { value: ether(1), from: purchaser }).should.be.rejected;
      await this.crowdsale.buyTokens(account1, { value: ether(1), from: purchaser }).should.be.rejected;

      let balance = await this.crowdsale.balances(investor);
      balance.should.be.bignumber.equal(balance_investor);

      balance = await this.crowdsale.balances(account1);
      balance.should.be.bignumber.equal(balance_account1);

    });


  });
});
