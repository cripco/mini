const { ethers, network, upgrades, addressBook } = require('hardhat');
const ScriptHelper = require('./helper');
const TestHelper = require('../test/shared');
const owner = "0x7B17116c5C56264a70B956FEC54E3a3736e08Af0";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log('\x1b[32m%s\x1b[0m', 'Connected to network: ', network.name);
    console.log('\x1b[32m%s\x1b[0m', 'Account address: ', deployer.address);
    console.log('\x1b[32m%s\x1b[0m', 'Account balance: ', (await deployer.getBalance()).toString());

    // Contract deployed with transparent proxy
    const UpgradeableMiniCoin = await ethers.getContractFactory('MiniCoin');
    const upgradeableMiniCoin = await upgrades.deployProxy(UpgradeableMiniCoin, [
        owner,
        TestHelper.NAME,
        TestHelper.SYMBOL,
        TestHelper.TOTALSUPPLY
    ]);
    await upgradeableMiniCoin.deployed();
    addressBook.saveContract(
        'UpgradeableMiniCoin',
        upgradeableMiniCoin.address,
        network.name,
        deployer.address,
        upgradeableMiniCoin.blockHash,
        upgradeableMiniCoin.blockNumber
    );
    console.log(
        '\x1b[32m%s\x1b[0m',
        'UpgradeableMiniCoin deployed at address: ',
        upgradeableMiniCoin.address
    );

    // Get ProxyAdmin address from .openzeppelin/
    const ProxyAdmin_Address = await addressBook.retrieveOZAdminProxyContract(network.config.chainId);
    console.log('Deployed using Proxy Admin contract address: ', ProxyAdmin_Address);
    addressBook.saveContract('ProxyAdmin', ProxyAdmin_Address, network.name, deployer.address);
    console.log('\x1b[32m%s\x1b[0m', 'Account balance: ', (await deployer.getBalance()).toString());

    // Get Logic/Implementation address from proxy admin contract
    const LogicMiniCoin = await ScriptHelper.getImplementation(
        upgradeableMiniCoin.address,
        ProxyAdmin_Address,
        deployer,
        ethers
    );
    console.log('Deployed using Logic/Implementation contract address: ', LogicMiniCoin);
    addressBook.saveContract('LogicMiniCoin', LogicMiniCoin, network.name, deployer.address);
    console.log('\x1b[32m%s\x1b[0m', 'Account balance: ', (await deployer.getBalance()).toString());

    console.log('Contract deployed!');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
