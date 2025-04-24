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
    const tokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // Replace with actual token address
    const uri = ""; // Replace with your ERC1155 metadata URI

    const Insurance = await ethers.getContractFactory("Insurance");
    const insurance = await Insurance.deploy(tokenAddress, uri);
    await insurance.waitForDeployment();

    const contractAddress = await insurance.getAddress();

    console.log(`Insurance deployed to: ${contractAddress}`);

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
