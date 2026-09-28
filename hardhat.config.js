require("@nomicfoundation/hardhat-toolbox");

if (typeof process.loadEnvFile === "function") {
  process.loadEnvFile(".env");
}

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      evmVersion: "paris",
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },

  networks: {
    mstTestnet: {
      url: process.env.MST_RPC_URL,
      chainId: Number(process.env.MST_CHAIN_ID),
      accounts: [process.env.MST_PRIVATE_KEY]
    }
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};