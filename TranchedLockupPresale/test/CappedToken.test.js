
import expectThrow from './helpers/expectThrow';
import ether from './helpers/ether';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

var CustomToken = artifacts.require('CustomToken');

contract('CustomToken_Capped', function (accounts) {
  const cap = new BigNumber('145249999e18');
  let token;

  beforeEach(async function () {
    token = await CustomToken.new();
  });

  it('should start with the correct cap', async function () {
    let _cap = await token.cap();
    cap.should.be.bignumber.equal(_cap);
  });

  it('should mint when amount is less than cap', async function () {
    const result = await token.mint(accounts[0], 100);
    assert.equal(result.logs[0].event, 'Mint');
  });

  it('should fail to mint if the amount exceeds the cap', async function () {
    //await token.mint(accounts[0], cap-1);
    await expectThrow(token.mint(accounts[0], cap.plus(1)));
  });

  it('should fail to mint after cap is reached', async function () {
    await token.mint(accounts[0], cap);
    await expectThrow(token.mint(accounts[0], 1));
  });
});
