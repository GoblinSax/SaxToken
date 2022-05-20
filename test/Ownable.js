const {
    expect,
    assert,
    expectEvent
} = require("chai");
const {
    ethers
} = require("hardhat");


const SUCCESS_CODE = 0
const FAILURE_NON_WHITELIST = 1
const SUCCESS_MESSAGE = 'SUCCESS'
const FAILURE_NON_WHITELIST_MESSAGE = 'The transfer was restricted due to white list configuration.'
const UNKNOWN_ERROR = 'Unknown Error Code'

describe("Administratable.sol, Ownable.sol", () => {
    let contractFactory;
    let contract;
    let owner;
    let alice;
    let bob;
    let initialSupply;
    let ownerAddress;
    let aliceAddress;
    let bobAddress;
    let accounts
    beforeEach(async () => {
        accounts = await ethers.getSigners();
        [owner, alice, bob] = await ethers.getSigners();
        ownerAddress = await owner.getAddress();

        initialSupply = ethers.utils.parseEther("1000000");
        contractFactory = await ethers.getContractFactory("SaxToken");

        contract = await contractFactory.deploy(ownerAddress);

        aliceAddress = await alice.getAddress();
        bobAddress = await bob.getAddress();

    });


    describe("Ownable.sol", () => {
        it('should deploy', async () => {

            contract = await contractFactory.deploy(accounts[0].address);
            assert.equal(contract !== null, true, 'Contract should be deployed')

            // Current owner
            let current_owner = await contract.owner()
            assert.equal(current_owner, accounts[0].address, 'Default owner should be account 0')

            // Transfer to account 1
            await contract.transferOwnership(accounts[1].address)

            // Should have been updated
            current_owner = await contract.owner()
            assert.equal(current_owner, accounts[1].address, 'Updated owner should be account 1')
        })

        it('should deploy with a different owner', async () => {
            contract = await contractFactory.deploy(accounts[1].address);
            assert.equal(contract !== null, true, 'Contract should be deployed')

            // Current owner should not be the original caller
            let current_owner = await contract.owner()
            assert.equal(current_owner, accounts[1].address, 'Owner should be account 1')
        })
    });

    describe('Administratable.sol', () => {


        it('should allow adding and removing for owner', async () => {

            // Validate acct 1 is not an admin by default
            let isAdmin = await contract.isAdministrator(accounts[1].address)
            assert.equal(isAdmin, false, 'Account should not be admin by default')

            // Adding an admin to the list should be successful for the owner (address[0])
            await contract.addAdmin(accounts[1].address)
            isAdmin = await contract.isAdministrator(accounts[1].address)
            assert.equal(isAdmin, true, 'Owner should be able to add admin')

            // Removing the admin should be successful for the owner (address[0])
            await contract.removeAdmin(accounts[1].address)
            isAdmin = await contract.isAdministrator(accounts[1].address)
            assert.equal(isAdmin, false, 'Owner should be able to remove admin')
        })

        it('should preventing adding and removing for non-owner', async () => {

            // Validate acct 2 is not an admin by default
            let isAdmin = await contract.isAdministrator(accounts[2].address)
            assert.equal(isAdmin, false, 'Account should not be admin by default')

            // Adding an address to the list should fail for non-owner (address[1])
            await expect(contract.connect(accounts[1]).addAdmin(accounts[2].address)).to.be.reverted

            // Adding the address to admin list should not impact this - only owner can add other admins
            await contract.addAdmin(accounts[1].address)
            await expect(contract.connect(accounts[1]).addAdmin(accounts[2].address)).to.be.reverted

            // Verify a non-owner can't remove an admin (including itself)
            await expect(contract.connect(accounts[1]).removeAdmin(accounts[1].address)).to.be.reverted
            await expect(contract.connect(accounts[2]).removeAdmin(accounts[1].address)).to.be.reverted
        })

        it('should emit events for adding admins', async () => {
            let tx = await contract.connect(owner).addAdmin(accounts[3].address)

            await tx.wait()
            // console.log(JSON.stringify(tx, null, 2))
            // await expect(
            //     contract.connect(owner).addAdmin(accounts[3].address)
            // ).to.emit(contract, addAdmin).withArgs(accounts[3].address, accounts[0].address)

            //   expectEvent.inLogs(logs, 'AdminAdded', { addedAdmin: accounts[3].address, addedBy: accounts[0].address })
        })

        it('should emit events for removing admins', async () => {
            await contract.addAdmin(accounts[3].address)
            let tx = await contract.removeAdmin(accounts[3].address)
            await tx.wait()
            // console.log(JSON.stringify(tx, null, 2))

            // await expect(
            //     contract.removeAdmin(accounts[3].address)
            // ).to.emit(contract, removeAdmin).withArgs(accounts[3].address, accounts[0].address)

            //   expectEvent.inLogs(logs, 'AdminRemoved', { removedAdmin: accounts[3].address, removedBy: accounts[0].address })
        })

        it('should preventing adding an admin when already an admin', async () => {
            // The first add should succeed
            await contract.addAdmin(accounts[1].address)

            // The second add should fail
            await expect(contract.addAdmin(accounts[1].address)).to.be.reverted
        })

        it('should preventing removing an admin when it is not an admin', async () => {
            // Add an accct to the admin list
            await contract.addAdmin(accounts[1].address)

            // The first removal should succeed.
            await contract.removeAdmin(accounts[1].address)

            // The second removal should fail
            await expect(contract.removeAdmin(accounts[1].address)).to.be.reverted
        })
    })


});