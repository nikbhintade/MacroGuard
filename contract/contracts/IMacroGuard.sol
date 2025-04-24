// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {IJsonApi} from "@flarenetwork/flare-periphery-contracts/coston/IJsonApi.sol";

interface IMacroGuard {
    enum Status {
        Created,
        Claimable,
        Voided
    }

    struct Policy {
        uint256 id;
        address provider;
        uint256 premium;//
        uint256 coverage;//
        Status status;
        uint256 strikePrice;//
        uint256 startDate;//
        uint256 endDate;//
        uint256 currentSupply;//
        uint256 totalSupply;//
        string indicator;//
        bool isHigher;//
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
    ) external returns (uint256);

    function buyPolicy(uint256 id) external;

    function redeemPolicy(uint256 id) external;

    function expirePolicy(uint256 id) external;

    function updateData(IJsonApi.Proof calldata data) external;
}
