const {
    expect
} = require("chai");
const {
    ethers, network
} = require("hardhat");


describe("SaxToken.sol", () => {
    let contractFactory;
    let contract;
    let owner;
    let alice;
    let bob;
    let initialSupply;
    let ownerAddress;
    let aliceAddress;
    let bobAddress;

    beforeEach(async () => {

        [owner, alice, bob] = await ethers.getSigners();
        ownerAddress = await owner.getAddress();
        console.log(`ownerAddress ${ownerAddress}`)
        initialSupply = ethers.utils.parseEther("1000000");
        contractFactory = await ethers.getContractFactory("SaxToken");
        // contract = await contractFactory.deploy(initialSupply, ownerAddress, "Goblin Sax Token", "SaxToken");
        contract = await contractFactory.deploy(ownerAddress);

        aliceAddress = await alice.getAddress();
        console.log(`aliceAddress ${aliceAddress}`)
        bobAddress = await bob.getAddress();
        console.log(`bobAddress ${bobAddress}`)
    });

    describe("Correct setup", () => {
        it("should be named 'SAX", async () => {
            const name = await contract.name();
            expect(name).to.equal("SAX");
        });
        it("should have correct supply", async () => {
            const supply = await contract.totalSupply();
            expect(supply).to.equal(initialSupply);
        });
        it("owner should have all the supply", async () => {
            const ownerBalance = await contract.balanceOf(ownerAddress);
            expect(ownerBalance).to.equal(initialSupply);
        });

    });

    describe("Core", () => {
        it("owner should transfer to Alice and update balances", async () => {
            const transferAmount = ethers.utils.parseEther("100");
            let aliceBalance = await contract.balanceOf(aliceAddress);
            expect(aliceBalance).to.equal(0);
            await contract.connect(owner).addAdmin(ownerAddress);
            await contract.connect(owner).addToWhitelist(ownerAddress,1);
            await contract.connect(owner).transfer(aliceAddress, transferAmount);
            aliceBalance = await contract.balanceOf(aliceAddress);
            expect(aliceBalance).to.equal(transferAmount);
        });
      // test cases 

    });
});