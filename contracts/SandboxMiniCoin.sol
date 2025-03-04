// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title MiniCoin
 */

import './MiniCoin.sol';

contract SandboxMiniCoin is MiniCoin {
    uint256[50] private __gap;
}
