import { ethers, network } from "hardhat";
const {
    JQ_VERIFIER_URL_TESTNET,
    JQ_VERIFIER_API_KEY_TESTNET,
    COSTON2_DA_LAYER_URL,
} = process.env;

const FLARE_RPC_API_KEY = process.env.FLARE_RPC_API_KEY;

import {
    prepareAttestationRequestBase,
    retrieveDataAndProofBase,
    submitAttestationRequest,
} from "./Base";

const MACRO_GUARD_ADDRESS = "0xec4774B4F26cD511b8545348D4Bb00a1Ad9b44B9";
const TEST_TOKEN_ADDRESS = "0xeEf81df5961036265a336431232506824DcA9488";

const postprocessJq =
    `{indicator: .series_id, value: (.observations | map(select(.value != ".")) | last | .value | tonumber * 1000000)}`;
const abiSignature =
    `{"components":[{"internalType":"string","name":"indicator","type":"string"},{"internalType":"uint256","name":"value","type":"uint256"}],"internalType":"struct DataTransportObject","name":"dto","type":"tuple"}`;

const apiUrl = "https://macroguard.onrender.com/GDP";

// Configuration constants
const attestationTypeBase = "IJsonApi";
const sourceIdBase = "WEB2";
const verifierUrlBase = JQ_VERIFIER_URL_TESTNET;

async function prepareAttestationRequest(
    apiUrl: string,
    postprocessJq: string,
    abiSignature: string,
) {
    const requestBody = {
        url: apiUrl,
        postprocessJq: postprocessJq,
        abi_signature: abiSignature,
    };

    const url = `${verifierUrlBase}JsonApi/prepareRequest`;
    const apiKey = JQ_VERIFIER_API_KEY_TESTNET!;

    return await prepareAttestationRequestBase(
        url,
        apiKey,
        attestationTypeBase,
        sourceIdBase,
        requestBody,
    );
}

async function retrieveDataAndProof(
    abiEncodedRequest: string,
    roundId: number,
) {
    const url = `${COSTON2_DA_LAYER_URL}api/v1/fdc/proof-by-request-round-raw`;
    console.log("Url:", url, "n");
    return await retrieveDataAndProofBase(url, abiEncodedRequest, roundId);
}

async function updateDataOnContract() {
    const data = await prepareAttestationRequest(
        apiUrl,
        postprocessJq,
        abiSignature,
    );
    console.log("Data:", data, "\n");

    const abiEncodedRequest = data.abiEncodedRequest;
    const roundId = await submitAttestationRequest(abiEncodedRequest);

    const proof = await retrieveDataAndProof(abiEncodedRequest, roundId);
    console.log(`Proof hex: ${proof}`);

    // A piece of black magic that allows us to read the response type from an artifact
    const IJsonApiVerification = await artifacts.require(
        "IJsonApiVerification",
    );
    const responseType =
        IJsonApiVerification._json.abi[0].inputs[0].components[1];
    console.log("Response type:", responseType, "\n");

    const decodedResponse = web3.eth.abi.decodeParameter(
        responseType,
        proof.response_hex,
    );
    console.log("Decoded proof:", decodedResponse, "\n");

    const macroGuardArtifacts = await artifacts.require("MacroGuard");
    const macroGuardABI = macroGuardArtifacts.abi;

    const provider = new ethers.JsonRpcProvider(`https://coston2-api-tracer.flare.network/ext/C/rpc?x-apikey=${FLARE_RPC_API_KEY}`);


    const macroGaurd = await ethers.getContractAt(
        "MacroGuard",
        MACRO_GUARD_ADDRESS,
    );

    const transaction = await macroGaurd.updateData({
        merkleProof: proof.proof,
        data: decodedResponse,
    });

    console.log("Transaction:", transaction.tx, "\n");
    console.log(
        `get indicator value: ${await macroGaurd.getIndicatorValue("GDP")}`,
    );
}

async function main() {
    await updateDataOnContract();
}

main().then(() => {
    process.exit(0);
});
