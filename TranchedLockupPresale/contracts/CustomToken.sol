pragma solidity ^0.4.23;

import "./../node_modules/openzeppelin-solidity/contracts/token/ERC20/CappedToken.sol";
import "./../node_modules/openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";

//AC is a capped token with a max supply of 145249999 tokenSupply
//It is a burnable token as well
contract CustomToken is CappedToken(145249999000000000000000000), BurnableToken  {
    string public name = "Axveco Custom Token";
    string public symbol = "ACT";
    uint8 public decimals = 18;

    //only the owner is allowed to burn tokens
    function burn(uint256 _value) public onlyOwner {
      _burn(msg.sender, _value);

    }

}
