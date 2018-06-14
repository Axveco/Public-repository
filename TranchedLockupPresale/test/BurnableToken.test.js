import shouldBehaveLikeBurnableToken from './BurnableToken.behaviour';
const CustomToken = artifacts.require('CustomToken');

contract('CustomToken_Burnable', function (accounts) {
  const initialBalance = 1000;


  beforeEach(async function () {
    this.token = await CustomToken.new();
    const result = await this.token.mint(accounts[0], initialBalance);
  });

  shouldBehaveLikeBurnableToken(accounts[0], accounts[1], initialBalance);
});
