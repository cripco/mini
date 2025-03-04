require('dotenv');
const { expect, use } = require('chai');
const { solidity } = require('ethereum-waffle');
const { ethers, network } = require('hardhat');
const TestHelper = require('./shared');
const SignHelper = require('./signature');
use(solidity);

let owner;
let user1;
let user2;
let user3;
let MiniCoin;
let provider;
const zeroAddress = '0x0000000000000000000000000000000000000000';

describe('MiniCoin - Ethless Transfer functions', function () {
    before(async () => {
        [provider, owner, user1, user2, user3] = await TestHelper.setupProviderAndWallet();
    });

    beforeEach(async () => {
        [MiniCoin] = await TestHelper.setupContractTesting(owner);
    });

    describe('MiniCoin - Regular Ethless Transfer', async function () {
        const amountToTransfer = 100;
        const feeToPay = 10;

        it('Test Ethless transfer', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);

            const nonce = Date.now();
            const signature = SignHelper.signTransfer(
                3,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                user2.address,
                amountToTransfer,
                feeToPay,
                nonce
            );
            const input = await MiniCoin.connect(user3).populateTransaction[
                'transfer(address,address,uint256,uint256,uint256,bytes)'
            ](owner.address, user2.address, amountToTransfer, feeToPay, nonce, signature);
            await TestHelper.checkResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToTransfer).sub(feeToPay)
            );
            expect(await MiniCoin.balanceOf(user2.address)).to.equal(ethers.BigNumber.from(amountToTransfer));
            expect(await MiniCoin.balanceOf(user3.address)).to.equal(ethers.BigNumber.from(feeToPay));
        });
    });

    describe('MiniCoin - Test expecting failure Ethless Transfer', async function () {
        const amountToTransfer = 100;
        const feeToPay = 10;

        it('Test Ethless transfer while reusing the same nonce (and signature) on the second transfer', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);

            const nonce = Date.now();
            const signature = SignHelper.signTransfer(
                3,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                user2.address,
                amountToTransfer,
                feeToPay,
                nonce
            );
            const input = await MiniCoin.connect(user3).populateTransaction[
                'transfer(address,address,uint256,uint256,uint256,bytes)'
            ](owner.address, user2.address, amountToTransfer, feeToPay, nonce, signature);
            await TestHelper.checkResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToTransfer).sub(feeToPay)
            );
            expect(await MiniCoin.balanceOf(user2.address)).to.equal(ethers.BigNumber.from(amountToTransfer));
            expect(await MiniCoin.balanceOf(user3.address)).to.equal(ethers.BigNumber.from(feeToPay));
            await TestHelper.checkResult(
                input,
                MiniCoin.address,
                user3,
                ethers,
                provider,
                'Ethless: nonce already used'
            );
        });
    });

    describe('MiniCoin - Test expecting failure Ethless Transfer', async function () {
        const amountToTransfer = 100;
        const feeToPay = 10;

        beforeEach(async () => {
            const inputTransfer = await MiniCoin.connect(owner).populateTransaction['transfer(address,uint256)'](
                user1.address,
                amountToTransfer
            );
            await TestHelper.checkResult(inputTransfer, MiniCoin.address, owner, ethers, provider, 0);
        });

        it('Test Ethless transfer while reusing the same nonce (and signature) on the second transfer', async () => {
            const originalBalance = await MiniCoin.balanceOf(owner.address);

            const nonce = Date.now();
            const signature = SignHelper.signTransfer(
                3,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                user2.address,
                amountToTransfer,
                feeToPay,
                nonce
            );
            const input = await MiniCoin.connect(user3).populateTransaction[
                'transfer(address,address,uint256,uint256,uint256,bytes)'
            ](owner.address, user2.address, amountToTransfer, feeToPay, nonce, signature);
            await TestHelper.checkResult(input, MiniCoin.address, user3, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(
                ethers.BigNumber.from(originalBalance).sub(amountToTransfer).sub(feeToPay)
            );
            expect(await MiniCoin.balanceOf(user2.address)).to.equal(ethers.BigNumber.from(amountToTransfer));
            expect(await MiniCoin.balanceOf(user3.address)).to.equal(ethers.BigNumber.from(feeToPay));
            await TestHelper.checkResult(
                input,
                MiniCoin.address,
                user3,
                ethers,
                provider,
                'Ethless: nonce already used'
            );
        });

        it('Test Ethless transfer while while amountToTransfer + feeToPay is higher than the balance', async () => {
            const inputTransfer = await MiniCoin.connect(owner).populateTransaction['transfer(address,uint256)'](
                user2.address,
                amountToTransfer - feeToPay / 2
            );
            await TestHelper.checkResult(inputTransfer, MiniCoin.address, owner, ethers, provider, 0);

            const nonce = Date.now();
            const signature = SignHelper.signTransfer(
                3,
                network.config.chainId,
                MiniCoin.address,
                user2.address,
                user2.privateKey,
                user3.address,
                amountToTransfer,
                feeToPay,
                nonce
            );
            const input = await MiniCoin.connect(user3).populateTransaction[
                'transfer(address,address,uint256,uint256,uint256,bytes)'
            ](user2.address, user3.address, amountToTransfer, feeToPay, nonce, signature);
            await TestHelper.checkResult(
                input,
                MiniCoin.address,
                user3,
                ethers,
                provider,
                'MiniCoin: Insufficient balance'
            );
        });

        it('Test Ethless transfer while while amountToTransfer is higher than the balance', async () => {
            const inputTransfer = await MiniCoin.connect(owner).populateTransaction['transfer(address,uint256)'](
                user2.address,
                amountToTransfer - feeToPay
            );
            await TestHelper.checkResult(inputTransfer, MiniCoin.address, owner, ethers, provider, 0);

            const nonce = Date.now();
            const signature = SignHelper.signTransfer(
                3,
                network.config.chainId,
                MiniCoin.address,
                user2.address,
                user2.privateKey,
                user3.address,
                amountToTransfer,
                feeToPay,
                nonce
            );
            const input = await MiniCoin.connect(user3).populateTransaction[
                'transfer(address,address,uint256,uint256,uint256,bytes)'
            ](user2.address, user3.address, amountToTransfer, feeToPay, nonce, signature);
            await TestHelper.checkResult(
                input,
                MiniCoin.address,
                user3,
                ethers,
                provider,
                'MiniCoin: Insufficient balance'
            );
        });

        it('Test Ethless transfer while while feeToPay is higher than the balance', async () => {
            const inputTransfer = await MiniCoin.connect(owner).populateTransaction['transfer(address,uint256)'](
                user2.address,
                feeToPay / 2
            );
            await TestHelper.checkResult(inputTransfer, MiniCoin.address, owner, ethers, provider, 0);

            const nonce = Date.now();
            const signature = SignHelper.signTransfer(
                3,
                network.config.chainId,
                MiniCoin.address,
                user2.address,
                user2.privateKey,
                user3.address,
                amountToTransfer,
                feeToPay,
                nonce
            );
            const input = await MiniCoin.connect(user3).populateTransaction[
                'transfer(address,address,uint256,uint256,uint256,bytes)'
            ](user2.address, user3.address, amountToTransfer, feeToPay, nonce, signature);
            await TestHelper.checkResult(
                input,
                MiniCoin.address,
                user3,
                ethers,
                provider,
                'MiniCoin: Insufficient balance'
            );
        });
    });
});
