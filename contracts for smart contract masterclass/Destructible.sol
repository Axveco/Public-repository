pragma solidity ^0.4.23;

/**
  * This contract contains one function which, after being called,
  * will selfdestruct the contract and transfer the balance to The
  * owner of the contract.
*/

contract Destructible {

  address public owner;

  constructor(address _owner) public {
    owner = _owner
  }

  function destructContract() public {
    selfdestruct(owner);
  }
}
