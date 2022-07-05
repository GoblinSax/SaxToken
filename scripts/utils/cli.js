const inquirer = require('inquirer');
let privateKey = process.env.GRINGOTTS_PRI_KEY

if (!privateKey) {
    console.log('provide private key env variable key!')
    process.exit(0)
}

async function getInput() {
    let {
        recipient
    } = await inquirer.prompt([{
        name: "recipient",
        message: "recipient address",
        type: "string",
    }, ])

    let {
        vestingAmount
    } = await inquirer.prompt([{
        name: "vestingAmount",
        message: "enter vesting amount",
        type: "number",
    }])
    vestingAmount = (BigInt(vestingAmount) * (10n ** 18n)).toString()

    return {
        recipient,
        vestingAmount,
    }
}

module.exports = {
    getInput
}