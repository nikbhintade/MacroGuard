import { ethers } from "hardhat";

const MACRO_GUARD_ADDRESS = "0xec4774B4F26cD511b8545348D4Bb00a1Ad9b44B9";
const TEST_TOKEN_ADDRESS = "0xeEf81df5961036265a336431232506824DcA9488";

async function createPolicy() {
    const block = await ethers.provider.getBlock("latest");

    // Get the timestamp of the block
    const timestamp = block?.timestamp;

    if (timestamp === null || timestamp === undefined) {
        throw new Error("Failed to retrieve block timestamp");
    }

    console.log("Current blockchain timestamp:", timestamp);

    const startTimestamp = timestamp + (7 * 24 * 60 * 60);

    const macroGaurd = await ethers.getContractAt(
        "MacroGuard",
        MACRO_GUARD_ADDRESS,
    );
    const testToken = await ethers.getContractAt(
        "TestToken",
        TEST_TOKEN_ADDRESS,
    );

    try {
        let tx;
        let receipt;

        // tx = await testToken.mint(ethers.parseUnits("10000000000", 18));
        // receipt = await tx.wait();
        // console.log("Transaction mined in block:", receipt.blockNumber);
        // console.log("Tokens minted successfully...");

        // tx = await testToken.approve(MACRO_GUARD_ADDRESS, ethers.parseUnits("100000000", 18));

        // tx = await macroGaurd.createPolicy(
        //     ethers.parseUnits("0.2", 18), // This converts 2 to 2 * 10^18
        //     10,
        //     ethers.parseUnits("15", 18),
        //     4200000,
        //     startTimestamp,
        //     365 * 24 * 60,
        //     false,
        //     "UNRATE",
        //     {
        //         gasLimit: 15000000, // Set the gas limit for the transaction (adjust as needed)
        //         // nonce: 41
        //     },
        // );

            

        // console.log("Transaction hash:", tx.hash);

        // // Wait for the transaction to be mined
        // receipt = await tx.wait();
        // console.log("Transaction mined in block:", receipt.blockNumber);
        // console.log("Policy created successfully!");
    } catch (error) {
        console.error("Error calling createPolicy:", error);
    }
}

async function main() {
    await createPolicy();
}

main().then(() => {
    process.exit(0);
});
