import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-etherscan";
import dotenv from 'dotenv';

dotenv.config();

const INFURA = process.env.INFURA_ENDPOINT;
const key = process.env.PRIVATE_KEY;
const etherscanKey = process.env.ETHERSCAN_API_KEY;

const config: HardhatUserConfig = {
  solidity: {
    compilers: [{version: "0.8.17"}]
  },
  networks: {
    goerli: {
      url: INFURA,
      accounts: [`0x${key}`]
    }
  },
  etherscan: {
    apiKey: etherscanKey
  }
};

export default config;
