// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

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
        // Initialize helper
        initialize_helper(LOG_LEVEL, address(miniCoin), address(this));
        if (LOG_LEVEL > 0) _changeLogLevel(LOG_LEVEL);
    }

    // Ethless Burn
    function test_MiniCoin_ethless_burn() public {
        uint256 amountToBurn = 1000;
        uint256 feeToPay = 100;
        uint256 nonce = 54645;

        eip191_burn_verified(USER1, USER1_PRIVATEKEY, amountToBurn, feeToPay, nonce, USER2, true);
    }

    function test_MiniCoin_ethless_burn_reuseSameNonce() public {
        uint256 amountToBurn = 1000;
        uint256 feeToPay = 100;
        uint256 nonce = 54645;

        eip191_burn_verified(USER1, USER1_PRIVATEKEY, amountToBurn, feeToPay, nonce, USER2, true);

        bytes memory signature = eip191_sign_burn(USER1, USER1_PRIVATEKEY, amountToBurn, feeToPay, nonce);

        vm.prank(USER2);
        vm.expectRevert('Ethless: nonce already used');
        MiniCoin(_miniCoin).burn(USER1, amountToBurn, feeToPay, nonce, signature);
    }
}
