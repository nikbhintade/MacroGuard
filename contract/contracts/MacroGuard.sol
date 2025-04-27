// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {IMacroGuard} from "./IMacroGuard.sol";

import {IJsonApi} from "@flarenetwork/flare-periphery-contracts/coston/IJsonApi.sol";
import {ContractRegistry} from "@flarenetwork/flare-periphery-contracts/coston/ContractRegistry.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

struct DataTransportObject {
    string indicator;
    uint256 value;
}

contract MacroGuard is IMacroGuard, ERC1155 {
    event PolicyCreated(uint256 id, address provider);
    event PolicyPurchased(uint256 id, address buyer, uint256 premium);
    event PolicyStatusUpdated(uint256 policyId, Status newStatus);

    uint256 s_currentPolicyId;
    IERC20 s_token;
    mapping(string => uint256) indicatorsValues;
    mapping(string => uint256[]) indicatorToPolicy;
    mapping(uint256 => Policy) policies;

    constructor(address token, string memory _uri) ERC1155(_uri) {
        s_token = IERC20(token);
    }

    function createPolicy(
        uint256 premium,
        uint256 noOfPolicies,//
        uint256 coverage,
        uint256 strikePrice,//
        uint256 startDate,//
        uint256 period,//
        bool isHigher,//
        string calldata indicator //
    ) external returns (uint256) {
        require(bytes(indicator).length > 0, "indicator is empty");
        // require(indicatorsValues[indicator] != 0, "indicator not available");

        require(premium > 0, "premium must be > 0");
        require(noOfPolicies > 0, "noOfPolicies must be > 0");
        require(coverage > 0, "coverage must be > 0");
        require(strikePrice > 0, "strikePrice must be > 0");
        require(startDate >= 0, "startDate must be >= 0");
        require(period > 0, "period must be > 0");

        uint256 totalCoverage = noOfPolicies * coverage;

        require(s_token.transferFrom(msg.sender, address(this), totalCoverage), "Token transfer failed");

        uint256 startTimestamp = block.timestamp + startDate;

        policies[s_currentPolicyId] = Policy({
            id: s_currentPolicyId,
            provider: msg.sender,
            premium: premium,
            coverage: coverage,
            status: Status.Created,
            strikePrice: strikePrice,
            startDate: startTimestamp,
            endDate: startTimestamp + period,
            currentSupply: 0,
            totalSupply: noOfPolicies,
            indicator: indicator,
            isHigher: isHigher
        });

        indicatorToPolicy[indicator].push(s_currentPolicyId);

        emit PolicyCreated(s_currentPolicyId, msg.sender);

        return s_currentPolicyId++;
    }

    function buyPolicy(uint256 id) external {
        Policy storage policy = policies[id];
        require(policy.totalSupply > 0, "Policy does not exist");
        require(policy.currentSupply < policy.totalSupply, "Exceeds total supply");
        require(policy.startDate > block.timestamp, "Can't buy this policy yet");

        bool success = s_token.transferFrom(msg.sender, policy.provider, policy.premium);
        require(success, "Premium transfer failed");

        policy.currentSupply += 1; // Now this change persists

        _mint(msg.sender, id, 1, "");

        emit PolicyPurchased(id, msg.sender, policy.premium);
    }

    function redeemPolicy(uint256 id) external {
        // get policy
        Policy memory policy = policies[id];

        // check if msg.sender owns a policy
        require(balanceOf(msg.sender, id) > 0, "don't have any policy");

        // check if policy is claimable
        require(policy.status == Status.Claimable, "only claimable policies can be redeemed");

        // burn the token
        _burn(msg.sender, id, 1);

        // send the coverage amount
        s_token.transfer(msg.sender, policy.coverage);
    }

    function expirePolicy(uint256 id) external {
        // Get policy
        Policy storage policy = policies[id];

        // Check if the sender is the provider
        require(msg.sender == policy.provider, "only provider can access this");

        // Check if the policy's end date has passed
        if (policy.endDate < block.timestamp) {
            // If the policy is claimable, revert
            if (policy.status == Status.Claimable) {
                revert("can't expire a claimable policy");
            } else {
                // Update the policy status to expired
                policy.status = Status.Voided;
                emit PolicyStatusUpdated(id, Status.Voided);

                // Transfer the appropriate amount to the provider
                s_token.transfer(policy.provider, policy.totalSupply * policy.coverage);
            }
        } else {
            // If the policy is not expired yet, calculate the amount to return
            uint256 unboughtPolicies = policy.totalSupply - policy.currentSupply;
            uint256 amountToReturn = policy.coverage * unboughtPolicies;

            // Ensure the provider gets the right amount for unbought policies
            s_token.transfer(policy.provider, amountToReturn);
        }
    }

    function updateData(IJsonApi.Proof calldata data) external {
        DataTransportObject memory dto = abi.decode(data.data.responseBody.abi_encoded_data, (DataTransportObject));

        // Update the indicator value
        indicatorsValues[dto.indicator] = dto.value;

        uint256[] memory indicatorPolicies = indicatorToPolicy[dto.indicator];
        uint256 arrLength = indicatorPolicies.length;

        for (uint256 i = 0; i < arrLength; i++) {
            uint256 policyId = indicatorPolicies[i];
            Policy storage policy = policies[policyId]; // Access the policy via its ID

            if (policy.isHigher) {
                if (dto.value >= policy.strikePrice) {
                    policy.status = Status.Claimable;
                    emit PolicyStatusUpdated(policyId, Status.Claimable);
                }
            } else {
                if (dto.value <= policy.strikePrice) {
                    policy.status = Status.Claimable;
                    emit PolicyStatusUpdated(policyId, Status.Claimable);
                }
            }
        }
    }

    function isJsonApiProofValid(IJsonApi.Proof calldata _proof) private view returns (bool) {
        // Inline the check for now until we have an official contract deployed
        return ContractRegistry.auxiliaryGetIJsonApiVerification().verifyJsonApi(_proof);
    }

    function abiSignatureHack(DataTransportObject calldata dto) public pure {}

    // TODO: create on-chain dynamic NFT with these details.

    function getPolicy(uint256 id) external view returns (Policy memory) {
        return policies[id];
    }

    function getCurrentPolicyId() external view returns (uint256) {
        return s_currentPolicyId;
    }

    function getIndicatorValue(string calldata indicator) external view returns (uint256) {
        return indicatorsValues[indicator];
    }

    function getTokensOfUser(address user) external view returns (uint256[] memory) {
        uint256[] memory ownedTokenIds = new uint256[](s_currentPolicyId);
        uint256 count = 0;

        for (uint256 i = 0; i < s_currentPolicyId; i++) {
            if (balanceOf(user, i) > 0) {
                ownedTokenIds[count] = i;
                count++;
            }
        }

        // Resize the array to fit the number of owned token IDs
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = ownedTokenIds[i];
        }

        return result;
    }
}
