// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import './utils/console.sol';
import './utils/stdlib.sol';
import './utils/test.sol';
import { CheatCodes } from './utils/cheatcodes.sol';

import { MiniCoin } from '../MiniCoin.sol';

contract SharedHelper is DSTest {
    // using console for console;
    Vm public constant vm = Vm(HEVM_ADDRESS);
    //CheatCodes cheats = CheatCodes(0x7109709ECfa91a80626fF3989D68f67F5b1DD12D);

    string constant NAME = 'mini';
    string constant SYMBOL = 'mini';

    uint256 constant TOTALSUPPLY = 300_000_000 * 10**18;

    uint256 USER1_PRIVATEKEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    uint256 USER2_PRIVATEKEY = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;
    uint256 USER3_PRIVATEKEY = 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a;
    uint256 USER4_PRIVATEKEY = 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6;
    uint256 USER5_PRIVATEKEY = 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a;

    address USER1 = vm.addr(USER1_PRIVATEKEY);
    address USER2 = vm.addr(USER2_PRIVATEKEY);
    address USER3 = vm.addr(USER3_PRIVATEKEY);
    address USER4 = vm.addr(USER4_PRIVATEKEY);
    address USER5 = vm.addr(USER5_PRIVATEKEY);

    uint8 _LOG_LEVEL;
    address _miniCoin;
    address _testContractAddress;

    enum EthlessTxnType {
        NONE, // 0
        BURN, // 1
        MINT, // 2
        TRANSFER, // 3
        RESERVE // 4
    }

    // Events
    function initialize_helper(
        uint8 LOG_LEVEL_,
        address miniCoin_,
        address testContractAddress_
    ) internal {
        _LOG_LEVEL = LOG_LEVEL_;
        _miniCoin = miniCoin_;
        _testContractAddress = testContractAddress_;
    }

    function _changeLogLevel(uint8 newLogLevel_) internal {
        _LOG_LEVEL = newLogLevel_;
    }

    function addEthSignedMessageHash(bytes32 hash_) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked('\x19Ethereum Signed Message:\n32', hash_));
    }

    function signHash(uint256 signerPrivateKey_, bytes32 hash_)
        internal
        returns (
            uint8,
            bytes32,
            bytes32
        )
    {
        return vm.sign(signerPrivateKey_, addEthSignedMessageHash(hash_));
    }

    function eip191_sign_reserve(
        address signer_,
        uint256 signerPrivateKey_,
        uint256 amountToReserve_,
        uint256 feeToPay_,
        uint256 nonce_,
        address receiver_,
        address executor_,
        uint256 deadline_
    ) internal returns (bytes memory signature) {
        bytes32 hash = keccak256(
            abi.encodePacked(
                EthlessTxnType.RESERVE,
                block.chainid,
                _miniCoin,
                signer_,
                receiver_,
                executor_,
                amountToReserve_,
                feeToPay_,
                nonce_,
                deadline_
            )
        );
        (uint8 signV, bytes32 signR, bytes32 signS) = signHash(signerPrivateKey_, hash);

        return abi.encodePacked(signR, signS, signV);
    }

    function eip712_sign_permit(
        address signer_,
        uint256 signerPrivateKey_,
        uint256 amountToPermit_,
        uint256 nonce_,
        address spender_,
        uint256 deadline_
    )
        internal
        returns (
            uint8 signV,
            bytes32 signR,
            bytes32 signS
        )
    {
        return
            vm.sign(
                signerPrivateKey_,
                keccak256(
                    abi.encodePacked(
                        '\x19\x01',
                        MiniCoin(_miniCoin).DOMAIN_SEPARATOR(),
                        keccak256(
                            abi.encode(
                                keccak256(
                                    'Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)'
                                ),
                                signer_,
                                spender_,
                                amountToPermit_,
                                nonce_,
                                deadline_
                            )
                        )
                    )
                )
            );
    }

    function eip712_sign_transfer(
        address sender_,
        uint256 senderPrivateKey_,
        address recipient_,
        uint256 amount_,
        uint256 nonce_,
        uint256 deadline_
    )
        internal
        returns (
            uint8 signV,
            bytes32 signR,
            bytes32 signS
        )
    {
        return
            vm.sign(
                senderPrivateKey_,
                keccak256(
                    abi.encodePacked(
                        '\x19\x01',
                        MiniCoin(_miniCoin).DOMAIN_SEPARATOR(),
                        keccak256(
                            abi.encode(
                                keccak256(
                                    'Transfer(address sender,address recipient,uint256 amount,uint256 nonce,uint256 deadline)'
                                ),
                                sender_,
                                recipient_,
                                amount_,
                                nonce_,
                                deadline_
                            )
                        )
                    )
                )
            );
    }

    function eip191_reserve(
        address signer_,
        uint256 signerPrivateKey_,
        uint256 amountToReserve_,
        uint256 feeToPay_,
        uint256 nonce_,
        address receiver_,
        address executor_,
        address sender_,
        uint256 deadline_,
        bool giveTokens_
    ) internal {
        if (giveTokens_) MiniCoin(_miniCoin).transfer(signer_, amountToReserve_ + feeToPay_);

        bytes memory signature = eip191_sign_reserve(
            signer_,
            signerPrivateKey_,
            amountToReserve_,
            feeToPay_,
            nonce_,
            receiver_,
            executor_,
            deadline_
        );

        vm.prank(sender_);
        MiniCoin(_miniCoin).reserve(
            signer_,
            receiver_,
            executor_,
            amountToReserve_,
            feeToPay_,
            nonce_,
            deadline_,
            signature
        );
    }

    function eip712_permit(
        address signer_,
        uint256 signerPrivateKey_,
        uint256 amountToPermit_,
        uint256 nonce_,
        address spender_,
        address sender_,
        uint256 deadline_
    ) internal {
        (uint8 signV, bytes32 signR, bytes32 signS) = eip712_sign_permit(
            signer_,
            signerPrivateKey_,
            amountToPermit_,
            nonce_,
            spender_,
            deadline_
        );

        vm.prank(sender_);
        MiniCoin(_miniCoin).permit(signer_, spender_, amountToPermit_, deadline_, signV, signR, signS);
    }

    function eip712_transfer(
        address signer_,
        uint256 signerPrivateKey_,
        uint256 amountToTransfer_,
        uint256 nonce_,
        address recipient_,
        address sender_,
        uint256 deadline_,
        string memory revertMsg
    ) internal {
        (uint8 signV, bytes32 signR, bytes32 signS) = eip712_sign_transfer(
            signer_,
            signerPrivateKey_,
            recipient_,
            amountToTransfer_,
            nonce_,
            deadline_
        );

        vm.prank(sender_);
        if (bytes(revertMsg).length > 0) {
            vm.expectRevert(bytes(revertMsg));
        }
        MiniCoin(_miniCoin).transferBySignature(signer_, recipient_, amountToTransfer_, deadline_, signV, signR, signS);
    }

    function eip191_reserve_verified(
        address signer_,
        uint256 signerPrivateKey_,
        uint256 amountToReserve_,
        uint256 feeToPay_,
        uint256 nonce_,
        address receiver_,
        address executor_,
        address sender_,
        uint256 deadline_,
        bool giveTokens_
    ) internal {
        uint256 original_signerBalance = MiniCoin(_miniCoin).balanceOf(signer_);
        uint256 original_signerReservation = MiniCoin(_miniCoin).reserveOf(signer_);

        eip191_reserve(
            signer_,
            signerPrivateKey_,
            amountToReserve_,
            feeToPay_,
            nonce_,
            receiver_,
            executor_,
            sender_,
            deadline_,
            giveTokens_
        );

        if (_LOG_LEVEL > 0) {
            console.log('Signer balance: ', MiniCoin(_miniCoin).balanceOf(signer_));
            console.log('Signer reservation: ', MiniCoin(_miniCoin).reserveOf(signer_));
        }
        if (original_signerBalance > (amountToReserve_ + feeToPay_))
            assertEq(MiniCoin(_miniCoin).balanceOf(signer_), original_signerBalance - (amountToReserve_ + feeToPay_));
        else assertEq(MiniCoin(_miniCoin).balanceOf(signer_), 0);
        assertEq(MiniCoin(_miniCoin).reserveOf(signer_), original_signerReservation + (amountToReserve_ + feeToPay_));
    }

    function eip712_permit_verified(
        address signer_,
        uint256 signerPrivateKey_,
        uint256 amountToPermit_,
        uint256 nonce_,
        address spender_,
        address sender_,
        uint256 deadline_
    ) internal {
        eip712_permit(signer_, signerPrivateKey_, amountToPermit_, nonce_, spender_, sender_, deadline_);

        assertEq(MiniCoin(_miniCoin).allowance(signer_, spender_), amountToPermit_);
    }

    function eip712_transfer_verified(
        address signer_,
        uint256 signerPrivateKey_,
        uint256 amountToTransfer_,
        uint256 nonce_,
        address recipient_,
        address sender_,
        uint256 deadline_
    ) internal {
        uint256 orginalAmount = MiniCoin(_miniCoin).balanceOf(recipient_);
        uint256 orginalAmountSigner = MiniCoin(_miniCoin).balanceOf(signer_);

        eip712_transfer(signer_, signerPrivateKey_, amountToTransfer_, nonce_, recipient_, sender_, deadline_, '');
        assertEq(MiniCoin(_miniCoin).balanceOf(signer_), orginalAmountSigner - amountToTransfer_);
        assertEq(MiniCoin(_miniCoin).balanceOf(recipient_), orginalAmount + amountToTransfer_);
    }
}
