const TranchedLockupPresale = artifacts.require('./TranchedLockupPresale.sol');
const CustomToken = artifacts.require('./CustomToken.sol');

let currentTime = Math.floor(+new Date()/1000); // UNIX current timestamp in seconds
module.exports = function(deployer, network, accounts) {
    const openingTime = currentTime 2*60; // epoch timestamp of deployment + two minutes for deployment
    const closingTime = currentTime + 604800 // + 1 week

    // //be careful! JavaScript months are 0 based: Jan = 0, Jun = 5
    const startingYear = 2018
    const lockupEndsTime = [
      (new Date(startingYear,11,31,23,59,59,0)).getTime()/1000, //31 Dec 2018 23:59:59 CET
      (new Date(startingYear + 1,5,30,23,59,59,0)).getTime()/1000, //30 Jun 2019 23:59:59 CET
      (new Date(startingYear + 1,11,31,23,59,59,0)).getTime()/1000, //31 Dec 2019 23:59:59 CET
      (new Date(startingYear + 2,5,30,23,59,59,0)).getTime()/1000, //30 Jun 2020 23:59:59 CET
      (new Date(startingYear + 2,11,31,23,59,59,0)).getTime()/1000, //31 Dec 2020 23:59:59 CET
      (new Date(startingYear + 3,5,30,23,59,59,0)).getTime()/1000 //30 Jun 2021 23:59:59 CET
    ];

    //for testing
    // const openingTime = web3.eth.getBlock('latest').timestamp + 60;  // use it for testing
    // const closingTime = openingTime + 60*20; // use it for testing
    // const lockupEndsTime = [closingTime + 60*10, closingTime + 60*20, closingTime + 60*30, closingTime + 60*40, closingTime + 60*50, closingTime + 60*60];

    const firstVestedLockUpAmount = new web3.BigNumber(875000e18);   //875k tokens
    const gradedVestedLockUpAmounts = new web3.BigNumber(1000000e18);  // 1m tokens

    const rate = new web3.BigNumber(1012); //per 1 ether
    const wallet = const wallet = address(0) // change this to your desired wallet to receive the CustomTokens

    const tokensInPrivateSale = new web3.BigNumber(17500000*10**18); // $10,000,000 / 0.60 * 1.05 (commission for generating direct sales)

    return deployer
        .then(() => {
            return deployer.deploy(CustomToken);
        })
        .then(() => {
            return deployer.deploy(
                TranchedLockupPresale,
                openingTime,
                closingTime,
                rate,
                wallet,
                lockupEndsTime,
                firstVestedLockUpAmount,
                gradedVestedLockUpAmounts,
                CustomToken.address
            );
        })
        .then(function(result) {
            var token;
            CustomToken.deployed().then(function(instance) {
                token = instance;
                return token.mint(TranchedLockupPresale.address, tokensInPrivateSale);
              })
        });
};
