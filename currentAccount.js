return web3.eth.getAccounts(async function(err, accounts) {
        if (err != null) {
          alert("There was an error fetching your accounts.");
          return;
        } else if (accounts.length == 0) {
          alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
          return;
        } else {
          return accounts[0];
        }
      })
