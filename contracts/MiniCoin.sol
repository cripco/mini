// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title MiniCoin
 */

import '@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol';

import './libs/Ethless.sol';

contract MiniCoin is Ethless, ERC20BurnableUpgradeable {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address owner_,
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_
    ) external initializer {
        __ERC20_init_unchained(name_, symbol_);
        __EIP712_init_unchained(name_, version());
        __ERC20Permit_init_unchained(name_);
        __Reservable_init_unchained();
        __ERC20Burnable_init_unchained();
        _mint(owner_, totalSupply_);
    }

    function chainId() public view returns (uint256) {
        return block.chainid;
    }

    function version() public pure returns (string memory) {
        return '1.0';
    }

    function balanceOf(address account) public view override(ERC20Upgradeable, Ethless) returns (uint256 amount) {
        return Ethless.balanceOf(account);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(ERC20Upgradeable) {
        require(amount > 0, 'MiniCoin: Amount must be greater than 0');
        require(from == address(0) || balanceOf(from) >= amount, 'MiniCoin: Insufficient balance');
        super._beforeTokenTransfer(from, to, amount);
    }

    function _afterTokenTransfer(address from, address to, uint256 amount) internal virtual override(ERC20Upgradeable) {
        super._afterTokenTransfer(from, to, amount);
    }

    uint256[50] private __gap;
}
