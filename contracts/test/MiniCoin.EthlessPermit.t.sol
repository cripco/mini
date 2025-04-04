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
        miniCoin = new MiniCoin(address(this), 'mini', 'mini', 10 * 10**24);

        initialize_helper(LOG_LEVEL, address(miniCoin), address(this));
        if (LOG_LEVEL > 0) _changeLogLevel(LOG_LEVEL);
    }

    // Ethless Permit
    function test_MiniCoin_ethless_permit() public {
        uint256 amountToPermit = 10_000;
        uint256 deadline = block.number + 100;
        eip712_permit_verified(USER1, USER1_PRIVATEKEY, amountToPermit, miniCoin.nonces(USER1), USER3, USER2, deadline);
    }

    // Ethless Permit
    function test_MiniCoin_ethless_permit_reuseSameNonce() public {
        uint256 amountToPermit = 10_000;
        uint256 deadline = block.number + 100;
        uint256 nonce = miniCoin.nonces(USER1);

        eip712_permit_verified(USER1, USER1_PRIVATEKEY, amountToPermit, nonce, USER3, USER2, deadline);

        (uint8 signV, bytes32 signR, bytes32 signS) = eip712_sign_permit(
            USER1,
            USER1_PRIVATEKEY,
            amountToPermit * 2,
            nonce,
            USER3,
            deadline
        );

        vm.prank(USER2);
        vm.expectRevert('ERC20Permit: invalid signature');
        miniCoin.permit(USER1, USER3, amountToPermit * 2, deadline, signV, signR, signS);
    }
}
