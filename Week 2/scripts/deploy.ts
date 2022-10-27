import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account: ", deployer.address);

  const balance = await deployer.getBalance();
  console.log('Account balance: ', balance.toString());

  const Library = await ethers.getContractFactory("Library");
  const lib = await Library.deploy();

  console.log("Library address: ", lib.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
