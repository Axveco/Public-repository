pragma solidity ^0.4.23;

/**
 * This contract contains contains a constructor
 * which sets the owner of the contract.
*/
contract Ownable {

    address public owner;

    constructor(address _owner) public {
        owner = _owner;
    }
}
