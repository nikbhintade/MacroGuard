import { ethers, run, web3 } from "hardhat";
import {
    prepareAttestationRequestBase,
    retrieveDataAndProofBase,
    submitAttestationRequest,
} from "./Base";

const {
    JQ_VERIFIER_URL_TESTNET,
    JQ_VERIFIER_API_KEY_TESTNET,
    COSTON2_DA_LAYER_URL,
} = process.env;

async function deployAndVerifyContract() {
    const tokenName = "Test Token";
    const tokenSymbol = "TT";

    const TestToken = await ethers.getContractFactory("TestToken");
    const testToken = await TestToken.deploy(tokenName, tokenSymbol);
    await testToken.waitForDeployment();

    const tokenAddress = await testToken.getAddress();

    console.log(`Test token deployed to: ${tokenAddress}`);

    await run("verify:verify", {
        address: tokenAddress,
        constructorArguments: [tokenName, tokenAddress],
    });

    const uri = ""; // Replace with your ERC1155 metadata URI
    // NOTICE: There is no need for URI as these ERC1155 token will have
    // dynamic images with SVG.

    const MacroGuard = await ethers.getContractFactory("MacroGuard");
    const macroGuard = await MacroGuard.deploy(tokenAddress, uri);
    await macroGuard.waitForDeployment();

    const contractAddress = await macroGuard.getAddress();

    console.log(`MacroGuard deployed to: ${contractAddress}`);

    await run("verify:verify", {
        address: contractAddress,
        constructorArguments: [tokenAddress, uri],
    });
}

async function main() {
    await deployAndVerifyContract();
}

main().then(() => {
    process.exit(0);
});
