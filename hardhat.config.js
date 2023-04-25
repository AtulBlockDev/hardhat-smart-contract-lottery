/** @type import('hardhat/config').HardhatUserConfig */
require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("hardhat-deploy");

const RPC_URL = process.env.RPC_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY
const ETHERSCAN_API = process.env.ETHERSCAN_API




module.exports = {
    solidity: {
        compilers: [
            {
                version: "0.8.7",
            },
            {
                version: "0.8.4",
            },
            {
                version: "0.8.0",
            },
        ],
    },
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            blockConfirmations: 1,
        },
        localhost: {
            chainId: 31337,
            blockConfirmations: 1,
        },

        goerli: {
            url: RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 5,
            blockConfirmations: 6,
        },
    },

    namedAccounts: {
        deployer: {
            default: 0,
        },
        player: {
            default: 1,
        },
    },
    etherscan: {
        apiKey: ETHERSCAN_API,
    },

    mocha: {
        timeout: 9000000,
    },
}
