import {ethers} from "hardhat";

async function main() {
    const SIZE = 1024;
    const cappedSet = await ethers.deployContract("CappedSet", [SIZE]);
    await cappedSet.waitForDeployment();
    console.log(`CappedSet size = ${SIZE}`)
    console.log(`CappedSet deployed to address: ${await cappedSet.getAddress()}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
