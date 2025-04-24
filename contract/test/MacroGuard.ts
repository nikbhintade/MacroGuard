import { ethers } from "hardhat";
import "@nomicfoundation/hardhat-ethers";

// import { expect } from "chai";
import { TestToken } from "../typechain-types/contracts/TestToken";
import { IMacroGuard } from "../typechain-types/contracts/IMacroGuard"; // Assuming this is where your interface is defined

const {
    loadFixture,
    time,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

import {
    DataTransportObject,
    generateDummyProof,
} from "./helpers/DataTransportObject";
import { expect } from "chai";

describe("MacroGuard", function () {
    async function deployFixture() {
        let [owner, addr1, addr2] = await ethers.getSigners();

        const Token = await ethers.getContractFactory("TestToken");
        let token = await Token.deploy("Test Token", "TT");
        await token.waitForDeployment();

        await token.mint(ethers.parseUnits("1000000000", 18));
        await token.connect(addr1).mint(ethers.parseUnits("1000000000", 18));

        const MacroGuard = await ethers.getContractFactory("MacroGuard");
        let macroGuard = await MacroGuard.deploy(await token.getAddress(), "");
        await macroGuard.waitForDeployment();

        await token.approve(await macroGuard.getAddress(), ethers.MaxUint256);
        await token.connect(addr1).approve(
            await macroGuard.getAddress(),
            ethers.MaxUint256,
        );

        const dto: DataTransportObject = {
            indicator: "CPI",
            timestamp: 1713974400,
            value: 13900,
        };

        await macroGuard.updateData(await generateDummyProof(dto));

        const tx = await macroGuard.createPolicy(
            1000,
            1,
            100,
            5000,
            10,
            3600,
            true,
            "CPI",
        );

        await tx.wait();

        return { macroGuard, token, owner, addr1, addr2 };
    }

    describe("createPolicy", function () {
        it("should create a policy and emit event", async function () {
            const { macroGuard, owner } = await loadFixture(deployFixture);
            const tx = await macroGuard.createPolicy(
                ethers.parseUnits("10", 18),
                5,
                ethers.parseUnits("100", 18),
                2000,
                0,
                10000,
                true,
                "CPI",
            );

            await expect(tx).to.emit(macroGuard, "PolicyCreated").withArgs(
                1,
                owner.address,
            );
        });

        it("should create a valid policy", async function () {
            const { macroGuard } = await loadFixture(deployFixture);

            const tx = await macroGuard.createPolicy(
                1000,
                10,
                100,
                5000,
                0,
                3600,
                true,
                "CPI",
            );

            const receipt = await tx.wait();
            const event = receipt?.logs.find((log: any) =>
                log.eventName === "PolicyCreated"
            );

            expect(event).to.exist;
        });

        it("should fail for empty indicator", async function () {
            const { macroGuard } = await loadFixture(deployFixture);

            await expect(
                macroGuard.createPolicy(1000, 10, 100, 5000, 0, 3600, true, ""),
            ).to.be.revertedWith("indicator is empty");
        });

        it("should fail for unknown indicator", async function () {
            const { macroGuard } = await loadFixture(deployFixture);

            await expect(
                macroGuard.createPolicy(
                    1000,
                    10,
                    100,
                    5000,
                    0,
                    3600,
                    true,
                    "GDP",
                ),
            ).to.be.revertedWith("indicator not available");
        });

        it("should fail for zero values", async function () {
            const { macroGuard } = await loadFixture(deployFixture);

            await expect(
                macroGuard.createPolicy(0, 10, 100, 5000, 0, 3600, true, "CPI"),
            ).to.be.revertedWith("premium must be > 0");

            await expect(
                macroGuard.createPolicy(
                    1000,
                    0,
                    100,
                    5000,
                    0,
                    3600,
                    true,
                    "CPI",
                ),
            ).to.be.revertedWith("noOfPolicies must be > 0");

            await expect(
                macroGuard.createPolicy(
                    1000,
                    10,
                    0,
                    5000,
                    0,
                    3600,
                    true,
                    "CPI",
                ),
            ).to.be.revertedWith("coverage must be > 0");

            await expect(
                macroGuard.createPolicy(1000, 10, 100, 0, 0, 3600, true, "CPI"),
            ).to.be.revertedWith("strikePrice must be > 0");

            await expect(
                macroGuard.createPolicy(1000, 10, 100, 5000, 0, 0, true, "CPI"),
            ).to.be.revertedWith("period must be > 0");
        });
    });

    async function deployBuyPolicyFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        const Token = await ethers.getContractFactory("TestToken");
        const token = await Token.deploy("Test Token", "TT");
        await token.waitForDeployment();

        // Mint tokens to test accounts
        await token.mint(ethers.parseUnits("1000000000", 18)); // Owner
        await token.connect(addr1).mint(ethers.parseUnits("1000000000", 18)); // addr1 (buyer)

        const MacroGuard = await ethers.getContractFactory("MacroGuard");
        const macroGuard = await MacroGuard.deploy(
            await token.getAddress(),
            "",
        );
        await macroGuard.waitForDeployment();

        // Approvals for premium and coverage transfers
        await token.approve(await macroGuard.getAddress(), ethers.MaxUint256);
        await token.connect(addr1).approve(
            await macroGuard.getAddress(),
            ethers.MaxUint256,
        );

        // Update indicator data to make it valid for policy creation
        const dto: DataTransportObject = {
            indicator: "CPI",
            timestamp: Math.floor(Date.now() / 1000),
            value: 13900,
        };
        await macroGuard.updateData(await generateDummyProof(dto));

        // Create a policy
        const premium = 1000;
        const noOfPolicies = 2;
        const coverage = 100;
        const strikePrice = 5000;
        const startDateDelay = 60; // 60 seconds in the future
        const period = 3600; // 1 hour
        const isIncrease = true;
        const indicator = "CPI";

        const tx = await macroGuard.createPolicy(
            premium,
            noOfPolicies,
            coverage,
            strikePrice,
            startDateDelay,
            period,
            isIncrease,
            indicator,
        );

        const receipt = await tx.wait();
        const event = receipt!.logs.map((log) =>
            macroGuard.interface.parseLog(log)
        )
            .find((parsed) => parsed?.name === "PolicyCreated");

        const policyId = event?.args?.[0] ?? 0;

        return {
            macroGuard,
            token,
            owner,
            addr1,
            addr2,
            policyId,
            premium,
            noOfPolicies,
            coverage,
            strikePrice,
            startDateDelay,
        };
    }

    describe("MacroGuard: buyPolicy", () => {
        it("should allow user to successfully buy a policy", async () => {
            const { macroGuard, addr1, policyId, premium } = await loadFixture(
                deployBuyPolicyFixture,
            );

            const tx = await macroGuard.connect(addr1).buyPolicy(policyId);
            await expect(tx)
                .to.emit(macroGuard, "PolicyPurchased")
                .withArgs(policyId, addr1.address, premium);
        });

        it("should revert if policy does not exist", async () => {
            const { macroGuard, addr1 } = await loadFixture(
                deployBuyPolicyFixture,
            );

            await expect(macroGuard.connect(addr1).buyPolicy(999))
                .to.be.revertedWith("Policy does not exist");
        });
        it("should revert if policy has already sold out", async () => {
            const { macroGuard, addr1, token } = await loadFixture(
                deployBuyPolicyFixture,
            );

            // Create a 1-supply policy
            await macroGuard.connect(addr1).createPolicy(
                1000,
                1,
                100,
                5000,
                60,
                3600,
                true,
                "CPI",
            );
            const soldOutPolicyId = 1; // first one was 0

            await macroGuard.connect(addr1).buyPolicy(soldOutPolicyId);

            await expect(
                macroGuard.connect(addr1).buyPolicy(soldOutPolicyId),
            ).to.be.revertedWith("Exceeds total supply");
        });

        it("should revert if the start date has passed", async () => {
            const { macroGuard, addr1, policyId } = await loadFixture(
                deployBuyPolicyFixture,
            );

            // Fast-forward time past start date
            await ethers.provider.send("evm_increaseTime", [70]); // >60s
            await ethers.provider.send("evm_mine", []);

            await expect(macroGuard.connect(addr1).buyPolicy(policyId))
                .to.be.revertedWith("Can't buy this policy yet");
        });

        it("should revert if buyer lacks allowance", async () => {
            const { macroGuard, addr2, token, policyId } = await loadFixture(
                deployBuyPolicyFixture,
            );

            // Set allowance to zero
            await token.connect(addr2).approve(
                await macroGuard.getAddress(),
                0,
            );

            await expect(
                macroGuard.connect(addr2).buyPolicy(policyId),
            ).to.be.reverted; // don't expect a specific message for custom errors
        });

        it("should revert if premium transfer fails", async () => {
            const { macroGuard, policyId, addr2, token, addr1 } =
                await loadFixture(deployBuyPolicyFixture);

            // Drain addr2 balance by transferring all to addr1
            const balance = await token.balanceOf(addr2.address);
            await token.connect(addr2).transfer(addr1.address, balance);

            await expect(
                macroGuard.connect(addr2).buyPolicy(policyId),
            ).to.be.revertedWithCustomError(
                token,
                "ERC20InsufficientAllowance",
            );
        });
    });

    async function deployUpdateDataFixture() {
        const [owner, addr1] = await ethers.getSigners();

        const Token = await ethers.getContractFactory("TestToken");
        const token = await Token.deploy("Test Token", "TT");
        await token.waitForDeployment();

        await token.mint(ethers.parseUnits("1000000000", 18));
        await token.connect(addr1).mint(ethers.parseUnits("1000000000", 18));

        const MacroGuard = await ethers.getContractFactory("MacroGuard");
        const macroGuard = await MacroGuard.deploy(
            await token.getAddress(),
            "",
        );
        await macroGuard.waitForDeployment();

        // Approve tokens
        await token.approve(await macroGuard.getAddress(), ethers.MaxUint256);
        await token.connect(addr1).approve(
            await macroGuard.getAddress(),
            ethers.MaxUint256,
        );

        // Register initial indicator value for CPI
        const initialDto: DataTransportObject = {
            indicator: "CPI",
            timestamp: 1713974400,
            value: 13900,
        };

        const proof = await generateDummyProof(initialDto);
        await macroGuard.updateData(proof);

        // Create 2 policies tied to "CPI", one isIncrease, one not
        await macroGuard.createPolicy(
            1000, // premium
            1, // noOfPolicies
            100, // coverage
            14000, // strikePrice
            1000, // startDate (future)
            3600, // period
            true, // isIncrease
            "CPI",
        );

        await macroGuard.createPolicy(
            1000,
            1,
            100,
            13800,
            1000,
            3600,
            false, // isIncrease
            "CPI",
        );

        return { macroGuard, token, owner, addr1 };
    }

    describe("MacroGuard: updateData", function () {
        it("should update the indicator value correctly", async function () {
            const { macroGuard } = await deployUpdateDataFixture();

            const newDto = {
                indicator: "CPI",
                timestamp: Math.floor(Date.now() / 1000),
                value: 15000,
            };

            const proof = await generateDummyProof(newDto);
            await macroGuard.updateData(proof);

            const updated = await macroGuard.getIndicatorValue("CPI");
            expect(updated).to.equal(15000);
        });

        it("should set status to Claimable for isHigher=true when value >= strikePrice", async function () {
            const { macroGuard } = await deployUpdateDataFixture();

            const dto: DataTransportObject = {
                indicator: "CPI",
                timestamp: 1713974400,
                value: 15000, // >= strikePrice (14000)
            };

            const tx = await macroGuard.updateData(
                await generateDummyProof(dto),
            );
            await tx.wait();

            const policy = await macroGuard.getPolicy(0); // isHigher = true
            expect(policy.status).to.equal(1);

            const events = await macroGuard.queryFilter(
                macroGuard.filters.PolicyStatusUpdated(),
            );

            expect(events.length).to.be.greaterThan(0);
            expect(events[0].args.newStatus).to.equal(1);
        });

        it("should set status to Claimable for isHigher=false when value <= strikePrice", async function () {
            const { macroGuard } = await deployUpdateDataFixture();

            const dto: DataTransportObject = {
                indicator: "CPI",
                timestamp: 1713974400,
                value: 13000, // <= strikePrice (13800)
            };

            const tx = await macroGuard.updateData(
                await generateDummyProof(dto),
            );
            await tx.wait();

            const policy = await macroGuard.getPolicy(1); // isHigher = false
            expect(policy.status).to.equal(1);

            const events = await macroGuard.queryFilter(
                macroGuard.filters.PolicyStatusUpdated(),
            );
            const claimableEvents = events.filter((e) =>
                e.args.policyId === 1n
            ); // BigInt
            expect(claimableEvents[0].args.newStatus).to.equal(1);
        });

        it("should not set Claimable if value does not meet strike condition", async function () {
            const { macroGuard } = await deployUpdateDataFixture();

            const dto = {
                indicator: "CPI",
                timestamp: Math.floor(Date.now() / 1000),
                value: 13900, // Between 13800 and 14000
            };

            const proof = await generateDummyProof(dto);
            await macroGuard.updateData(proof);

            const policy0 = await macroGuard.getPolicy(0);
            const policy1 = await macroGuard.getPolicy(1);
            expect(policy0.status).to.not.equal(1);
            expect(policy1.status).to.not.equal(1);
        });
    });

    async function macroGuardFixture() {
        const [provider, buyer] = await ethers.getSigners();

        const Token = await ethers.getContractFactory("TestToken");
        const token = await Token.deploy("Mock", "MCK");

        await token.connect(provider).mint(10000);
        await token.connect(buyer).mint(10000);

        const MacroGuard = await ethers.getContractFactory("MacroGuard");
        const macro = await MacroGuard.deploy(await token.getAddress(), "");

        await token.connect(provider).approve(await macro.getAddress(), 10000);
        await token.connect(buyer).approve(await macro.getAddress(), 10000);

        const indicator = "inflation";
        const dto = {
            indicator,
            timestamp: (await time.latest()) - 10,
            value: 1500,
        };

        const proof = await generateDummyProof(dto);
        await macro.connect(provider).updateData(proof);

        await macro.connect(provider).createPolicy(
            50, // premium
            5, // noOfPolicies
            100, // coverage
            1000, // strikePrice
            0, // start immediately
            1, // 1 second duration for simplicity
            true,
            indicator,
        );

        return { macro, token, provider, buyer, policyId: 0, indicator };
    }

    describe("MacroGuard", function () {
        it("should revert if policy is claimable and expired", async () => {
            const { macro, provider, policyId, indicator } = await loadFixture(
                macroGuardFixture,
            );

            const dto = {
                indicator,
                timestamp: (await time.latest()),
                value: 2000, // meets `isHigher` condition
            };

            const proof = await generateDummyProof(dto);
            await macro.connect(provider).updateData(proof);

            await time.increase(2);
            await expect(macro.connect(provider).expirePolicy(policyId)).to.be
                .revertedWith("can't expire a claimable policy");
        });

        it("should not revert if policy is expired and not claimable", async () => {
            const { macro, provider, policyId, indicator } = await loadFixture(
                macroGuardFixture,
            );

            const dto = {
                indicator,
                timestamp: (await time.latest()),
                value: 500, // meets `isHigher` condition
            };

            const proof = await generateDummyProof(dto);
            await macro.connect(provider).updateData(proof);

            await time.increase(2);
            await expect(macro.connect(provider).expirePolicy(policyId))
                .to.emit(macro, "PolicyStatusUpdated")
                .withArgs(policyId, 2); // Status for expired and non-claimable
        });

        it("should transfer correct funds to the provider if policy is expired and not claimable", async () => {
            const { macro, provider, policyId, token } = await loadFixture(
                macroGuardFixture,
            );

            const balanceBefore = await token.balanceOf(provider.address);

            const dto = {
                indicator: "inflation",
                timestamp: (await time.latest()),
                value: 500, // meets `isHigher` condition
            };
            const proof = await generateDummyProof(dto);
            await macro.connect(provider).updateData(proof);

            await time.increase(2);
            await macro.connect(provider).expirePolicy(policyId);

            const balanceAfter = await token.balanceOf(provider.address);
            const policy = await macro.getPolicy(policyId);
            const expectedAmount = policy.totalSupply * policy.coverage;

            expect(balanceAfter - balanceBefore).to.equal(expectedAmount);
        });

        it("should revert if policy is not expired", async () => {
            const { macro, provider, policyId, indicator } = await loadFixture(
                macroGuardFixture,
            );

            const dto = {
                indicator,
                timestamp: (await time.latest()) + 10, // future timestamp
                value: 1500, // meets `isHigher` condition
            };

            const proof = await generateDummyProof(dto);
            await macro.connect(provider).updateData(proof);

            await expect(macro.connect(provider).expirePolicy(policyId)).to.be
                .revertedWith("can't expire a claimable policy");
        });

        it("should return the correct amount if some policies are not purchased", async () => {
            const { macro, provider, policyId, token } = await loadFixture(
                macroGuardFixture,
            );

            // Get the policy before expiration
            const policy = await macro.getPolicy(policyId);
            const balanceBefore = await token.balanceOf(provider.address);

            // Calculate the unbought policies
            const unboughtPolicies = policy.totalSupply - policy.currentSupply;
            const expectedAmount = policy.coverage * unboughtPolicies;

            // Expire the policy (before end date, should calculate and transfer funds for unbought policies)
            await macro.connect(provider).expirePolicy(policyId);

            const balanceAfter = await token.balanceOf(provider.address);

            // Ensure the provider gets the correct amount for unbought policies
            expect(balanceAfter - balanceBefore).to.equal(expectedAmount);
        });
    });

    async function macroGuardWithRedeemFixture() {
        const [provider, buyer, other] = await ethers.getSigners();

        const Token = await ethers.getContractFactory("TestToken");
        const token = await Token.deploy("Test Token", "TT");

        await token.connect(provider).mint(10000);
        await token.connect(buyer).mint(10000);
        await token.connect(other).mint(10000);

        const MacroGuard = await ethers.getContractFactory("MacroGuard");
        const macro = await MacroGuard.deploy(await token.getAddress(), "");

        await token.connect(provider).approve(await macro.getAddress(), 10000);
        await token.connect(buyer).approve(await macro.getAddress(), 10000);
        await token.connect(other).approve(await macro.getAddress(), 10000);

        const indicator = "inflation";
        const dto = {
            indicator,
            timestamp: (await time.latest()) - 10,
            value: 900,
        };

        let proof = await generateDummyProof(dto);
        await macro.connect(provider).updateData(proof);

        // Create a policy with increased duration (end time = 100 seconds)
        await macro.connect(provider).createPolicy(
            50, // premium
            5, // noOfPolicies
            100, // coverage
            1000, // strikePrice
            10, // start immediately
            100, // increase duration to 100 seconds
            true,
            indicator,
        );

        // Increase the time to ensure the policy is available for purchase
        const policy = await macro.getPolicy(0);
        const startDate = policy.startDate;
        const currentTime = await time.latest();

        // Ensure the start date is in the past for this policy to be available for purchase and redemption
        const updatedPolicy = await macro.getPolicy(0);

        // Purchase policies for the buyer
        await macro.connect(buyer).buyPolicy(0);

        return { macro, token, provider, buyer, other, policyId: 0 };
    }

    describe("MacroGuard - redeemPolicy", function () {
        it("should redeem the policy and transfer coverage to the user", async () => {
            const { macro, token, buyer, policyId, provider } =
                await loadFixture(
                    macroGuardWithRedeemFixture,
                );

            const indicator = "inflation";
            const dto = {
                indicator,
                timestamp: (await time.latest()) - 10,
                value: 1500,
            };

            let proof = await generateDummyProof(dto);
            await macro.connect(provider).updateData(proof);

            // Get the policy before redemption
            const policy = await macro.getPolicy(policyId);
            const balanceBefore = await token.balanceOf(buyer.address);

            // Ensure policy is claimable before redeeming
            await macro.connect(buyer).redeemPolicy(policyId);

            const balanceAfter = await token.balanceOf(buyer.address);

            // The coverage amount should be transferred to the user
            expect(balanceAfter - balanceBefore).to.equal(policy.coverage);
        });

        it("should revert if the policy is not claimable", async () => {
            const { macro, buyer, policyId, provider } = await loadFixture(
                macroGuardWithRedeemFixture,
            );

            // Try to redeem the policy
            await expect(macro.connect(buyer).redeemPolicy(policyId))
                .to.be.revertedWith("only claimable policies can be redeemed");
        });

        it("should revert if the user does not own the policy", async () => {
            const { macro, other, policyId } = await loadFixture(
                macroGuardWithRedeemFixture,
            );

            // Try to redeem the policy without owning it
            await expect(macro.connect(other).redeemPolicy(policyId))
                .to.be.revertedWith("don't have any policy");
        });
    });
});
