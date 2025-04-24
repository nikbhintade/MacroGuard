import { ethers } from "hardhat";
import { keccak256, toUtf8Bytes } from "ethers";

export interface DataTransportObject {
    indicator: string;
    timestamp: number;
    value: number;
}

export async function generateDummyProof(
    dto: DataTransportObject,
): Promise<any> {
    const abi = ethers.AbiCoder.defaultAbiCoder();

    // Encode the DataTransportObject
    const encodedDto = abi.encode(
        ["tuple(string indicator, uint256 timestamp, uint256 value)"],
        [[dto.indicator, dto.timestamp, dto.value]],
    );

    const dummyProof = {
        merkleProof: [
            ethers.keccak256(toUtf8Bytes("dummy1")),
            ethers.keccak256(toUtf8Bytes("dummy2")),
        ], // now real bytes32 values
        data: {
            attestationType: ethers.ZeroHash,
            sourceId: ethers.ZeroHash,
            votingRound: 1,
            lowestUsedTimestamp: 1234567890,
            requestBody: {
                url: "https://dummy.url",
                postprocessJq: ".data | .value",
                abi_signature:
                    "tuple(string indicator,uint256 timestamp,uint256 value)",
            },
            responseBody: {
                abi_encoded_data: encodedDto,
            },
        },
    };

    return dummyProof;
}