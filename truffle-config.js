require('babel-register');
require('babel-polyfill');
require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');
const mnemonic = process.env.MNEMONIC
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },
    bsctestnet: {
      provider: () => new HDWalletProvider(mnemonic, `https://data-seed-prebsc-1-s1.binance.org:8545`),
      network_id: 97,
      confirmations: 10,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    kovan: {
      provider: function() {
        return new HDWalletProvider(
          mnemonic, // Array of account private keys
          `https://kovan.infura.io/v3/${INFURA_PROJECT_ID}`// Url to an Ethereum Node
        )
      },
      gas: 5000000,
      gasPrice: 5000000000, // 5 gwei
      network_id: 42
    },
    main: {
      provider: function() {
        return new HDWalletProvider(
          mnemonic, // Array of account private keys
          `https://main.infura.io/v3/${INFURA_PROJECT_ID}`// Url to an Ethereum Node
        )
      },
      gas: 5000000,
      gasPrice: 5000000000, // 5 gwei
      network_id: 1
    },
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(
          mnemonic, // Array of account private keys
          `https://rinkeby.infura.io/v3/${INFURA_PROJECT_ID}`// Url to an Ethereum Node
        )
      },
      gas: 5000000,
      gasPrice: 5000000000, // 5 gwei
      network_id: 4
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(
          mnemonic, // Array of account private keys
          `https://ropsten.infura.io/v3/${INFURA_PROJECT_ID}`// Url to an Ethereum Node
        )
      },
      gas: 5000000,
      gasPrice: 5000000000, // 5 gwei
      network_id: 3,
      timeoutBlocks: 600,
    }
  },
  contracts_directory: './src/backEnd/contracts/',
  contracts_build_directory: './src/backEnd/abis/',
  migrations_directory: './src/backEnd/migrations/',
  test_directory: './src/backEnd/test/',
  compilers: {
    solc: {
      version: ">=0.6.0 <0.8.0",
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
}