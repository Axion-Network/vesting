// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';

contract TERC721 is ERC721 {
    uint256 id = 0;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    function mint(address to) public returns (uint256) {
        id++;
        _mint(to, id);

        return id;
    }
}
