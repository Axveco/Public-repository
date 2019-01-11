pragma solidity ^0.4.24;
 
contract houseEscrow {
    
    enum SaleStatus {
        Concept,
        Respite,
        Finished,
        Dispute,
        Cancelled
    }
   
    address public buyer; // set during deployment
    address public seller; // set during deployment
    address public notary; // set during acceptance
    address public mortgagor; // set during acceptance
    address public landRegistry = 0xdd870fa1b7c4700f2bd7f44238821c26f7392148; // fixed address 
    uint256 public worthInWei; // set during deployment
    uint public agreementDate; // set during deployment
    uint256 public respiteTime = 3 days; // fixed due to law
    bytes32 public objectDescription; // set during deployment
    SaleStatus public mySaleStatus; // keeps track of the saleStatus
   
    // This modifier is used throughout the contract to make certain functions available or not available in the different statuses of the escrow
    modifier hasStatus(SaleStatus status) {
        require(mySaleStatus == status, "Not the correct status");
        _;
    }
   
    // This modifier is used throughout the contract to make sure certain functions can only be called by certain roles
    modifier isParty(address party) {
        require(msg.sender == party, "Not authorized to call this function");
        _;
    }
   
    // The seller deploys the contract and initializes three values: buyer, worthInWei and the description of the house (hash of document)
    constructor(
        address _buyer,
        uint256 _worthInWei,
        bytes32 _objectDescription
    ) {
        require(_buyer != address(0));
        require(_worthInWei != 0);
        seller = msg.sender;
        buyer = _buyer;
        worthInWei = _worthInWei;
        objectDescription = _objectDescription;
        mySaleStatus = SaleStatus.Concept;
    }
   
    // a buyer has to accept the offer from the seller and does this by calling this function. At the same time, he initializes the fields notary and mortgagor 
    function accept(
        address _notary,
        address _mortgagor
    )
        hasStatus(SaleStatus.Concept)
        isParty(buyer)
        public
    {
        require(_notary != address(0));
        require(_mortgagor != address(0));
        agreementDate = now;
        notary = _notary;
        mortgagor = _mortgagor;
        mySaleStatus = SaleStatus.Respite;
    }
   
    // A buyer can cancel the deal unilaterally if less than three days since the agreementDate have passed 
    function Cancel()
        hasStatus(SaleStatus.Respite)
        isParty(buyer)
        public
    {
        require(now <= agreementDate + respiteTime);
        // transfer money back if the mortgagor has already transferred money to the contract.
        if(address(this).balance != 0) {
            // maak geld over
            mortgagor.transfer(address(this).balance);   
        }
        mySaleStatus = SaleStatus.Cancelled;
    }
   
   
   // A notary is responsible for the handover and can do this when the respite time has ended and the contract has sufficient balance
    function handOver()
        public
        isParty(notary)
        hasStatus(SaleStatus.Respite)
    {
        require(now >= agreementDate + respiteTime);
        require(address(this).balance >= worthInWei);
        seller.transfer(address(this).balance);
        mySaleStatus = SaleStatus.Finished;
   }
   
    // The mortgagor can transfer the worthInWei to the smart-contract during the respite status when the contract does not hold sufficient balance yet
    function ()
        payable
        hasStatus(SaleStatus.Respite)
        public
    {
        require(address(this).balance < worthInWei);
        require(msg.value == worthInWei);
        require(msg.sender == mortgagor);   
    }
       
}
