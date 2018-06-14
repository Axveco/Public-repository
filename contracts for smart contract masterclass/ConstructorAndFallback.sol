pragma solidity ^0.4.23;
/**
 * This contract contains a constructor, one function and a fallback.
 * All functions set a state variable; the constructor can set it only once
 * the function can set it as many times to any arbitrary (uint) value
 * the fallback cannot receive an argument, thus can only be set to a hardcoded value;
*/ 
contract constructorAndFallback {

    address public owner;
    uint stateVariableOne;
    bool stateVariableTwo;

    constructor(address _owner) public {
        owner = _owner;
    }

    function setStateVariableOne(uint _stateVariableOne) public returns(bool success) {
        stateVariableOne = _stateVariableOne;
        return true;
    }

    function () public {
        stateVariableTwo = true;
    }
}
