import ether from './helpers/ether';
import latestTime from './helpers/latestTime';
import { increaseTimeTo, duration } from './helpers/increaseTime';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const TranchedLockupPresale = artifacts.require('TranchedLockupPresale');
const CustomToken = artifacts.require('CustomToken');

contract('TranchedLockupPresale', function ([account1, wallet, authorized, non_owner, beneficiary]) {
  const rate = 1200;
  const value = ether(3);
  const tokenSupply = new BigNumber('1e26');
  const firstVestedLockUpAmount = new web3.BigNumber(10000e18);
  const gradedVestedLockUpAmounts = new web3.BigNumber(15000e18);

  describe('as the private sale contract', function () {
    beforeEach(async function () {
      await increaseTimeTo(latestTime());
      this.openingTime = latestTime() + duration.minutes(10);
      this.closingTime = this.openingTime + duration.weeks(1);
      this.lockupEndTime = [this.closingTime + duration.weeks(1), this.closingTime + duration.weeks(2), this.closingTime + duration.weeks(3), this.closingTime + duration.weeks(4), this.closingTime + duration.weeks(5), this.closingTime + duration.weeks(6)];

      this.token = await CustomToken.new();
      this.crowdsale = await TranchedLockupPresale.new(this.openingTime, this.closingTime, rate, wallet, this.lockupEndTime, firstVestedLockUpAmount, gradedVestedLockUpAmounts, this.token.address);
      await this.token.mint(this.crowdsale.address, tokenSupply);
      await this.crowdsale.addToWhitelist(authorized);
      await this.crowdsale.addToWhitelist(account1);

    });

    describe('changing rate', function () {
      it('should accept change of rate up by owner', async function () {
        const new_rate = 1300; // less than 10% increase
        const up = true;
        const unsafe = false;

        await this.crowdsale._changeRate(new_rate, up, unsafe).should.be.fulfilled;
        let set_new_rate = await this.crowdsale.rate.call();
        set_new_rate.should.be.bignumber.equal(new_rate);
      });

      it('should accept change of rate down by owner', async function () {
          const new_rate = 1100; // less than 10% decrease
          const up = false;
          const unsafe = false;

          await this.crowdsale._changeRate(new_rate, up, unsafe).should.be.fulfilled;
          let set_new_rate = await this.crowdsale.rate.call();
          set_new_rate.should.be.bignumber.equal(new_rate);
        });

      it('should accept an unsafe change of rate up by owner', async function () {
          const new_rate = 1500; // much more than 10% increase
          const up = true;
          const unsafe = true;

          await this.crowdsale._changeRate(new_rate, up, unsafe).should.be.fulfilled;
          let set_new_rate = await this.crowdsale.rate.call();
          set_new_rate.should.be.bignumber.equal(new_rate);
        });

        it('should accept an unsafe change of rate down by owner', async function () {
          const new_rate = 900; // much more than 10% decrease
          const up = false;
          const unsafe = true;

          await this.crowdsale._changeRate(new_rate, up, unsafe).should.be.fulfilled;
          let set_new_rate = await this.crowdsale.rate.call();
          set_new_rate.should.be.bignumber.equal(new_rate);
        });

        it('should accept an change of rate up by the owner that is just at the border', async function () {
          const new_rate = 1320; // 10% increase
          const up = true;
          const unsafe = false;

          await this.crowdsale._changeRate(new_rate, up, unsafe).should.be.fulfilled;
          let set_new_rate = await this.crowdsale.rate.call();
          set_new_rate.should.be.bignumber.equal(new_rate);
        });

        it('should accept an change of rate down by the owner that is just at the border', async function () {
          const new_rate = 1080; // 10% decrease
          const up = false;
          const unsafe = false;

          await this.crowdsale._changeRate(new_rate, up, unsafe).should.be.fulfilled;
          let set_new_rate = await this.crowdsale.rate.call();
          set_new_rate.should.be.bignumber.equal(new_rate);
        });

        it('should reject a change of rate up by the owner that is just over the border', async function () {
          const new_rate = 1321; // more than a 10% increase
          const up = true;
          const unsafe = false;

          await this.crowdsale._changeRate(new_rate, up, unsafe).should.be.rejected;
          let set_new_rate = await this.crowdsale.rate.call();
          set_new_rate.should.be.bignumber.equal(1200);
        });

        it('should reject a change of rate down by the owner that is just over the border', async function () {
          const new_rate = 1079; // more than a 10% decrease
          const up = false;
          const unsafe = false;

          await this.crowdsale._changeRate(new_rate, up, unsafe).should.be.rejected;
          let set_new_rate = await this.crowdsale.rate.call();
          set_new_rate.should.be.bignumber.equal(1200);
        });

      it('should reject change of rate by other accounts', async function () {
        const new_rate = 1300;
        const up = false;
        const unsafe = false;
        await this.crowdsale._changeRate(new_rate, up, unsafe, { from: non_owner }).should.be.rejected;
        let set_new_rate = await this.crowdsale.rate.call();
        set_new_rate.should.be.bignumber.equal(rate);
      });

      it('should reject change of rate to 0', async function () {
        const new_rate = 0;
        const up = false;
        const unsafe = true;
        await this.crowdsale._changeRate(new_rate, up, unsafe).should.be.rejected;
        let set_new_rate = await this.crowdsale.rate.call();
        set_new_rate.should.be.bignumber.equal(rate);
      });

    });

    describe('transfering unsold tokens', function () {
      it('should accept transfering unsold tokens by owner after sale has closed', async function () {
        await increaseTimeTo(this.closingTime + duration.seconds(1));
        const balance_unsold = await this.token.balanceOf(this.crowdsale.address);
        const balance_wallet = await this.token.balanceOf(wallet);
        await this.crowdsale.TransferUnsoldTokensBackToTokenContract(wallet).should.be.fulfilled;
        const balance = await this.token.balanceOf(this.crowdsale.address);
        const balance_wallet_refunded = await this.token.balanceOf(wallet);
        balance.should.be.bignumber.equal(0);
        balance_wallet_refunded.should.be.bignumber.equal(balance_unsold.plus(balance_wallet));
      });

      it('should reject transfering unsold tokens by owner before sale has closed', async function () {
        await increaseTimeTo(this.openingTime);
        const balance_unsold = await this.token.balanceOf(this.crowdsale.address);
        const balance_wallet = await this.token.balanceOf(wallet);
        await this.crowdsale.TransferUnsoldTokensBackToTokenContract(wallet).should.be.rejected;
        const balance = await this.token.balanceOf(this.crowdsale.address);
        const balance_wallet_refunded = await this.token.balanceOf(wallet);
        balance.should.be.bignumber.equal(balance_unsold);
        balance_wallet_refunded.should.be.bignumber.equal(balance_wallet);
      });

      it('should reject transfering unsold tokens by other account', async function () {
        await increaseTimeTo(this.closingTime + duration.seconds(1));
        const balance_unsold = await this.token.balanceOf(this.crowdsale.address);
        const balance_wallet = await this.token.balanceOf(wallet);
        await this.crowdsale.TransferUnsoldTokensBackToTokenContract(wallet, { from: non_owner }).should.be.rejected;
        const balance = await this.token.balanceOf(this.crowdsale.address);
        const balance_wallet_refunded = await this.token.balanceOf(wallet);
        balance.should.be.bignumber.equal(balance_unsold);
        balance_wallet_refunded.should.be.bignumber.equal(balance_wallet);
      });

      it('should transfer unsold tokens (and keep sold tokens in contract for withdrawal) after sale has closed', async function () {
        let balance_wallet = await this.token.balanceOf(wallet);
        await increaseTimeTo(this.openingTime);

        //buy tokens
        const ethersInvested = 3;
        await this.crowdsale.sendTransaction({ value: ether(ethersInvested), from: authorized });
        let tokensSold = await this.crowdsale.tokensStillInLockup();
        tokensSold.should.be.bignumber.equal(ether(ethersInvested) * rate);

        //after closing, transfer unsold(!) tokens and check the amounts
        await increaseTimeTo(this.closingTime + duration.seconds(1));
        await this.crowdsale.TransferUnsoldTokensBackToTokenContract(wallet);
        let balance_walletInclUnsold = await this.token.balanceOf(wallet);
        balance_walletInclUnsold.should.be.bignumber.equal(balance_wallet.plus(tokenSupply).plus(-tokensSold));
        let balance_tokensale = await this.token.balanceOf(this.crowdsale.address);
        balance_tokensale.should.be.bignumber.equal(tokensSold);

        //after first lock-up has ended, withdrawal bought tokens
        await increaseTimeTo(this.lockupEndTime[0] + duration.seconds(1));
        await this.crowdsale.withdrawTokens({ from: authorized }).should.be.fulfilled;
        let balance_investor = await this.token.balanceOf(authorized);
        balance_investor.should.be.bignumber.equal(ether(ethersInvested) * rate);

      });

      it('should transfer unsold tokens after tokens have been withdrawn by investers', async function () {
        let balance_wallet = await this.token.balanceOf(wallet);
        await increaseTimeTo(this.openingTime);

        //buy tokens
        const ethersInvested = 3;
        await this.crowdsale.sendTransaction({ value: ether(ethersInvested), from: authorized });
        let tokensSold = await this.crowdsale.tokensStillInLockup();
        tokensSold.should.be.bignumber.equal(ether(ethersInvested) * rate);

        //after lock-up has ended, withdrawal bought tokens
        await increaseTimeTo(this.lockupEndTime[0] + duration.seconds(1));
        await this.crowdsale.withdrawTokens({ from: authorized }).should.be.fulfilled;
        let balance_investor = await this.token.balanceOf(authorized);
        balance_investor.should.be.bignumber.equal(ether(ethersInvested) * rate);

        //withdrawn tokens are removed from amount of tokens is lock-up
        let tokensStillInLockup = await this.crowdsale.tokensStillInLockup();
        tokensStillInLockup.should.be.bignumber.equal(0);

        //after closing, transfer unsold(!) tokens and check the amounts
        await this.crowdsale.TransferUnsoldTokensBackToTokenContract(wallet);
        let balance_walletInclUnsold = await this.token.balanceOf(wallet);
        balance_walletInclUnsold.should.be.bignumber.equal(balance_wallet.plus(tokenSupply).plus(-tokensSold));
        let balance_tokensale = await this.token.balanceOf(this.crowdsale.address);
        balance_tokensale.should.be.bignumber.equal(tokensStillInLockup);


      });
    });

    describe('issuing tokens to investors paid with fiat', function () {
      it('should allow issuing of tokens by owner', async function () {
        await increaseTimeTo(this.openingTime);
        await this.crowdsale.IssueTokensToInvestors(beneficiary, ether(3)*rate, { from: account1 }).should.be.fulfilled;
      });

      it('should reject issuing of tokens by non owner', async function () {
        await increaseTimeTo(this.openingTime);
        await this.crowdsale.IssueTokensToInvestors(beneficiary, ether(3)*rate, { from: non_owner }).should.be.rejected;
      });

      it('should allow issuing of tokens when sale is open', async function () {
        await increaseTimeTo(this.openingTime);
        await this.crowdsale.IssueTokensToInvestors(beneficiary, ether(3)*rate, { from: account1 }).should.be.fulfilled;
      });

      it('should reject issuing of tokens before sale is open', async function () {
  //      await increaseTimeTo(this.closingTime + duration.minutes(1));
        await this.crowdsale.IssueTokensToInvestors(beneficiary, ether(3)*rate, { from: account1 }).should.be.rejected;
      });

      it('should reject issuing of tokens when sale is closed', async function () {
        await increaseTimeTo(this.closingTime + duration.minutes(1));
        await this.crowdsale.IssueTokensToInvestors(beneficiary, ether(3)*rate, { from: account1 }).should.be.rejected;
      });

      it('should allow issuing of tokens to beneficiary (whitelisted or not)', async function () {
        await increaseTimeTo(this.openingTime);
        await this.crowdsale.IssueTokensToInvestors(beneficiary, ether(3)*rate, { from: account1 }).should.be.fulfilled;
        await this.crowdsale.IssueTokensToInvestors(authorized, ether(3)*rate, { from: account1 }).should.be.fulfilled;
      });

      it('should lock-up issued tokens to beneficiary ', async function () {
        await increaseTimeTo(this.openingTime);
        await this.crowdsale.IssueTokensToInvestors(beneficiary, ether(3)*rate, { from: account1 }).should.be.fulfilled;

        let balance = await this.crowdsale.balances(beneficiary);
        balance.should.be.bignumber.equal(rate*ether(3));

        balance = await this.token.balanceOf(beneficiary);
        balance.should.be.bignumber.equal(0);
      });

      it('should count issued tokens to beneficiary as tokens sold', async function () {
        await increaseTimeTo(this.openingTime);
        await this.crowdsale.IssueTokensToInvestors(beneficiary, ether(3)*rate, { from: account1 }).should.be.fulfilled;

        let tokensSold = await this.crowdsale.tokensStillInLockup();
        tokensSold.should.be.bignumber.equal((rate*ether(3)));

      });

      it('should allow withdrawal of issued tokens to beneficiary after first lock-up period ended', async function () {
        await increaseTimeTo(this.openingTime);
        await this.crowdsale.IssueTokensToInvestors(beneficiary, ether(3)*rate, { from: account1 }).should.be.fulfilled;
        await this.crowdsale.withdrawTokens({ from: beneficiary }).should.be.rejected;

        await increaseTimeTo(this.lockupEndTime[0] + duration.minutes(1));
        await this.crowdsale.withdrawTokens({ from: beneficiary }).should.be.fulfilled;

        let balance = await this.crowdsale.balances(beneficiary);
        balance.should.be.bignumber.equal(0);

        balance = await this.token.balanceOf(beneficiary);
        balance.should.be.bignumber.equal(rate*ether(3));
      });


    });
  });

});
