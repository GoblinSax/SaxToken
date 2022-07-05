const {
    getInput
} = require("./utils/cli");

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log("deployer: ", deployer.address);
    const balanceOfDeployer = await deployer.getBalance()
    console.log(`deployer balance: ${balanceOfDeployer.toString()}`)
    const ownerAddress = deployer.address

    // We get the contract to deploy
    const VestingWallet = await ethers.getContractFactory("VestingWallet");
    const networkName = hre.network.name
    
    const tokenNetworkNameDict = {
        'rinkeby': '0x823eb131b7a8bcc8fca4adc59f0392c8eb412d07',
        'mainnet': '0x4170B069C1f2E6b706e23fc51aDAd38d43CD6eE0' 
    }

    console.log(`networkName ${networkName}`)
    let sax = tokenNetworkNameDict[`${networkName}`] ? tokenNetworkNameDict[`${networkName}`] : '0x823eb131b7a8bcc8fca4adc59f0392c8eb412d07'

    let {
        recipient,
        vestingAmount
    } = await getInput()

    //---yarg inputs
    // let recipient = ownerAddress
    // let vestingAmount = (100 * (10 ** 18)).toString()
    //---yarg inputs

    let vestingBegin = 1656720000
    let vestingCliff = vestingBegin + (60 * 60 * 24 * 365)
    let vestingEnd = vestingBegin + (60 * 60 * 24 * 365 * 3)

    const vestingWallet = await VestingWallet.deploy(
        sax,
        recipient,
        vestingAmount,
        vestingBegin,
        vestingCliff,
        vestingEnd, { gasLimit: 4100000 }
    )
    await vestingWallet.deployed();
    console.log("vestingWallet deployedTo: ", vestingWallet.address);
    console.log(`vestingWallet constructor: 
    vestingWallet.address: ${vestingWallet.address}
    sax: ${sax}
    recipient: ${recipient}
    vestingAmount: ${vestingAmount}
    vestingBegin: ${vestingBegin}
    vestingCliff: ${vestingCliff}
    vestingEnd: ${vestingEnd}`);

    console.log(`npx hardhat clean && npx hardhat verify --network "${networkName}" "${vestingWallet.address}" "${sax}" "${recipient}" "${vestingAmount}" "${vestingBegin}" "${vestingCliff}" "${vestingEnd}" `);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });