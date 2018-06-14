pragma solidity ^0.4.23;

import "./InheritOwnable.sol";
/**
 * This contract contains one function which, after being called,
 * will selfdestruct the contract and transfer the balance to the
 * owner of the contract.
*/

contract Destructible is Ownable {

    constructor(address _owner) Ownable(_owner) public {

    }

    function destructContract() public {
        selfdestruct(owner);
    }
}
