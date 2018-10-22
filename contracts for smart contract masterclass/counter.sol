pragma solidity ^0.4.24;

contract counter {
  uint public counter;
  function increment() {
    counter = counter + 1;
  }
}
