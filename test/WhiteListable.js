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


const NO_WHITELIST = 0
const FAILURE_INVALID_WHITELIST_MSG = 'Invalid whitelist ID supplied'

describe("WhiteListable.sol", () => {
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

    describe('WhiteListable.sol', () => {
        it('should allow adding and removing an address to a whitelist', async () => {


            // First allow acct 1 be an administrator
            await contract.connect(accounts[0]).addAdmin(accounts[1].address)

            // Check acct 2 whitelist should default to NONE
            let existingWhitelist = await contract.addressWhitelists(accounts[2].address)
            assert.equal(existingWhitelist, NO_WHITELIST, 'Addresses should have no whitelist to start off with')

            // Add the acct 2 to whitelist 10 - using account 1
            await contract.connect(accounts[1]).addToWhitelist(accounts[2].address, 10)

            // Validate it got updated
            let updatedWhitelist = await contract.addressWhitelists(accounts[2].address)
            assert.equal(updatedWhitelist, 10, 'Addresses should have updated whitelist')

            // Update the whitelist for acct 2 to id 20
            await contract.connect(accounts[1]).addToWhitelist(accounts[2].address, 20)

            // Validate it got updated
            updatedWhitelist = await contract.addressWhitelists(accounts[2].address)
            assert.equal(updatedWhitelist, 20, 'Addresses should have updated whitelist after existing was changed')

            // Remove the address from whitelist
            await contract.connect(accounts[1]).removeFromWhitelist(accounts[2].address)

            // Validate it got updated
            updatedWhitelist = await contract.addressWhitelists(accounts[2].address)
            assert.equal(updatedWhitelist, NO_WHITELIST, 'Addresses should have been removed from whitelist')
        })

        it('should only allow admins adding or removing on whitelists', async () => {
            // Non admin should fail adding to white list
            await expect(
                contract.connect(accounts[4]).addToWhitelist(accounts[2].address, 10)
            ).to.be.reverted

            // Now allow acct 4 be an administrator
            await contract.connect(accounts[0]).addAdmin(accounts[4].address)

            // Adding as admin should work
            await contract.connect(accounts[4]).addToWhitelist(accounts[2].address, 10)

            // Removing as non-admin should fail
            await expect(
                contract.connect(accounts[8]).removeFromWhitelist(accounts[2].address)
            ).to.be.reverted

            // Removing as admin should work
            await contract.connect(accounts[4]).removeFromWhitelist(accounts[2].address)

            // Now remove acct 4 from the admin list
            await contract.connect(accounts[0]).removeAdmin(accounts[4].address)

            // It should fail again now that acct 4 is non-admin
            await expect(
                contract.connect(accounts[4]).addToWhitelist(accounts[2].address, 10)
            ).to.be.reverted
        })

        it('should validate if addresses are not on a whitelist', async () => {


            // First allow acct 1 be an administrator
            await contract.connect(accounts[0]).addAdmin(accounts[1].address)

            // Allow whitelist 10 to send to self
            await contract.connect(accounts[1]).updateOutboundWhitelistEnabled(10, 10, true)

            // Two addresses not on any white list
            let isValid = await contract.checkWhitelistAllowed(accounts[6].address, accounts[7].address)
            assert.equal(isValid, false, 'Two non white listed addresses should not be valid')

            // Add address 6
            await contract.connect(accounts[1]).addToWhitelist(accounts[6].address, 10)

            // Only first address on white list should fail
            isValid = await contract.checkWhitelistAllowed(accounts[6].address, accounts[7].address)
            assert.equal(isValid, false, 'First non white listed addresses should not be valid')

            // Remove again
            await contract.connect(accounts[1]).removeFromWhitelist(accounts[6].address)

            // Both should fail again
            isValid = await contract.checkWhitelistAllowed(accounts[6].address, accounts[7].address)
            assert.equal(isValid, false, 'Two non white listed addresses should not be valid')

            // Add address 7
            await contract.connect(accounts[1]).addToWhitelist(accounts[7].address, 10)

            // Only second address on white list should fail
            isValid = await contract.checkWhitelistAllowed(accounts[6].address, accounts[7].address)
            assert.equal(isValid, false, 'Second non white listed addresses should not be valid')

            // Remove second addr
            await contract.connect(accounts[1]).removeFromWhitelist(accounts[7].address)

            // Both should fail again
            isValid = await contract.checkWhitelistAllowed(accounts[6].address, accounts[7].address)
            assert.equal(isValid, false, 'Two non white listed addresses should not be valid')

            // Add both 6 and 7
            await contract.connect(accounts[1]).addToWhitelist(accounts[6].address, 10)
            await contract.connect(accounts[1]).addToWhitelist(accounts[7].address, 10)

            // Should be valid
            isValid = await contract.checkWhitelistAllowed(accounts[6].address, accounts[7].address)
            assert.equal(isValid, true, 'Both on same white list should be valid')

            // Update address 6 to a different white list
            await contract.connect(accounts[1]).addToWhitelist(accounts[6].address, 20)

            // Should fail
            isValid = await contract.checkWhitelistAllowed(accounts[6].address, accounts[7].address)
            assert.equal(isValid, false, 'Two addresses on separate white lists should not be valid')
        })

        // it('should trigger events', async () => {


        //     // First allow acct 1 to be an administrator
        //     await contract.addAdmin(accounts[1], {
        //         from: accounts[0]
        //     })

        //     // Check for initial add
        //     let ret = await contract.addToWhitelist(accounts[3], 20, {
        //         from: accounts[1]
        //     })
        //     expectEvent.inLogs(ret.logs, 'AddressAddedToWhitelist', {
        //         addedAddress: accounts[3],
        //         whitelist: '20',
        //         addedBy: accounts[1]
        //     })

        //     // Adding to second whitelist should remove from first and add to second
        //     ret = await contract.addToWhitelist(accounts[3], 30, {
        //         from: accounts[1]
        //     })
        //     expectEvent.inLogs(ret.logs, 'AddressRemovedFromWhitelist', {
        //         removedAddress: accounts[3],
        //         whitelist: '20',
        //         removedBy: accounts[1]
        //     })
        //     expectEvent.inLogs(ret.logs, 'AddressAddedToWhitelist', {
        //         addedAddress: accounts[3],
        //         whitelist: '30',
        //         addedBy: accounts[1]
        //     })

        //     // Removing from list should just trigger removal
        //     ret = await contract.removeFromWhitelist(accounts[3], {
        //         from: accounts[1]
        //     })
        //     expectEvent.inLogs(ret.logs, 'AddressRemovedFromWhitelist', {
        //         removedAddress: accounts[3],
        //         whitelist: '30',
        //         removedBy: accounts[1]
        //     })
        // })

        it('should validate outbound whitelist enabled flag', async () => {


            // Allow acct 1 to be an admin
            await contract.connect(accounts[0]).addAdmin(accounts[1].address)

            // Default should be disabled to self
            let existingOutboundEnabled = await contract.outboundWhitelistsEnabled(4, 4)
            assert.equal(existingOutboundEnabled, false, 'Default outbound should be disabled to self')

            // Default should be disabled to other random ID
            existingOutboundEnabled = await contract.outboundWhitelistsEnabled(4, 5)
            assert.equal(existingOutboundEnabled, false, 'Default outbound should be disabled to other')

            // Update so 4 is allowed to send to self
            await contract.connect(accounts[1]).updateOutboundWhitelistEnabled(4, 4, true)
            existingOutboundEnabled = await contract.outboundWhitelistsEnabled(4, 4)
            assert.equal(existingOutboundEnabled, true, 'Should be enabled')

            // 4 to 5 should still be disabled
            existingOutboundEnabled = await contract.outboundWhitelistsEnabled(4, 5)
            assert.equal(existingOutboundEnabled, false, 'Should be disabled')

            // Allow 4 to 5
            await contract.connect(accounts[1]).updateOutboundWhitelistEnabled(4, 5, true)
            existingOutboundEnabled = await contract.outboundWhitelistsEnabled(4, 5)
            assert.equal(existingOutboundEnabled, true, 'Should be enabled')

            // Backwards should fail
            existingOutboundEnabled = await contract.outboundWhitelistsEnabled(5, 4)
            assert.equal(existingOutboundEnabled, false, 'Should be disabled')

            // 5 should still not be able to send to self
            existingOutboundEnabled = await contract.outboundWhitelistsEnabled(5, 5)
            assert.equal(existingOutboundEnabled, false, 'Should be disabled')

            // Disable 4 to 5
            await contract.connect(accounts[1]).updateOutboundWhitelistEnabled(4, 5, false)
            existingOutboundEnabled = await contract.outboundWhitelistsEnabled(4, 5)
            assert.equal(existingOutboundEnabled, false, 'Should be disabled')

            // Disable 4 to self
            await contract.connect(accounts[1]).updateOutboundWhitelistEnabled(4, 4, false)
            existingOutboundEnabled = await contract.outboundWhitelistsEnabled(4, 4)
            assert.equal(existingOutboundEnabled, false, 'Should be disabled')
        })

        // it('should trigger events for whitelist enable/disable', async () => {


        //     await contract.addAdmin(accounts[1], {
        //         from: accounts[0]
        //     })

        //     // Verify logs for enabling outbound
        //     let ret = await contract.updateOutboundWhitelistEnabled(90, 100, true, {
        //         from: accounts[1]
        //     })
        //     expectEvent.inLogs(ret.logs, 'OutboundWhitelistUpdated', {
        //         updatedBy: accounts[1],
        //         sourceWhitelist: '90',
        //         destinationWhitelist: '100',
        //         from: false,
        //         to: true
        //     })

        //     // Verify logs for disabling outbound
        //     ret = await contract.updateOutboundWhitelistEnabled(90, 100, false, {
        //         from: accounts[1]
        //     })
        //     expectEvent.inLogs(ret.logs, 'OutboundWhitelistUpdated', {
        //         updatedBy: accounts[1],
        //         sourceWhitelist: '90',
        //         destinationWhitelist: '100',
        //         from: true,
        //         to: false
        //     })

        //     // Verify doing same thihng
        //     ret = await contract.updateOutboundWhitelistEnabled(90, 100, false, {
        //         from: accounts[1]
        //     })
        //     expectEvent.inLogs(ret.logs, 'OutboundWhitelistUpdated', {
        //         updatedBy: accounts[1],
        //         sourceWhitelist: '90',
        //         destinationWhitelist: '100',
        //         from: false,
        //         to: false
        //     })
        // })

        it('should not allow adding an address to invalid whitelist ID (0)', async () => {


            // First allow acct 1 be an administrator
            await contract.connect(accounts[0]).addAdmin(accounts[1].address)

            // Adding acct 2 to whitelist 0 should get rejected
            await expect(
                contract.connect(accounts[1]).addToWhitelist(accounts[2].address, NO_WHITELIST)).to.be.revertedWith(FAILURE_INVALID_WHITELIST_MSG)
        })

    })
});