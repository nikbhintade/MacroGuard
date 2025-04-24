// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {IInsurance} from "./IInsurance.sol";

import {IJsonApi} from "@flarenetwork/flare-periphery-contracts/coston/IJsonApi.sol";
import {ContractRegistry} from "@flarenetwork/flare-periphery-contracts/coston/ContractRegistry.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

struct DataTransportObject {
    string indicator;
    uint256 timestamp;
    uint256 value;
}

abstract contract Insurance is IInsurance, ERC1155 {
    event PolicyCreated(uint256 id, address provider);

    uint256 s_currentPolicyId;
    IERC20 s_token;
    mapping(string => uint256) indicatorsValues;
    mapping(string => uint256[]) indicatorToPolicy;
    mapping(uint256 => Policy) policies;

    constructor(address token, string memory uri) ERC1155(uri) {
        s_token = IERC20(token);
    }

    function createPolicy(
        uint256 premium,
        uint256 noOfPolicies,
        uint256 coverage,
        uint256 strikePrice,
        uint256 startDate,
        uint256 period,
        bool isIncrease,
        string calldata indicator
    ) external returns (uint256) {
        // transfer from coverage for all the polcies
        s_token.transferFrom(msg.sender, address(this), noOfPolicies * coverage);
        // create policy

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
            isIncrease: isIncrease
        });

        emit PolicyCreated(s_currentPolicyId, msg.sender);

        // TODO: add Aave deposit function so that provider's tokens won't be dormant in the period of the lockup.

        return s_currentPolicyId;
    }

    function buyPolicy(uint256 id) external {
        // get policy
        Policy memory policy = policies[id];
        // check if total number of policies minted is less than
        require(policy.totalSupply <= policy.currentSupply, "exceeds total supply");
        // check if start date has passed
        require(policy.startDate > block.timestamp, "can't buy this policy");

        // transfer from premium
        s_token.transferFrom(msg.sender, address(this), policy.premium);

        // update current supply
        policy.currentSupply += 1;

        // mint token to buyer
        _mint(msg.sender, id, 1, bytes(""));
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
        // get policy
        Policy memory policy = policies[id];

        // check if provider
        require(msg.sender == policy.provider, "only provider can access this");

        // check if end date has passed
        if (policy.endDate < block.timestamp) {
            // if yes then check if policy is claimable
            if (policy.status == Status.Claimable) {
                revert("can't expire a claimable policy");
            } else {
                s_token.transfer(policy.provider, policy.totalSupply * policy.coverage);
            }
            // else send all the amount
        } else {
            uint256 unboughtPolicies = policy.totalSupply - policy.currentSupply;

            uint256 amountToReturn = policy.coverage * unboughtPolicies;

            s_token.transfer(policy.provider, unboughtPolicies * amountToReturn);
        }
    }

    function updateData(IJsonApi.Proof calldata data) external {
        // parse data
        DataTransportObject memory dto = abi.decode(data.data.responseBody.abi_encoded_data, (DataTransportObject));

        // update value in indicators mapping
        indicatorsValues[dto.indicator] = dto.value;

        // get all the policies that has that indicator
        uint256[] memory indicatorPolicies = indicatorToPolicy[dto.indicator];

        // get number of policies
        uint256 arrLength = indicatorPolicies.length;

        // check if the value has gonna above/below the strike price
        for (uint256 i = 0; i < arrLength; i++) {
            // get policy
            Policy memory policy = policies[i];

            if (policy.isIncrease) {
                if (dto.value >= policy.strikePrice) {
                    policy.status = Status.Claimable;
                }
            } else {
                
                if (dto.value <= policy.strikePrice) {
                    policy.status = Status.Claimable;
                }
            }
        }
    }

    function isJsonApiProofValid(IJsonApi.Proof calldata _proof) private view returns (bool) {
        // Inline the check for now until we have an official contract deployed
        return ContractRegistry.auxiliaryGetIJsonApiVerification().verifyJsonApi(_proof);
    }

    function abiSignatureHack(DataTransportObject calldata dto) public pure {}
}
