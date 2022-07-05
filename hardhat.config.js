require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();

const {
  ADDRESS_1_PRI_KEY,
  ADDRESS_2_PRI_KEY,
  TEST_RINKEBY_NODE_URL,
  ETHERSCAN_KEY,
  MAINNET_NODE_URL,
  GRINGOTTS_PRI_KEY
} = process.env

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545/",
    },
    hardhat: {},
    rinkeby: {
      url: TEST_RINKEBY_NODE_URL,
      accounts: [ADDRESS_1_PRI_KEY, ADDRESS_2_PRI_KEY]
    },
    mainnet: {
      url: MAINNET_NODE_URL,
      accounts: [GRINGOTTS_PRI_KEY]
    }
  },
  mocha: {
    timeout: 40000
  },
  etherscan: {
    apiKey: ETHERSCAN_KEY
  }
};