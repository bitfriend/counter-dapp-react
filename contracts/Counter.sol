pragma solidity ^0.8.0;

contract Counter {
  mapping(address => uint256) private counts;

  function increments() public {
    counts[msg.sender] += 1;
  }

  function decrements() public {
    counts[msg.sender] -= 1;
  }

  function getCount() public view returns (uint256) {
    return counts[msg.sender];
  }
}