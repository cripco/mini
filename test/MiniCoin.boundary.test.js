require('dotenv');
const { expect, use } = require('chai');
const { solidity } = require('ethereum-waffle');
const { ethers, network } = require('hardhat');
const Chance = require('chance');
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

describe('MiniCoin - Boundary', function () {
    let originalBalance;
    before(async () => {
        [provider, owner, user1, user2, user3] = await TestHelper.setupProviderAndWallet();
    });

    beforeEach(async () => {
        [MiniCoin] = await TestHelper.setupContractTesting(owner);
        originalBalance = await MiniCoin.balanceOf(owner.address);
    });

    describe('Test floating point on different fn()', () => {
        it('Test burn() w/ floating point', async () => {
            const chance = new Chance();
            const amount = chance.floating({ min: 0, max: 100, fixed: 7 });
            let msg;
            try {
                const inputBurn = await MiniCoin.connect(owner).populateTransaction['burn(uint256)'](amount);
                msg = await TestHelper.checkResult(inputBurn, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no floating point';
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal('no floating point');
        });
        it('Test burn(w/ signature) w/ floating point', async () => {
            const chance = new Chance();
            const amount = chance.floating({ min: 0, max: 100, fixed: 7 });
            const feeToPay = 10;
            const nonce = Date.now();
            const signature = SignHelper.signBurn(
                1,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                amount,
                feeToPay,
                nonce
            );

            let msg;
            try {
                let input = await MiniCoin.connect(owner).populateTransaction[
                    'burn(address,uint256,uint256,uint256,bytes)'
                ](owner.address, amount, feeToPay, nonce, signature, { from: owner.address });
                msg = await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no floating point';
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal('no floating point');
        });
        it('Test transfer() w/ floating point', async () => {
            const chance = new Chance();
            const amount = chance.floating({ min: 0, max: 1000, fixed: 7 });
            let msg;
            try {
                const inputTransfer = await MiniCoin.connect(owner).populateTransaction['transfer(address,uint256)'](
                    user1.address,
                    amount,
                    { from: owner.address }
                );
                msg = await TestHelper.checkResult(inputTransfer, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no floating point';
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await MiniCoin.balanceOf(user1.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal('no floating point');
        });
        it('Test transferFrom() w/ floating point', async () => {
            const chance = new Chance();
            const amount = chance.floating({ min: 0, max: 1000, fixed: 7 });
            const inputApprove = await MiniCoin.connect(owner).populateTransaction.approve(user1.address, 1000);
            await TestHelper.checkResult(inputApprove, MiniCoin.address, owner, ethers, provider, 0);

            let msg;
            try {
                const inputTransfer = await MiniCoin.connect(user1).populateTransaction.transferFrom(
                    owner.address,
                    user2.address,
                    amount
                );
                msg = await TestHelper.checkResult(inputTransfer, MiniCoin.address, user1, ethers, provider, 0);
            } catch (err) {
                msg = 'no floating point';
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await MiniCoin.balanceOf(user2.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal('no floating point');
        });
        it('Test transfer(w/ signature) w/ floating point', async () => {
            const chance = new Chance();
            const amount = chance.floating({ min: 0, max: 1000, fixed: 7 });
            const feeToPay = 10;
            const nonce = Date.now();

            let msg;
            try {
                const signature = SignHelper.signTransfer(
                    3,
                    network.config.chainId,
                    MiniCoin.address,
                    owner.address,
                    owner.privateKey,
                    user1.address,
                    amount,
                    feeToPay,
                    nonce
                );
                let input = await MiniCoin.connect(owner).populateTransaction[
                    'transfer(address,address,uint256,uint256,uint256,bytes)'
                ](owner.address, user1.address, amount, feeToPay, nonce, signature, { from: owner.address });
                msg = await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no floating point';
            }

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal('no floating point');
        });
        it('Test reserve(w/ signature) w/ floating point', async () => {
            const chance = new Chance();
            const amount = chance.floating({ min: 0, max: 1000, fixed: 7 });

            const feeToPay = 10;
            const nonce = Date.now();
            const blockNumber = await provider.blockNumber;
            const expirationBlock = blockNumber + 2000;

            let msg;
            try {
                const signature = SignHelper.signReserve(
                    4,
                    network.config.chainId,
                    MiniCoin.address,
                    owner.address,
                    owner.privateKey,
                    user1.address,
                    owner.address,
                    amount,
                    feeToPay,
                    nonce,
                    expirationBlock
                );
                let input = await MiniCoin.connect(owner).populateTransaction[
                    'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
                ](owner.address, user1.address, owner.address, amount, feeToPay, nonce, expirationBlock, signature, {
                    from: owner.address
                });
                msg = await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no floating point';
            }

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal('no floating point');
        });
        it('Test approve() w/ floating point', async () => {
            const chance = new Chance();
            const amount = chance.floating({ fixed: 7 });
            let msg;
            try {
                const input = await MiniCoin.connect(owner).populateTransaction.approve(MiniCoin.address, amount);
                msg = await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no floating point';
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal('no floating point');
        });
        it('Test increaseAllowance() w/ floating point', async () => {
            const chance = new Chance();
            const amount = chance.floating({ fixed: 7 });
            const input = await MiniCoin.connect(owner).populateTransaction.approve(MiniCoin.address, 1000);
            await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            let msg;
            try {
                const inputIncreaseAllowance = await MiniCoin.connect(owner).populateTransaction.increaseAllowance(
                    MiniCoin.address,
                    amount
                );
                msg = await TestHelper.checkResult(
                    inputIncreaseAllowance,
                    MiniCoin.address,
                    owner,
                    ethers,
                    provider,
                    0
                );
            } catch (err) {
                msg = 'no floating point';
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(1000));
            expect(msg).to.equal('no floating point');
        });
        it('Test decreaseAllowance() w/ floating point', async () => {
            const chance = new Chance();
            const amount = chance.floating({ min: 0, max: 100, fixed: 7 });
            const inputApprove = await MiniCoin.connect(owner).populateTransaction.approve(MiniCoin.address, 1000);
            await TestHelper.checkResult(inputApprove, MiniCoin.address, owner, ethers, provider, 0);
            let msg;
            try {
                const input = await MiniCoin.connect(owner).populateTransaction.decreaseAllowance(
                    MiniCoin.address,
                    amount
                );
                msg = await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no floating point';
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(1000));
            expect(msg).to.equal('no floating point');
        });
    });

    describe('Test negative number on different fn()', () => {
        it('Test burn() w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });
            let msg;
            try {
                const inputBurn = await MiniCoin.connect(owner).populateTransaction['burn(uint256)'](amount);
                msg = await TestHelper.checkResult(inputBurn, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no negative number';
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal('no negative number');
        });
        it('Test burn(w/ signature) w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });
            const feeToPay = 10;
            const nonce = Date.now();
            let msg;
            try {
                const signature = SignHelper.signBurn(
                    1,
                    network.config.chainId,
                    MiniCoin.address,
                    owner.address,
                    owner.privateKey,
                    amount,
                    feeToPay,
                    nonce
                );
                let input = await MiniCoin.connect(owner).populateTransaction[
                    'burn(address,uint256,uint256,uint256,bytes)'
                ](owner.address, amount, feeToPay, nonce, signature, { from: owner.address });
                msg = await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no negative number';
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal('no negative number');
        });
        it('Test transfer() w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });
            let msg;
            try {
                const inputTransfer = await MiniCoin.connect(owner).populateTransaction['transfer(address,uint256)'](
                    user1.address,
                    amount,
                    { from: owner.address }
                );
                msg = await TestHelper.checkResult(inputTransfer, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no negative number';
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await MiniCoin.balanceOf(user1.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal('no negative number');
        });
        it('Test transferFrom() w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });
            const inputApprove = await MiniCoin.connect(owner).populateTransaction.approve(
                user1.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.checkResult(inputApprove, MiniCoin.address, owner, ethers, provider, 0);

            let msg;
            try {
                const inputTransfer = await MiniCoin.connect(user1).populateTransaction.transferFrom(
                    owner.address,
                    user2.address,
                    amount
                );
                msg = await TestHelper.checkResult(inputTransfer, MiniCoin.address, user1, ethers, provider, 0);
            } catch (err) {
                msg = 'no negative number';
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await MiniCoin.balanceOf(user2.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal('no negative number');
        });
        it('Test transfer(w/ signature) w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });
            const feeToPay = 10;
            const nonce = Date.now();

            let msg;
            try {
                const signature = SignHelper.signTransfer(
                    3,
                    network.config.chainId,
                    MiniCoin.address,
                    owner.address,
                    owner.privateKey,
                    user1.address,
                    amount,
                    feeToPay,
                    nonce
                );
                let input = await MiniCoin.connect(owner).populateTransaction[
                    'transfer(address,address,uint256,uint256,uint256,bytes)'
                ](owner.address, user1.address, amount, feeToPay, nonce, signature, { from: owner.address });
                msg = await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no negative number';
            }

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal('no negative number');
        });
        it('Test reserve(w/ signature) w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });

            const feeToPay = 10;
            const nonce = Date.now();
            const blockNumber = await provider.blockNumber;
            const expirationBlock = blockNumber + 2000;

            let msg;
            try {
                const signature = SignHelper.signReserve(
                    4,
                    network.config.chainId,
                    MiniCoin.address,
                    owner.address,
                    owner.privateKey,
                    user1.address,
                    owner.address,
                    amount,
                    feeToPay,
                    nonce,
                    expirationBlock
                );
                let input = await MiniCoin.connect(owner).populateTransaction[
                    'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
                ](owner.address, user1.address, owner.address, amount, feeToPay, nonce, expirationBlock, signature, {
                    from: owner.address
                });
                msg = await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no negative number';
            }

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal('no negative number');
        });
        it('Test approve() w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });
            let msg;
            try {
                const input = await MiniCoin.connect(owner).populateTransaction.approve(MiniCoin.address, amount);
                msg = await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no negative number';
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(0);
            expect(msg).to.equal('no negative number');
        });
        it('Test increaseAllowance() w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });
            const input = await MiniCoin.connect(owner).populateTransaction.approve(
                MiniCoin.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            let msg;
            try {
                const inputIncreaseAllowance = await MiniCoin.connect(owner).populateTransaction.increaseAllowance(
                    MiniCoin.address,
                    amount
                );
                msg = await TestHelper.checkResult(
                    inputIncreaseAllowance,
                    MiniCoin.address,
                    owner,
                    ethers,
                    provider,
                    0
                );
            } catch (err) {
                msg = 'no negative number';
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(10000));
            expect(msg).to.equal('no negative number');
        });
        it('Test decreaseAllowance() w/ negative number', async () => {
            const chance = new Chance();
            const amount = chance.integer({ min: -10000, max: -1 });
            const inputApprove = await MiniCoin.connect(owner).populateTransaction.approve(
                MiniCoin.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.checkResult(inputApprove, MiniCoin.address, owner, ethers, provider, 0);
            let msg;
            try {
                const input = await MiniCoin.connect(owner).populateTransaction.decreaseAllowance(
                    MiniCoin.address,
                    amount
                );
                msg = await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no negative number';
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(10000));
            expect(msg).to.equal('no negative number');
        });
    });

    describe('Test zero(0) number on different fn()', () => {
        it('Test burn() w/ zero(0) number', async () => {
            const amount = 0;
            let msg;
            try {
                const inputBurn = await MiniCoin.connect(owner).populateTransaction['burn(uint256)'](amount);
                msg = await TestHelper.checkResult(inputBurn, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'MiniCoin: Insufficient balance';
            }

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
        });
        it('Test burn(w/ signature) w/ zero(0) number', async () => {
            const amount = 0;
            const feeToPay = 10;
            const nonce = Date.now();
            const signature = SignHelper.signBurn(
                1,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                amount,
                feeToPay,
                nonce
            );

            let msg;
            try {
                let input = await MiniCoin.connect(owner).populateTransaction[
                    'burn(address,uint256,uint256,uint256,bytes)'
                ](owner.address, amount, feeToPay, nonce, signature, { from: owner.address });
                msg = await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'MiniCoin: Insufficient balance';
            }

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal('MiniCoin: Insufficient balance');
        });
        it('Test transfer() w/ zero(0) number', async () => {
            const amount = 0;
            const inputTransfer = await MiniCoin.connect(owner).populateTransaction['transfer(address,uint256)'](
                user1.address,
                amount,
                { from: owner.address }
            );
            await TestHelper.checkResult(inputTransfer, MiniCoin.address, owner, ethers, provider, 0);

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await MiniCoin.balanceOf(user1.address)).to.equal(ethers.BigNumber.from(0));
        });
        it('Test transferFrom() w/ zero(0) number', async () => {
            const amount = 0;
            const inputApprove = await MiniCoin.connect(owner).populateTransaction.approve(
                user1.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.checkResult(inputApprove, MiniCoin.address, owner, ethers, provider, 0);

            const inputTransfer = await MiniCoin.connect(user1).populateTransaction.transferFrom(
                owner.address,
                user2.address,
                amount
            );
            await TestHelper.checkResult(inputTransfer, MiniCoin.address, user1, ethers, provider, 0);

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await MiniCoin.balanceOf(user2.address)).to.equal(ethers.BigNumber.from(0));
        });
        it('Test transfer(w/ signature) w/ zero(0) number', async () => {
            const amounToTransfer = 0;
            const feeToPay = 0;
            const nonce = Date.now();

            const signature = SignHelper.signTransfer(
                3,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                user1.address,
                amounToTransfer,
                feeToPay,
                nonce
            );
            let input = await MiniCoin.connect(owner).populateTransaction[
                'transfer(address,address,uint256,uint256,uint256,bytes)'
            ](owner.address, user1.address, amounToTransfer, feeToPay, nonce, signature, { from: owner.address });
            await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
        });
        it('Test reserve(w/ signature) w/ zero(0) number', async () => {
            const amounToReserve = 0;
            const feeToPay = 0;
            const nonce = Date.now();
            const blockNumber = await provider.blockNumber;
            const expirationBlock = blockNumber + 2000;

            const signature = SignHelper.signReserve(
                4,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                user1.address,
                owner.address,
                amounToReserve,
                feeToPay,
                nonce,
                expirationBlock
            );
            const input = await MiniCoin.connect(owner).populateTransaction[
                'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
            ](
                owner.address,
                user1.address,
                owner.address,
                amounToReserve,
                feeToPay,
                nonce,
                expirationBlock,
                signature,
                { from: owner.address, gasLimit: ethers.utils.hexlify(3000000) }
            );
            await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
        });
        it('Test approve() w/ zero(0) number', async () => {
            const amount = 0;
            const input = await MiniCoin.connect(owner).populateTransaction.approve(MiniCoin.address, amount);
            await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);

            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(0));
        });
        it('Test increaseAllowance() w/ zero(0) number', async () => {
            const amount = 0;
            const input = await MiniCoin.connect(owner).populateTransaction.approve(
                MiniCoin.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            const inputIncreaseAllowance = await MiniCoin.connect(owner).populateTransaction.increaseAllowance(
                MiniCoin.address,
                amount
            );
            await TestHelper.checkResult(inputIncreaseAllowance, MiniCoin.address, owner, ethers, provider, 0);

            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(10000));
        });
        it('Test decreaseAllowance() w/ zero(0) number', async () => {
            const amount = 0;
            const inputAprove = await MiniCoin.connect(owner).populateTransaction.approve(
                MiniCoin.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.checkResult(inputAprove, MiniCoin.address, owner, ethers, provider, 0);
            const input = await MiniCoin.connect(owner).populateTransaction.decreaseAllowance(MiniCoin.address, amount);
            await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);

            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(10000));
        });
    });

    describe('Test overflow on different fn()', () => {
        it('Test burn() w/ overflow', async () => {
            const amount = 2 ** 256;
            let msg;
            try {
                const inputBurn = await MiniCoin.connect(owner).populateTransaction['burn(uint256)'](amount);
                msg = await TestHelper.checkResult(inputBurn, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no overflow';
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal('no overflow');
        });
        it('Test burn(w/ signature) w/ overflow', async () => {
            const amount = 2 ** 256;
            const feeToPay = 10;
            const nonce = Date.now();
            let msg;
            try {
                const signature = SignHelper.signBurn(
                    1,
                    network.config.chainId,
                    MiniCoin.address,
                    owner.address,
                    owner.privateKey,
                    amount,
                    feeToPay,
                    nonce
                );
                let input = await MiniCoin.connect(owner).populateTransaction[
                    'burn(address,uint256,uint256,uint256,bytes)'
                ](owner.address, amount, feeToPay, nonce, signature, { from: owner.address });
                msg = await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no overflow';
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal('no overflow');
        });
        it('Test transfer() w/ overflow', async () => {
            const amount = 2 ** 256;
            let msg;
            try {
                const inputTransfer = await MiniCoin.connect(owner).populateTransaction['transfer(address,uint256)'](
                    user1.address,
                    amount,
                    { from: owner.address }
                );
                msg = await TestHelper.checkResult(inputTransfer, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no overflow';
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await MiniCoin.balanceOf(user1.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal('no overflow');
        });
        it('Test transferFrom() w/ overflow', async () => {
            const amount = 2 ** 256;
            const inputApprove = await MiniCoin.connect(owner).populateTransaction.approve(
                user1.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.checkResult(inputApprove, MiniCoin.address, owner, ethers, provider, 0);

            let msg;
            try {
                const inputTransfer = await MiniCoin.connect(user1).populateTransaction.transferFrom(
                    owner.address,
                    user2.address,
                    amount
                );
                msg = await TestHelper.checkResult(inputTransfer, MiniCoin.address, user1, ethers, provider, 0);
            } catch (err) {
                msg = 'no overflow';
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await MiniCoin.balanceOf(user2.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal('no overflow');
        });
        it('Test transfer(w/ signature) w/ overflow', async () => {
            const amount = 2 ** 256;
            const feeToPay = 10;
            const nonce = Date.now();

            let msg;
            try {
                const signature = SignHelper.signTransfer(
                    3,
                    network.config.chainId,
                    MiniCoin.address,
                    owner.address,
                    owner.privateKey,
                    user1.address,
                    amount,
                    feeToPay,
                    nonce
                );
                let input = await MiniCoin.connect(owner).populateTransaction[
                    'transfer(address,address,uint256,uint256,uint256,bytes)'
                ](owner.address, user1.address, amount, feeToPay, nonce, signature, { from: owner.address });
                msg = await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no overflow';
            }

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal('no overflow');
        });
        it('Test reserve(w/ signature) w/ overflow', async () => {
            const amount = 2 ** 256;

            const feeToPay = 10;
            const nonce = Date.now();
            const blockNumber = await provider.blockNumber;
            const expirationBlock = blockNumber + 2000;

            let msg;
            try {
                const signature = SignHelper.signReserve(
                    4,
                    network.config.chainId,
                    MiniCoin.address,
                    owner.address,
                    owner.privateKey,
                    user1.address,
                    owner.address,
                    amount,
                    feeToPay,
                    nonce,
                    expirationBlock
                );
                let input = await MiniCoin.connect(owner).populateTransaction[
                    'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
                ](owner.address, user1.address, owner.address, amount, feeToPay, nonce, expirationBlock, signature, {
                    from: owner.address
                });
                msg = await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no overflow';
            }

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal('no overflow');
        });
        it('Test approve() w/ overflow', async () => {
            const amount = 2 ** 256;
            let msg;
            try {
                const input = await MiniCoin.connect(owner).populateTransaction.approve(MiniCoin.address, amount);
                msg = await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no overflow';
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal('no overflow');
        });
        it('Test increaseAllowance() w/ overflow', async () => {
            const amount = 2 ** 256;
            const input = await MiniCoin.connect(owner).populateTransaction.approve(
                MiniCoin.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            let msg;
            try {
                const inputIncreaseAllowance = await MiniCoin.connect(owner).populateTransaction.increaseAllowance(
                    MiniCoin.address,
                    amount
                );
                msg = await TestHelper.checkResult(
                    inputIncreaseAllowance,
                    MiniCoin.address,
                    owner,
                    ethers,
                    provider,
                    0
                );
            } catch (err) {
                msg = 'no overflow';
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(10000));
            expect(msg).to.equal('no overflow');
        });
        it('Test decreaseAllowance() w/ overflow', async () => {
            const amount = 2 ** 256;
            const inputApprove = await MiniCoin.connect(owner).populateTransaction.approve(
                MiniCoin.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.checkResult(inputApprove, MiniCoin.address, owner, ethers, provider, 0);
            let msg;
            try {
                const input = await MiniCoin.connect(owner).populateTransaction.decreaseAllowance(
                    MiniCoin.address,
                    amount
                );
                msg = await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no overflow';
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(10000));
            expect(msg).to.equal('no overflow');
        });
    });

    describe('Test NaN on different fn()', () => {
        it('Test burn() w/ NaN', async () => {
            const amount = NaN;
            let msg;
            try {
                const inputBurn = await MiniCoin.connect(owner).populateTransaction['burn(uint256)'](amount);
                await TestHelper.checkResult(inputBurn, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no NaN';
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal('no NaN');
        });
        it('Test burn(w/ signature) w/ NaN', async () => {
            const amount = NaN;
            const feeToPay = 10;
            const nonce = Date.now();
            const signature = SignHelper.signBurn(
                1,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                amount,
                feeToPay,
                nonce
            );

            let msg;
            try {
                let input = await MiniCoin.connect(owner).populateTransaction[
                    'burn(address,uint256,uint256,uint256,bytes)'
                ](owner.address, amount, feeToPay, nonce, signature, { from: owner.address });
                msg = await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no NaN';
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal('no NaN');
        });
        it('Test transfer() w/ NaN', async () => {
            const amount = NaN;
            let msg;
            try {
                const inputTransfer = await MiniCoin.connect(owner).populateTransaction['transfer(address,uint256)'](
                    user1.address,
                    amount,
                    { from: owner.address }
                );
                await TestHelper.checkResult(inputTransfer, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no NaN';
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await MiniCoin.balanceOf(user1.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal('no NaN');
        });
        it('Test transferFrom() w/ NaN', async () => {
            const amount = NaN;
            const inputApprove = await MiniCoin.connect(owner).populateTransaction.approve(
                user1.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.checkResult(inputApprove, MiniCoin.address, owner, ethers, provider, 0);
            let msg;
            try {
                const inputTransfer = await MiniCoin.connect(user1).populateTransaction.transferFrom(
                    owner.address,
                    user2.address,
                    amount
                );
                await TestHelper.checkResult(inputTransfer, MiniCoin.address, user1, ethers, provider, 0);
            } catch (err) {
                msg = 'no NaN';
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await MiniCoin.balanceOf(user2.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal('no NaN');
        });
        it('Test transfer(w/ signature) w/ NaN', async () => {
            const amount = NaN;
            const feeToPay = 10;
            const nonce = Date.now();

            let msg;
            try {
                const signature = SignHelper.signTransfer(
                    3,
                    network.config.chainId,
                    MiniCoin.address,
                    owner.address,
                    owner.privateKey,
                    user1.address,
                    amount,
                    feeToPay,
                    nonce
                );
                let input = await MiniCoin.connect(owner).populateTransaction[
                    'transfer(address,address,uint256,uint256,uint256,bytes)'
                ](owner.address, user1.address, amount, feeToPay, nonce, signature, { from: owner.address });
                msg = await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no NaN';
            }

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal('no NaN');
        });
        it('Test reserve(w/ signature) w/ NaN', async () => {
            const amount = NaN;

            const feeToPay = 10;
            const nonce = Date.now();
            const blockNumber = await provider.blockNumber;
            const expirationBlock = blockNumber + 2000;

            let msg;
            try {
                const signature = SignHelper.signReserve(
                    4,
                    network.config.chainId,
                    MiniCoin.address,
                    owner.address,
                    owner.privateKey,
                    user1.address,
                    owner.address,
                    amount,
                    feeToPay,
                    nonce,
                    expirationBlock
                );
                let input = await MiniCoin.connect(owner).populateTransaction[
                    'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
                ](owner.address, user1.address, owner.address, amount, feeToPay, nonce, expirationBlock, signature, {
                    from: owner.address
                });
                msg = await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no NaN';
            }

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal('no NaN');
        });
        it('Test approve() w/ NaN', async () => {
            const amount = NaN;
            let msg;
            try {
                const input = await MiniCoin.connect(owner).populateTransaction.approve(MiniCoin.address, amount);
                await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no NaN';
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal('no NaN');
        });
        it('Test increaseAllowance() w/ NaN', async () => {
            const amount = NaN;
            const input = await MiniCoin.connect(owner).populateTransaction.approve(
                MiniCoin.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            let msg;
            try {
                const inputIncreaseAllowance = await MiniCoin.connect(owner).populateTransaction.increaseAllowance(
                    MiniCoin.address,
                    amount
                );
                await TestHelper.checkResult(inputIncreaseAllowance, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no NaN';
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(10000));
            expect(msg).to.equal('no NaN');
        });
        it('Test decreaseAllowance() w/ NaN', async () => {
            const amount = NaN;
            const inputAprove = await MiniCoin.connect(owner).populateTransaction.approve(
                MiniCoin.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.checkResult(inputAprove, MiniCoin.address, owner, ethers, provider, 0);
            let msg;
            try {
                const input = await MiniCoin.connect(owner).populateTransaction.decreaseAllowance(
                    MiniCoin.address,
                    amount
                );
                await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no NaN';
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(10000));
            expect(msg).to.equal('no NaN');
        });
    });

    describe('Test empty string on different fn()', () => {
        it('Test burn() w/ empty string', async () => {
            const emptyString = '';
            let msg;
            try {
                const inputBurn = await MiniCoin.connect(owner).populateTransaction['burn(uint256)'](emptyString);
                msg = await TestHelper.checkResult(inputBurn, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no empty string';
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal('no empty string');
        });
        it('Test burn(w/ signature) w/ empty string', async () => {
            const emptyString = '';
            const feeToPay = 10;
            const nonce = Date.now();
            const signature = SignHelper.signBurn(
                1,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                emptyString,
                feeToPay,
                nonce
            );

            let msg;
            try {
                let input = await MiniCoin.connect(owner).populateTransaction[
                    'burn(address,uint256,uint256,uint256,bytes)'
                ](owner.address, emptyString, feeToPay, nonce, signature, { from: owner.address });
                msg = await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no empty string';
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal('no empty string');
        });
        it('Test transfer() w/ empty string', async () => {
            const emptyString = '';
            let msg;
            try {
                const inputTransfer = await MiniCoin.connect(owner).populateTransaction['transfer(address,uint256)'](
                    user1.address,
                    emptyString,
                    { from: owner.address }
                );
                msg = await TestHelper.checkResult(inputTransfer, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no empty string';
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await MiniCoin.balanceOf(user1.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal('no empty string');
        });
        it('Test transferFrom() w/ empty string', async () => {
            const emptyString = '';
            const inputApprove = await MiniCoin.connect(owner).populateTransaction.approve(
                user1.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.checkResult(inputApprove, MiniCoin.address, owner, ethers, provider, 0);

            let msg;
            try {
                const inputTransfer = await MiniCoin.connect(user1).populateTransaction.transferFrom(
                    owner.address,
                    user2.address,
                    emptyString
                );
                msg = await TestHelper.checkResult(inputTransfer, MiniCoin.address, user1, ethers, provider, 0);
            } catch (err) {
                msg = 'no empty string';
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await MiniCoin.balanceOf(user2.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal('no empty string');
        });
        it('Test transfer(w/ signature) w/ empty string', async () => {
            const emptyString = '';
            const feeToPay = 10;
            const nonce = Date.now();

            let msg;
            try {
                const signature = SignHelper.signTransfer(
                    3,
                    network.config.chainId,
                    MiniCoin.address,
                    owner.address,
                    owner.privateKey,
                    user1.address,
                    emptyString,
                    feeToPay,
                    nonce
                );
                let input = await MiniCoin.connect(owner).populateTransaction[
                    'transfer(address,address,uint256,uint256,uint256,bytes)'
                ](owner.address, user1.address, emptyString, feeToPay, nonce, signature, { from: owner.address });
                msg = await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no empty string';
            }

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal('no empty string');
        });
        it('Test reserve(w/ signature) w/ empty string', async () => {
            const emptyString = '';

            const feeToPay = 10;
            const nonce = Date.now();
            const blockNumber = await provider.blockNumber;
            const expirationBlock = blockNumber + 2000;

            let msg;
            try {
                const signature = SignHelper.signReserve(
                    4,
                    network.config.chainId,
                    MiniCoin.address,
                    owner.address,
                    owner.privateKey,
                    user1.address,
                    owner.address,
                    emptyString,
                    feeToPay,
                    nonce,
                    expirationBlock
                );
                let input = await MiniCoin.connect(owner).populateTransaction[
                    'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
                ](
                    owner.address,
                    user1.address,
                    owner.address,
                    emptyString,
                    feeToPay,
                    nonce,
                    expirationBlock,
                    signature,
                    { from: owner.address }
                );
                msg = await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no empty string';
            }

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal('no empty string');
        });
        it('Test approve() w/ empty string', async () => {
            const emptyString = '';
            let msg;
            try {
                const input = await MiniCoin.connect(owner).populateTransaction.approve(MiniCoin.address, emptyString);
                msg = await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no empty string';
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal('no empty string');
        });
        it('Test increaseAllowance() w/ empty string', async () => {
            const emptyString = '';
            const input = await MiniCoin.connect(owner).populateTransaction.approve(
                MiniCoin.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            let msg;
            try {
                const inputIncreaseAllowance = await MiniCoin.connect(owner).populateTransaction.increaseAllowance(
                    MiniCoin.address,
                    emptyString
                );
                msg = await TestHelper.checkResult(
                    inputIncreaseAllowance,
                    MiniCoin.address,
                    owner,
                    ethers,
                    provider,
                    0
                );
            } catch (err) {
                msg = 'no empty string';
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(10000));
            expect(msg).to.equal('no empty string');
        });
        it('Test decreaseAllowance() w/ empty string', async () => {
            const emptyString = '';
            const inputApprove = await MiniCoin.connect(owner).populateTransaction.approve(
                MiniCoin.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.checkResult(inputApprove, MiniCoin.address, owner, ethers, provider, 0);
            let msg;
            try {
                const input = await MiniCoin.connect(owner).populateTransaction.decreaseAllowance(
                    MiniCoin.address,
                    emptyString
                );
                msg = await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no empty string';
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(10000));
            expect(msg).to.equal('no empty string');
        });
    });
    describe('Test random string on different fn()', () => {
        it('Test burn() w/ random string', async () => {
            var chance = new Chance();
            const randomString = chance.string({ alpha: true, numeric: false, symbols: false, length: 10 });
            let msg;
            try {
                const inputBurn = await MiniCoin.connect(owner).populateTransaction['burn(uint256)'](randomString);
                msg = await TestHelper.checkResult(inputBurn, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no random string';
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal('no random string');
        });
        it('Test burn(w/ signature) w/ random string', async () => {
            var chance = new Chance();
            const randomString = chance.string({ alpha: true, numeric: false, symbols: false, length: 10 });

            const feeToPay = 10;
            const nonce = Date.now();
            const signature = SignHelper.signBurn(
                1,
                network.config.chainId,
                MiniCoin.address,
                owner.address,
                owner.privateKey,
                randomString,
                feeToPay,
                nonce
            );

            let msg;
            try {
                let input = await MiniCoin.connect(owner).populateTransaction[
                    'burn(address,uint256,uint256,uint256,bytes)'
                ](owner.address, randomString, feeToPay, nonce, signature, { from: owner.address });
                msg = await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no random string';
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal('no random string');
        });
        it('Test transfer() w/ random string', async () => {
            var chance = new Chance();
            const randomString = chance.string({ alpha: true, numeric: false, symbols: false, length: 10 });

            let msg;
            try {
                const inputTransfer = await MiniCoin.connect(owner).populateTransaction['transfer(address,uint256)'](
                    user1.address,
                    randomString,
                    { from: owner.address }
                );
                msg = await TestHelper.checkResult(inputTransfer, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no random string';
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await MiniCoin.balanceOf(user1.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal('no random string');
        });
        it('Test transferFrom() w/ random string', async () => {
            var chance = new Chance();
            const randomString = chance.string({ alpha: true, numeric: false, symbols: false, length: 10 });

            const inputApprove = await MiniCoin.connect(owner).populateTransaction.approve(
                user1.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.checkResult(inputApprove, MiniCoin.address, owner, ethers, provider, 0);

            let msg;
            try {
                const inputTransfer = await MiniCoin.connect(user1).populateTransaction.transferFrom(
                    owner.address,
                    user2.address,
                    randomString
                );
                msg = await TestHelper.checkResult(inputTransfer, MiniCoin.address, user1, ethers, provider, 0);
            } catch (err) {
                msg = 'no random string';
            }
            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(await MiniCoin.balanceOf(user2.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal('no random string');
        });
        it('Test transfer(w/ signature) w/ random string', async () => {
            var chance = new Chance();
            const randomString = chance.string({ alpha: true, numeric: false, symbols: false, length: 10 });

            const feeToPay = 10;
            const nonce = Date.now();

            let msg;
            try {
                const signature = SignHelper.signTransfer(
                    3,
                    network.config.chainId,
                    MiniCoin.address,
                    owner.address,
                    owner.privateKey,
                    user1.address,
                    randomString,
                    feeToPay,
                    nonce
                );
                let input = await MiniCoin.connect(owner).populateTransaction[
                    'transfer(address,address,uint256,uint256,uint256,bytes)'
                ](owner.address, user1.address, randomString, feeToPay, nonce, signature, { from: owner.address });
                msg = await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no random string';
            }

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal('no random string');
        });
        it('Test reserve(w/ signature) w/ random string', async () => {
            var chance = new Chance();
            const randomString = chance.string({ alpha: true, numeric: false, symbols: false, length: 10 });

            const feeToPay = 10;
            const nonce = Date.now();
            const blockNumber = await provider.blockNumber;
            const expirationBlock = blockNumber + 2000;

            let msg;
            try {
                const signature = SignHelper.signReserve(
                    4,
                    network.config.chainId,
                    MiniCoin.address,
                    owner.address,
                    owner.privateKey,
                    user1.address,
                    owner.address,
                    randomString,
                    feeToPay,
                    nonce,
                    expirationBlock
                );
                let input = await MiniCoin.connect(owner).populateTransaction[
                    'reserve(address,address,address,uint256,uint256,uint256,uint256,bytes)'
                ](
                    owner.address,
                    user1.address,
                    owner.address,
                    randomString,
                    feeToPay,
                    nonce,
                    expirationBlock,
                    signature,
                    { from: owner.address }
                );
                msg = await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no random string';
            }

            expect(await MiniCoin.balanceOf(owner.address)).to.equal(ethers.BigNumber.from(originalBalance));
            expect(msg).to.equal('no random string');
        });
        it('Test approve() w/ random string', async () => {
            var chance = new Chance();
            const randomString = chance.string({ alpha: true, numeric: false, symbols: false, length: 10 });
            let msg;
            try {
                const input = await MiniCoin.connect(owner).populateTransaction.approve(MiniCoin.address, randomString);
                msg = await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no random string';
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(0));
            expect(msg).to.equal('no random string');
        });
        it('Test increaseAllowance() w/ random string', async () => {
            var chance = new Chance();
            const randomString = chance.string({ alpha: true, numeric: false, symbols: false, length: 10 });
            const input = await MiniCoin.connect(owner).populateTransaction.approve(
                MiniCoin.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            let msg;
            try {
                const inputIncreaseAllowance = await MiniCoin.connect(owner).populateTransaction.increaseAllowance(
                    MiniCoin.address,
                    randomString
                );
                msg = await TestHelper.checkResult(
                    inputIncreaseAllowance,
                    MiniCoin.address,
                    owner,
                    ethers,
                    provider,
                    0
                );
            } catch (err) {
                msg = 'no random string';
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(10000));
            expect(msg).to.equal('no random string');
        });
        it('Test decreaseAllowance() w/ random string', async () => {
            var chance = new Chance();
            const randomString = chance.string({ alpha: true, numeric: false, symbols: false, length: 10 });
            const inputApprove = await MiniCoin.connect(owner).populateTransaction.approve(
                MiniCoin.address,
                ethers.BigNumber.from(10000)
            );
            await TestHelper.checkResult(inputApprove, MiniCoin.address, owner, ethers, provider, 0);
            let msg;
            try {
                const input = await MiniCoin.connect(owner).populateTransaction.decreaseAllowance(
                    MiniCoin.address,
                    randomString
                );
                msg = await TestHelper.checkResult(input, MiniCoin.address, owner, ethers, provider, 0);
            } catch (err) {
                msg = 'no random string';
            }
            expect(await MiniCoin.allowance(owner.address, MiniCoin.address)).to.equal(ethers.BigNumber.from(10000));
            expect(msg).to.equal('no random string');
        });
    });
});
