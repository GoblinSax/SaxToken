async function main() {
    const [deployer] = await ethers.getSigners()
    console.log("deployer: ", deployer.address);
    const balanceOfDeployer =  await deployer.getBalance()
    console.log(`deployer balance: ${balanceOfDeployer.toString()}`)
    const ownerAddress = deployer.address 

    // We get the contract to deploy
    const SaxToken = await ethers.getContractFactory("SaxToken");
    const token = await SaxToken.deploy(ownerAddress);
    await token.deployed();
    console.log("token deployed to: ", token.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

