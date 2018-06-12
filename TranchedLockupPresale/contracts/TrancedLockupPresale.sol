pragma solidity ^0.4.24;

import "./CustomToken.sol";
import "./../node_modules/openzeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol";
import "./../node_modules/openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";

/*
  Token sale contract for the private sale
  This contract has time constraints and only whitelisted accounts can invest
  Tokens will not be issued to the investor immediately, but stored in this contract until the lock-up ends.
  When the lock-up has ended, investors can withdraw their tokens to their own account

  A staged lock-up is used with 6 grades:
    firstVestedLockUpAmount sit in lock-up until lockupEndTime[0]
    stagedVestedLockUpAmounts sit in lock-up until lockupEndTime[1]
    ...
    stagedVestedLockUpAmounts sit in lock-up until lockupEndTime[6]

  For example:
  When an investor buys 3,000,000 tokens:
      875,000 tokens in lock-up till Dec 31 2018
    1,000,000 tokens in lock-up till Jun 30 2018
    1,000,000 tokens in lock-up till Dec 31 2019
      125,000 tokens in lock-up till Jun 30 2019
*/
contract TranchedLockupPresale is TimedCrowdsale, WhitelistedCrowdsale  {
    using SafeMath for uint256;

    //Tokens sold (but locked in the contract)
    uint256 public tokensStillInLockup;

    //lock-up end time, 6 stages
    uint256[6] public lockupEndTime;

    //balances in the lock-ups
    mapping(address => uint256) public balances;

    //released from lock-ups
    mapping(address => uint256) public released;

    //vesting levels
    uint256 public firstVestedLockUpAmount;
    uint256 public stagedVestedLockUpAmounts;

    //constructor function
    //initializing lock-up periods and corresponding amounts of tokens
    constructor
        (
            uint256 _openingTime,
            uint256 _closingTime,
            uint256 _rate,
            address _wallet,
            uint256[6] _lockupEndTime,
            uint256 _firstVestedLockUpAmount,
            uint256 _stagedVestedLockUpAmounts,
            CustomToken _token
        )
        public
        Crowdsale(_rate, _wallet, _token)
        TimedCrowdsale(_openingTime, _closingTime)
        {
            // solium-disable-next-line security/no-block-members
            require(_lockupEndTime[0] >= block.timestamp);
            require(_lockupEndTime[1] >= _lockupEndTime[0]);
            require(_lockupEndTime[2] >= _lockupEndTime[1]);
            require(_lockupEndTime[3] >= _lockupEndTime[2]);
            require(_lockupEndTime[4] >= _lockupEndTime[3]);
            require(_lockupEndTime[5] >= _lockupEndTime[4]);

            lockupEndTime = _lockupEndTime;

            firstVestedLockUpAmount = _firstVestedLockUpAmount;
            stagedVestedLockUpAmounts = _stagedVestedLockUpAmounts;
        }


    //Overrides parent by storing balances instead of issuing tokens right away.
    // @param _beneficiary Token purchaser
    // @param _tokenAmount Amount of tokens purchased
    function _processPurchase(address _beneficiary, uint256 _tokenAmount) internal {

        uint256 newTokensSold = tokensStillInLockup.add(_tokenAmount);
        require(newTokensSold <= token.balanceOf(address(this)));
        tokensStillInLockup = newTokensSold;

        //add tokens to contract token balance (due to lock-up)
        balances[_beneficiary] = balances[_beneficiary].add(_tokenAmount);

    }

    //when sale has ended, send unsold tokens back to token contract
    // @param _beneficiary Token contract
    function TransferUnsoldTokensBackToTokenContract(address _beneficiary) public onlyOwner {

        require(hasClosed());
        uint256 unSoldTokens = token.balanceOf(address(this)).sub(tokensStillInLockup);

        token.transfer(_beneficiary, unSoldTokens);
    }

    //when sale isn't ended, issue tokens to investors paid with fiat currency
    // @param _beneficiary Token purchaser (with fiat)
    // @param _tokenAmount Amount of tokens purchased
    function IssueTokensToInvestors(address _beneficiary, uint256 _amount) public onlyOwner onlyWhileOpen{

        require(_beneficiary != address(0));
        _processPurchase(_beneficiary, _amount);
    }

    //owner is able to change rate in case of big price fluctuations of ether (on the market), when unsafe is not set, it is only possible to change the rate +- 10%
    function _changeRate(uint _rate, bool up, bool unsafe) public onlyOwner {
        require(_rate != 0);
        if(up) {
          require(_rate.mul(100) <= rate.mul(110) || unsafe);
        } else {
          require(_rate.mul(100) >= rate.mul(90) || unsafe);
        }
        rate = _rate;
    }

    //Calculates the amount that has already vested but hasn't been released yet.
    function releasableAmount() private view returns (uint256) {
      return vestedAmount().sub(released[msg.sender]);
    }

    // Calculates the amount that has already vested.
    function vestedAmount() private view returns (uint256) {
      uint256 lockupStage = 0;
      uint256 releasable = 0;

      //determine current lock-up phase
      uint256 i=0;
      while (i < lockupEndTime.length && lockupEndTime[i]<=now)
      {
        lockupStage = lockupStage.add(1);
        i = i.add(1);
      }

      //if lockupStage == 0 then all tokens are still in lock-up (first lock-up period not ended yet)
      if(lockupStage>0)
      {
        //calculate the releasable amount depending on the current lock-up stage
        releasable = (lockupStage.sub(1).mul(stagedVestedLockUpAmounts)).add(firstVestedLockUpAmount);
      }
      return releasable;
    }

    //Withdraw tokens only after lock-up ends, applying the staged lock-up scheme.
    function withdrawTokens() public {
      uint256 tobeReleased = 0;
      uint256 unreleased = releasableAmount();

      //max amount to be withdrawn is the releasable amount, excess stays in lock-up, unless all lock-ups have ended
      if(balances[msg.sender] >= unreleased && lockupEndTime[lockupEndTime.length-1] > now)
      {
        tobeReleased = unreleased;
      }
      else
      {
        tobeReleased = balances[msg.sender];
      }

      //revert transaction when nothing to be withdrawn
      require(tobeReleased > 0);

      balances[msg.sender] = balances[msg.sender].sub(tobeReleased);
      tokensStillInLockup = tokensStillInLockup.sub(tobeReleased);
      released[msg.sender] = released[msg.sender].add(tobeReleased);

      _deliverTokens(msg.sender, tobeReleased);

    }

}
