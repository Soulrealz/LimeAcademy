import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from 'dotenv';

dotenv.config();

const INFURA = process.env.INFURA_ENDPOINT;
const key = process.env.PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: {
    compilers: [{version: "0.8.17"}]
  },
  networks: {
    goerli: {
      url: INFURA,
      accounts: [`0x${key}`]
    }
  }
};

export default config;
