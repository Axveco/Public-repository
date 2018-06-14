pragma solidity ^0.4.23;

/**
 * This contract shows the usecase of a struct and mapping via a simple voting contract.
 * Do not use this contract for production.
*/
contract StructsAndMapings {

    struct ballot {
        uint weight;
        bool voted;
        address delegate;
        uint vote;
        uint time;
    }

    mapping(address => ballot) voters;

    function setVoter(address voter, uint _weight, address _delegate) public {
        voters[voter].weight = _weight;
        voters[voter].delegate = _delegate;
    }

    function vote(uint _vote) public {
        voters[msg.sender].vote = _vote;
        voters[msg.sender].time = now;
    }

    function delegateVote(address _voter, uint _vote) public {
        require(voters[_voter].delegate == msg.sender);
        voters[_voter].vote = _vote;
        voters[msg.sender].time = now;
    }
}
