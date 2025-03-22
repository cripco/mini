// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title MiniCoin
 */

import '@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol';

import './libs/Ethless.sol';

contract MiniCoin is Ethless, ERC20Burnable {
    /// The contract is intended to be deployed as non-upgrdeable
    constructor(
        address holder_,
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_
    ) ERC20(name_, symbol_) ERC20Permit(name_) {
        _mint(holder_, totalSupply_);
    }

    function chainId() public view returns (uint256) {
        return block.chainid;
    }

    function version() public pure returns (string memory) {
        return '1';
    }

    function balanceOf(address account) public view override(ERC20, Ethless) returns (uint256 amount) {
        return Ethless.balanceOf(account);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(ERC20) {
        require(from == address(0) || balanceOf(from) >= amount, 'MiniCoin: Insufficient balance');
        ERC20._beforeTokenTransfer(from, to, amount);
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(ERC20) {
        ERC20._afterTokenTransfer(from, to, amount);
    }
}
