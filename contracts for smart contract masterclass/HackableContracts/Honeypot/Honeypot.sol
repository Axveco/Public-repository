pragma solidity ^0.4.23;
import "./OwnablePausable.sol";

/**
 * @dev this contract has an internal balance which can only be withdrawn by the owner of the contract.
 * if you manage to pull all the value out of this contract you can trigger the winnerAnnounced event and
 * declare yourself a winner!
 */
contract Honeypot is OwnablePausable {

  constructor() public payable {
    require(msg.value != 0);
    balance = msg.value;
  }

  uint public balance;

  event winnerAnnounced(address winner, string yourName);

  /**
   * @dev The transferBalance function sends the current balance of this contract to the owner,
   * but will revert if the owner is a new owner (less than 15 minutes)
   */
  function transferBalance() public onlyOwner {
    require(ownershipTransferTime <= now + 15 minutes);
    uint memory transferBalance = balance;
    balance = 0;
    owner.transfer(transferBalance);
  }

  /**
   * @dev only the current owner of the contract can call this function
   * and the winner will be announced if the balance is 0
   */
  function announceWinner(string yourName) public onlyOwner {
    require(balance == 0);
    emit winnerAnnounced(msg.sender, yourName);
  }

  /**
   * @dev non-payable fallback function that has no functionality
   */
  function () {

  }
}
