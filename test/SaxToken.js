const {
    expect,
    assert,
    shouldFail
} = require("chai");
const {
    ethers
} = require("hardhat");


const SUCCESS_CODE = 0
const FAILURE_NON_WHITELIST = 1
const SUCCESS_MESSAGE = 'SUCCESS'
const FAILURE_NON_WHITELIST_MESSAGE = 'The transfer was restricted due to white list configuration.'
const UNKNOWN_ERROR = 'Unknown Error Code'

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

    describe("ERC1404.sol Correct setup", () => {
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

    describe("ERC1404.sol Core", () => {
        it("owner should transfer to Alice and update balances", async () => {
            const transferAmount = ethers.utils.parseEther("100");
            let aliceBalance = await contract.balanceOf(aliceAddress);
            expect(aliceBalance).to.equal(0);
            await contract.connect(owner).addAdmin(ownerAddress);
            await contract.connect(owner).addToWhitelist(ownerAddress, 1);
            await contract.connect(owner).transfer(aliceAddress, transferAmount);
            aliceBalance = await contract.balanceOf(aliceAddress);
            expect(aliceBalance).to.equal(transferAmount);
        });
        // test cases 
    });

    describe("ERC1404.sol Restrictions", () => {
        it("should fail with non whitelisted accounts", async () => {
            await contract.connect(owner).addAdmin(ownerAddress);
            // Both not on white list - should fail
            let failureCode = await contract.connect(owner).detectTransferRestriction(bobAddress, aliceAddress, 100);
            let failureMessage = await contract.connect(owner).messageForTransferRestriction(failureCode)

            expect(failureCode).to.equal(FAILURE_NON_WHITELIST);
            expect(failureMessage).to.equal(FAILURE_NON_WHITELIST_MESSAGE);

            // Only one added to white list 20 - should fail
            await contract.connect(owner).addToWhitelist(accounts[5].address, 20)
            failureCode = await contract.connect(owner).detectTransferRestriction(accounts[5].address, accounts[6].address, 100)
            failureMessage = await contract.connect(owner).messageForTransferRestriction(failureCode)
            expect(failureCode).equal(FAILURE_NON_WHITELIST)
            expect(failureMessage).equal(FAILURE_NON_WHITELIST_MESSAGE)

            // Second added to white list 20 - should still fail
            await contract.connect(owner).addToWhitelist(accounts[6].address, 20)
            failureCode = await contract.connect(owner).detectTransferRestriction(accounts[5].address, accounts[6].address, 100)
            failureMessage = await contract.connect(owner).messageForTransferRestriction(failureCode)
            expect(failureCode).equal(FAILURE_NON_WHITELIST)
            expect(failureMessage).equal(FAILURE_NON_WHITELIST_MESSAGE)

            // Now allow whitelist 20 to send to itself
            await contract.connect(owner).updateOutboundWhitelistEnabled(20, 20, true)

            //heheheh

            // Should now succeed
            failureCode = await contract.connect(owner).detectTransferRestriction(accounts[5].address, accounts[6].address, 100)
            failureMessage = await contract.connect(owner).messageForTransferRestriction(failureCode)
            assert.equal(failureCode, SUCCESS_CODE, 'Both in same whitelist should pass')
            assert.equal(failureMessage, SUCCESS_MESSAGE, 'Should be success')

            // Second moved to whitelist 30 - should fail
            await contract.connect(owner).addToWhitelist(accounts[6].address, 30)
            failureCode = await contract.connect(owner).detectTransferRestriction(accounts[5].address, accounts[6].address, 100)
            failureMessage = await contract.connect(owner).messageForTransferRestriction(failureCode)
            assert.equal(failureCode, FAILURE_NON_WHITELIST, 'Both in different whitelist should get failure code')
            assert.equal(failureMessage, FAILURE_NON_WHITELIST_MESSAGE, 'Failure message should be valid for restriction')

            // Allow whitelist 20 to send to 30
            await contract.connect(owner).updateOutboundWhitelistEnabled(20, 30, true)

            // Should now succeed
            failureCode = await contract.connect(owner).detectTransferRestriction(accounts[5].address, accounts[6].address, 100)
            failureMessage = await contract.connect(owner).messageForTransferRestriction(failureCode)
            assert.equal(failureCode, SUCCESS_CODE, 'Both in same whitelist should pass')
            assert.equal(failureMessage, SUCCESS_MESSAGE, 'Should be success')

            // Reversing directions should fail
            failureCode = await contract.connect(owner).detectTransferRestriction(accounts[6].address, accounts[5].address, 100)
            failureMessage = await contract.connect(owner).messageForTransferRestriction(failureCode)
            assert.equal(failureCode, FAILURE_NON_WHITELIST, 'Both in different whitelist should get failure code')
            assert.equal(failureMessage, FAILURE_NON_WHITELIST_MESSAGE, 'Failure message should be valid for restriction')

            // Disable 20 sending to 30
            await contract.connect(owner).updateOutboundWhitelistEnabled(20, 30, false)

            // Should fail again
            failureCode = await contract.connect(owner).detectTransferRestriction(accounts[5].address, accounts[6].address, 100)
            failureMessage = await contract.connect(owner).messageForTransferRestriction(failureCode)
            assert.equal(failureCode, FAILURE_NON_WHITELIST, 'Both in different whitelist should get failure code')
            assert.equal(failureMessage, FAILURE_NON_WHITELIST_MESSAGE, 'Failure message should be valid for restriction')

            // Move second address back to whitelist 20 - should pass
            await contract.connect(owner).addToWhitelist(accounts[6].address, 20)
            failureCode = await contract.connect(owner).detectTransferRestriction(accounts[5].address, accounts[6].address, 100)
            failureMessage = await contract.connect(owner).messageForTransferRestriction(failureCode)
            assert.equal(failureCode, SUCCESS_CODE, 'Both in same whitelist should pass')
            assert.equal(failureMessage, SUCCESS_MESSAGE, 'Should be success')

            // First removed from whitelist
            await contract.connect(owner).removeFromWhitelist(accounts[5].address)
            failureCode = await contract.connect(owner).detectTransferRestriction(accounts[5].address, accounts[6].address, 100)
            failureMessage = await contract.connect(owner).messageForTransferRestriction(failureCode)
            assert.equal(failureCode, FAILURE_NON_WHITELIST, 'Both in different whitelist should get failure code')
            assert.equal(failureMessage, FAILURE_NON_WHITELIST_MESSAGE, 'Failure message should be valid for restriction')
        });
        // test cases 
        it('should allow whitelists to be removed', async () => {
            // Set account 1 as an admin
            await contract.connect(owner).addAdmin(accounts[1].address)

            // Both not on white list
            let failureCode = await contract.connect(owner).detectTransferRestriction(accounts[7].address, accounts[8].address, 100)
            let failureMessage = await contract.connect(owner).messageForTransferRestriction(failureCode)
            assert.equal(failureCode, FAILURE_NON_WHITELIST, 'Both Non-whitelisted should get failure code')
            assert.equal(failureMessage, FAILURE_NON_WHITELIST_MESSAGE, 'Failure message should be valid for restriction')

            // Lift the restriction
            await contract.connect(owner).disableRestrictions()

            // Should be successful now
            failureCode = await contract.connect(owner).detectTransferRestriction(accounts[7].address, accounts[8].address, 100)
            failureMessage = await contract.connect(owner).messageForTransferRestriction(failureCode)
            assert.equal(failureCode, SUCCESS_CODE, 'Restrictions disabled should pass anyone')
            assert.equal(failureMessage, SUCCESS_MESSAGE, 'Should be success')
        })

        it('should handle unknown error codes', async () => {
            let failureMessage = await contract.connect(owner).messageForTransferRestriction(101)
            assert.equal(failureMessage, UNKNOWN_ERROR, 'Should be unknown error code for restriction')
        })
    });

    describe("ERC1404.sol Transfers", () => {
        it('Should allow the owner to send to anyone regardless of whitelist', async () => {

            // Set account 1 as an admin
            await contract.connect(owner).addAdmin(accounts[1].address)

            // Send to some non-whitelisted accounts
            await contract.connect(owner).transfer(accounts[7].address, 100)
            await contract.connect(owner).transfer(accounts[8].address, 100)
            await contract.connect(owner).transfer(accounts[9].address, 100)
        })

        it('Initial transfers should fail but succeed after white listing', async () => {

            // Set account 1 as an admin
            await contract.connect(owner).addAdmin(accounts[1].address)

            // Send some initial tokens to account 5
            await contract.connect(owner).transfer(accounts[5].address, 10000)

            // Try to send to account 2
            await expect(
                contract.connect(accounts[5]).transfer(accounts[2].address, 100)
            ).to.be.revertedWith(FAILURE_NON_WHITELIST_MESSAGE)

            // Approve a transfer from account 5 and then try to spend it from account 2
            await contract.connect(accounts[5]).approve(accounts[2].address, 100)
            await expect(
                contract.connect(accounts[2]).transferFrom(accounts[5].address, accounts[2].address, 100)
            ).to.be.revertedWith(FAILURE_NON_WHITELIST_MESSAGE)

            // Add address 5 to whitelist
            await contract.connect(accounts[1]).addToWhitelist(accounts[5].address, 20)

            // Try to send to account 2 should still fail
            await expect(
                contract.connect(accounts[5]).transfer(accounts[2].address, 100)
            ).to.be.revertedWith(FAILURE_NON_WHITELIST_MESSAGE)
            await expect(
                contract.connect(accounts[2]).transferFrom(accounts[5].address, accounts[2].address, 100)
            ).to.be.revertedWith(FAILURE_NON_WHITELIST_MESSAGE)

            // Move address 2 to whitelist
            await contract.connect(accounts[1]).addToWhitelist(accounts[2].address, 20)

            // Try to send to account 2 should still fail
            await expect(
                contract.connect(accounts[5]).transfer(accounts[2].address, 100)
            ).to.be.revertedWith(FAILURE_NON_WHITELIST_MESSAGE)
            await expect(
                contract.connect(accounts[2]).transferFrom(accounts[5].address, accounts[2].address, 100)
            ).to.be.revertedWith(FAILURE_NON_WHITELIST_MESSAGE)

            // Now allow whitelist 20 to send to itself
            await contract.connect(accounts[1]).updateOutboundWhitelistEnabled(20, 20, true)

            // Should succeed
            await contract.connect(accounts[5]).transfer(accounts[2].address, 100)
            await contract.connect(accounts[2]).transferFrom(accounts[5].address, accounts[2].address, 100)

            // Now account 2 should have 200 tokens
            let balance = await contract.connect(owner).balanceOf(accounts[2].address)
            assert.equal(balance, '200', 'Transfers should have been sent')

            // Remove account 2 from the white list
            await contract.connect(accounts[1]).removeFromWhitelist(accounts[2].address)

            // Should fail trying to send back to account 5 from 2
            await expect(
                contract.connect(accounts[2]).transfer(accounts[5].address, 100)
            ).to.be.revertedWith(FAILURE_NON_WHITELIST_MESSAGE)

            // Should fail with approved transfer from going back to account 5 from 2 using approval
            await contract.connect(accounts[2]).approve(accounts[5].address, 100)
            await expect(
                contract.connect(accounts[5]).transferFrom(accounts[2].address, accounts[5].address, 100)
            ).to.be.revertedWith(FAILURE_NON_WHITELIST_MESSAGE)
        })

    })

    describe('Restrictable.sol', () => {
        it('should deploy', async () => {

            assert.equal(contract !== null, true, 'Contract should be deployed')
        })

        it('should default to restriction enabled and be changeable', async () => {


            // Check initial value
            let isRestricted = await contract.isRestrictionEnabled()
            assert.equal(isRestricted, true, 'Should be restricted by default')

            // Let the owner update
            await contract.connect(accounts[0]).disableRestrictions()

            // Should now be disabled
            isRestricted = await contract.isRestrictionEnabled()
            assert.equal(isRestricted, false, 'Should be disabled by admin')
        })

        it('should only allow owner to update', async () => {


            await expect(contract.connect(accounts[5]).disableRestrictions()).to.be.reverted
            await expect(contract.connect(accounts[6]).disableRestrictions()).to.be.reverted
        })

        // it('should trigger events', async () => {


        //     // Turn it off
        //     let ret = await contract.disableRestrictions({
        //         from: accounts[0]
        //     })
        //     expectEvent.inLogs(ret.logs, 'RestrictionsDisabled', {
        //         owner: accounts[0]
        //     })
        // })

        it('should fail to be disabled on the second try', async () => {


            // First time should succeed
            await contract.connect(accounts[0]).disableRestrictions()

            // Second time should fail
            await expect(contract.connect(accounts[0]).disableRestrictions()).to.be.reverted
        })
    })
});