pragma solidity ^0.4.24;

contract PocketMoney {

    address public father;
    address public child;
    uint public weiPerMonth;
    uint public balance;
    uint lastWithdrawn;
    
    
    modifier onlyFather {
        require(msg.sender == father);
        _;
    }
    
    modifier onlyChild {
        require(msg.sender == child);
        _;
    }

    constructor(address _child, uint _weiPerMonth) public {
        require(_child != address(0));
        child = _child;
        father = msg.sender;
        weiPerMonth = _weiPerMonth;
    }

     function setWeiPerMonth(uint newWeiPerMonth) onlyFather public {
        weiPerMonth = newWeiPerMonth;
    }

    function deposit() payable onlyFather public {
        require(msg.value != 0);
        // integer overflow check
        require(balance + msg.value > balance);
        balance += msg.value;
    }

    function withdraw() public onlyChild {
        require(lastWithdrawn <= (now - 4 weeks));
        balance -= weiPerMonth;
        child.transfer(weiPerMonth);
    }
}
