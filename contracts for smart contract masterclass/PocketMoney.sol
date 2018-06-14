pragma solidity ^0.4.23;

contract PocketMoney {

    modifier onlyAddress(address person) {
        require(msg.sender == person);
        _;
    }

    address public father;
    address public child;
    uint public weiPerMonth;
    uint public balance;
    uint lastWithdrawn;

    constructor(address _child, uint _weiPerMonth) public {
        require(_child != address(0));
        father = msg.sender;
        weiPerMonth = _weiPerMonth;
    }

     function setWeiPerMonth(uint newWeiPerMonth) onlyAddress(father) public {
        weiPerMonth = newWeiPerMonth;
    }

    function deposit() payable onlyAddress(father) public {
        require(msg.value != 0);
        // integer overflow check
        require(balance + msg.value > balance);
        balance += msg.value;
    }

    function withdraw() public onlyAddress(child) {
        require(lastWithdrawn <= (now - 4 weeks));
        child.transfer(weiPerMonth);
    }

}
