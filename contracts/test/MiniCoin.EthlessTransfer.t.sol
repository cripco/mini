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

    // Ethless Transfer
    function test_MiniCoin_ethless_transfer() public {
        uint256 amountToTransfer = 1000;
        uint256 feeToPay = 100;
        uint256 nonce = 54645;

        eip191_transfer_verified(USER1, USER1_PRIVATEKEY, amountToTransfer, feeToPay, nonce, USER3, USER2, true);
    }

    function test_MiniCoin_ethless_transfer_reuseSameNonce() public {
        uint256 amountToTransfer = 1000;
        uint256 feeToPay = 100;
        uint256 nonce = 54645;

        eip191_transfer_verified(USER1, USER1_PRIVATEKEY, amountToTransfer, feeToPay, nonce, USER3, USER2, true);

        bytes memory signature = eip191_sign_transfer(
            USER1,
            USER1_PRIVATEKEY,
            amountToTransfer,
            feeToPay,
            nonce,
            USER3
        );

        vm.prank(USER2);
        vm.expectRevert('Ethless: nonce already used');
        MiniCoin(_miniCoin).transfer(USER1, USER3, amountToTransfer, feeToPay, nonce, signature);
    }
}
