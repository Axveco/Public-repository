pragma solidity ^0.4.23;

import "./InheritDestructible.sol";
/**
 * This contract contains one function which, after being called,
 * will set a variable. The purpose is to show inheritance.
*/
contract MyContract is Destructible {

    constructor(address _owner) Destructable(_owner) {

    }

    uint public myVariable;

    function setMyVariable(uint _myVariable) public {
        myVariable = _myVariable;
    }
}
