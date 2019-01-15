App = {
  ABI: //TODO: copy the ABI here,
  Address: // TODO: copy the contract address here
  connect: function() {
    // TODO: instantiate web 3 here
  }
  getAccountZero: async function() {
      // TODO: return account zero here
  },

  getBalance: async function() {
    // TODO: call the getBalance function here
  },

  getContractInstance: function() {
    let abi = App.ABI
    let address = App.Address
    return new web3.eth.Contract(abi, address)
  },

  getScore: async function() {
    // TODO: return the current score of the game here
  },

  getWinner: async function() {
    // TODO: return the winner of the game
  },

  setBalance: function(balance) {
    $("#balance").html(balance / 1000000000000000000)
  },

  setScore: function(score) {
    $("#score").html(score)
  },

  setMyCurrentAccount(currentAccount) {
    $("#currentAccount").html(currentAccount)
  },

  setWinner: function(winner) {
    if(winner != 0x0000000000000000000000000000000000000000) {
      $("#winner").html(winner)
    }
  },

  start: async function() {

      App.connect()
      App.CurrentAccount = await App.getAccountZero()
      App.Contract = App.getContractInstance();
      App.setMyCurrentAccount(App.CurrentAccount)
      App.setScore(await App.getScore())
      App.setBalance(await App.getBalance())
      App.setWinner(await App.getWinner())
  },

  payout: function() {
    //TODO => call the payout function
  },

  play: function() {
    //TODO => call the play function
  }
}

$(function() {
  App.start()
})
