pragma solidity ^0.4.23;

/**
 * this contract is an example. We define the name of the contract,
 * one public variable and two public functions that set one state variableted)
*/
contract ExampleContract {

    // define here all your variables (and)
    string public variableName;

    function setVariableName() public {
        variableName = "example";
    }

    function setVariableNameArgument(string _variableName) public {
        variableName = _variableName;
    }
}
