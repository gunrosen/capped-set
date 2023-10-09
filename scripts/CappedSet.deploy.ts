import { ethers } from "hardhat";

async function main() {
  const SIZE = 1024;
  const lock = await ethers.deployContract("CappedSet", [SIZE]);

  await lock.waitForDeployment();

  console.log(
    `CappedSet deployed to ${lock.target}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
