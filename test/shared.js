require('dotenv').config({ path: __dirname + '/.env.development' });
const { ethers, network, addressBook } = require('hardhat');
const { expect, use } = require('chai');
const { solidity } = require('ethereum-waffle');
use(solidity);

const NAME = 'mini';
const SYMBOL = 'mini';
const DECIMALS = 18;
const TOTALSUPPLY = ethers.utils.parseUnits('100000000000', DECIMALS);
const VERSION = '1.0';
const VERSION_712 = '1.0';

const STANDARD_MINT_AMOUNT = ethers.utils.parseEther('1000');

let skipInitializeContracts = false;

// LogLevel 0: No logs, 1: Recap of expected rewards, 2: full by block expected rewards math
if (process.env.LOGLEVEL == undefined) process.env.LOGLEVEL = 0;

const setupProviderAndWallet = async () => {
    let provider;
    if (network.name === 'hardhat') {
        provider = ethers.provider;
    } else if (network.name === 'kaleido') {
        const rpcUrl = {
            url: `https://${process.env.RPC_KALEIDO_ENDPOINT}`,
            user: process.env.RPC_KALEIDO_USER,
            password: process.env.RPC_KALEIDO_PASS
        };
        provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    } else {
        provider = new ethers.providers.JsonRpcProvider(network.config.url);
    }
    const owner = new ethers.Wallet(
        ethers.Wallet.fromMnemonic(network.config.accounts.mnemonic, `m/44'/60'/0'/0/0`).privateKey,
        provider
    );
    const user1 = new ethers.Wallet(
        ethers.Wallet.fromMnemonic(network.config.accounts.mnemonic, `m/44'/60'/0'/0/1`).privateKey,
        provider
    );
    const user2 = new ethers.Wallet(
        ethers.Wallet.fromMnemonic(network.config.accounts.mnemonic, `m/44'/60'/0'/0/2`).privateKey,
        provider
    );
    const user3 = new ethers.Wallet(
        ethers.Wallet.fromMnemonic(network.config.accounts.mnemonic, `m/44'/60'/0'/0/3`).privateKey,
        provider
    );
    return [provider, owner, user1, user2, user3];
};

const setupContractTesting = async (owner) => {
    if (network.name !== 'hardhat') {
        initialBlockGATE = await ethers.provider.getBlockNumber();
    }
    const FactoryMiniCoin = await ethers.getContractFactory('MiniCoin');
    let MiniCoin;
    if (network.name === 'hardhat') {
        MiniCoin = await FactoryMiniCoin.deploy();

        await MiniCoin.initialize(owner.address, NAME, SYMBOL, TOTALSUPPLY);
    } else {
        const MiniCoinAddress = await addressBook.retrieveContract('UpgradeableMiniCoin', network.name);

        MiniCoin = await new ethers.Contract(MiniCoinAddress, FactoryMiniCoin.interface, owner.address);
        if (!skipInitializeContracts) {
            try {
                await MiniCoin.name();
            } catch (e) {
                await MiniCoin.initialize(owner.address, NAME, SYMBOL, TOTALSUPPLY);
            }
        }
    }
    return [MiniCoin];
};

const txn = async (input, to, sender, ethers, provider) => {
    const txCount = await provider.getTransactionCount(sender.address);
    const rawTx = {
        chainId: network.config.chainId,
        nonce: ethers.utils.hexlify(txCount),
        to: to,
        value: 0x00,
        gasLimit: ethers.utils.hexlify(3000000),
        gasPrice: network.name !== 'kaleido' ? ethers.utils.hexlify(25000000000) : ethers.utils.hexlify(0),
        data: input.data
    };
    const rawTransactionHex = await sender.signTransaction(rawTx);
    const { hash } = await provider.sendTransaction(rawTransactionHex);
    return await provider.waitForTransaction(hash);
};

const checkResult = async (input, to, from, ethers, provider, errMsg) => {
    if (network.name === 'hardhat') {
        if (errMsg) {
            await expect(txn(input, to, from, ethers, provider)).to.be.revertedWith(errMsg);
        } else {
            result = await txn(input, to, from, ethers, provider);
            expect(result.status).to.equal(1 || errMsg);
        }
    } else {
        if (errMsg) {
            result = await txn(input, to, from, ethers, provider);
            expect(result.status).to.equal(0);
        } else {
            result = await txn(input, to, from, ethers, provider);
            expect(result.status).to.equal(1 || errMsg);
        }
    }
};

const waitForNumberOfBlock = async (provider, numberOfBlock) => {
    const currentBlock = await provider.getBlockNumber();
    let temp = await provider.getBlockNumber();
    while (temp < currentBlock + numberOfBlock) {
        if (network.name === 'hardhat') {
            // Mine 1 block
            await provider.send('evm_mine');
        } else {
            // wait 15 seconds
            await new Promise((resolve) => setTimeout(resolve, 15000));
        }
        temp = await provider.getBlockNumber();
    }
};

module.exports = {
    // CONSTANTS
    NAME,
    SYMBOL,
    DECIMALS,
    TOTALSUPPLY,
    VERSION,
    VERSION_712,
    STANDARD_MINT_AMOUNT,
    // FUNCTIONS
    setupProviderAndWallet,
    setupContractTesting,
    txn,
    checkResult,
    waitForNumberOfBlock
};
