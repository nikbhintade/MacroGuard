import { StarWarsCharacterListInstance } from "../../typechain-types";


const StarWarsCharacterList = artifacts.require("StarWarsCharacterList");




async function prepareAttestationRequest(
  apiUrl: string,
  postprocessJq: string,
  abiSignature: string
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
    requestBody
  );
}

async function retrieveDataAndProof(
  abiEncodedRequest: string,
  roundId: number
) {
  const url = `${COSTON2_DA_LAYER_URL}api/v1/fdc/proof-by-request-round-raw`;
  console.log("Url:", url, "n");
  return await retrieveDataAndProofBase(url, abiEncodedRequest, roundId);
}



async function interactWithContract(
  characterList: StarWarsCharacterListInstance,
  proof: any
) {
  console.log("Proof hex:", proof.response_hex, "\n");

  // A piece of black magic that allows us to read the response type from an artifact
  const IJsonApiVerification = await artifacts.require("IJsonApiVerification");
  const responseType =
    IJsonApiVerification._json.abi[0].inputs[0].components[1];
  console.log("Response type:", responseType, "\n");

  const decodedResponse = web3.eth.abi.decodeParameter(
    responseType,
    proof.response_hex
  );
  console.log("Decoded proof:", decodedResponse, "\n");
  const transaction = await characterList.addCharacter({
    merkleProof: proof.proof,
    data: decodedResponse,
  });
  console.log("Transaction:", transaction.tx, "\n");
  console.log(
    "Star Wars Characters:\n",
    await characterList.getAllCharacters(),
    "\n"
  );
}

async function main() {
  const data = await prepareAttestationRequest(
    apiUrl,
    postprocessJq,
    abiSignature
  );
  console.log("Data:", data, "\n");

  const abiEncodedRequest = data.abiEncodedRequest;
  const roundId = await submitAttestationRequest(abiEncodedRequest);

  const proof = await retrieveDataAndProof(abiEncodedRequest, roundId);

  const characterList: StarWarsCharacterListInstance =
    await deployAndVerifyContract();

  await interactWithContract(characterList, proof);
}

main().then(() => {
  process.exit(0);
});
