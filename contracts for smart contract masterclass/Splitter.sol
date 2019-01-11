pragma solidity ^0.4.24;
 
contract Splitter {
    
    address public owner;
    address public clientA;
    address public clientB;
    uint256 public percentageA;
    uint256 public percentageB;
    
    constructor(address _clientA, address _clientB, uint256 _percentageB, uint256 _percentageA) {
        require(_percentageA + percentageB < 100);
        owner = msg.sender;
        clientA = _clientA;
        clientB = _clientB;
        percentageA = _percentageA;
        percentageB = _percentageB;
    }
    
    function deposit() public payable {
        clientA.transfer((msg.value * percentageA) / 100);
        clientB.transfer((msg.value * percentageB) / 100);
    }
    
    function withdrawFunds() public {
        require(msg.sender == owner);
        owner.transfer(address(this).balance);
    }
       
}

