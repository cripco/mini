// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol';

import './utils/console.sol';
import './utils/stdlib.sol';
import './utils/test.sol';
import { CheatCodes } from './utils/cheatcodes.sol';

import { MiniCoin } from '../MiniCoin.sol';

import './SharedHelper.t.sol';

contract MiniCoinTest is DSTest, SharedHelper {
    MiniCoin miniCoin;

    uint8 LOG_LEVEL = 0;

    function setUp() public {
        // Deploy contracts
        miniCoin = new MiniCoin();

        // Deploy TransparentUpgradeableProxy
        bytes memory data = abi.encodeWithSignature(
            'initialize(address,string,string,uint256)',
            address(this),
            'mini',
            'mini',
            10 * 10**24
        );
        TransparentUpgradeableProxy proxy = new TransparentUpgradeableProxy(
            address(miniCoin), // Implementation contract address
            address(this), // Admin address (for upgrade control)
            data // Initialization data
        );

        miniCoin = MiniCoin(address(proxy));
        initialize_helper(LOG_LEVEL, address(miniCoin), address(this));
        if (LOG_LEVEL > 0) _changeLogLevel(LOG_LEVEL);
    }

    // Basic ERC20 Call
    function test_MiniCoin_basicERC20_name() public {
        assertEq(miniCoin.name(), NAME);
    }

    function test_MiniCoin_basicERC20_symbol() public {
        assertEq(miniCoin.symbol(), SYMBOL);
    }

    function test_MiniCoin_basicERC20_decimals() public {
        assertEq(miniCoin.decimals(), 18);
    }

    function test_MiniCoin_basicERC20_chainId() public {
        assertEq(miniCoin.chainId(), 99);
    }
}
