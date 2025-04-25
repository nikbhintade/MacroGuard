"use client";

import { useState, useEffect } from "react";
import {
  createWalletClient,
  custom,
  type WalletClient,
  type Address,
} from "viem";
import { flareTestnet } from "viem/chains";

export function useWalletConnection() {
  const [account, setAccount] = useState<Address | undefined>();
  const [client, setClient] = useState<WalletClient | undefined>();

  useEffect(() => {
    const saved = localStorage.getItem("walletAccount");
    if (saved && saved.startsWith("0x") && saved.length === 42) {
      setAccount(saved as Address);
      const ethereum = (window as any).ethereum;
      if (ethereum) {
        const walletClient = createWalletClient({
          chain: flareTestnet,
          transport: custom(ethereum),
        });
        setClient(walletClient);
      }
    }
  }, []);

  const connectWallet = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      alert("MetaMask is not installed!");
      return;
    }

    try {
      const currentChainId = await ethereum.request({ method: "eth_chainId" });

      if (parseInt(currentChainId, 16) !== flareTestnet.id) {
        try {
          await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${flareTestnet.id.toString(16)}` }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${flareTestnet.id.toString(16)}`,
                  chainName: "Flare Testnet",
                  nativeCurrency: {
                    name: "Coston2",
                    symbol: "C2FLR",
                    decimals: 18,
                  },
                  rpcUrls: ["https://coston2-api.flare.network/ext/C/rpc"],
                  blockExplorerUrls: ["https://coston2-explorer.flare.network"],
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      const connectedAccount = accounts[0] as Address;
      const walletClient = createWalletClient({
        chain: flareTestnet,
        transport: custom(ethereum),
      })!;

      if (!walletClient) {
        throw new Error("Wallet client is not initialized.");
      }

      setAccount(connectedAccount);
      setClient(walletClient);
      localStorage.setItem("walletAccount", connectedAccount);
    } catch (err) {
      console.error("Wallet connection failed:", err);
      setAccount(undefined);
      setClient(undefined);
    }
  };

  const disconnectWallet = () => {
    setAccount(undefined);
    setClient(undefined);
    localStorage.removeItem("walletAccount");
  };

  return {
    account, // only defined if valid 0x address
    client, // only defined if account is defined
    connectWallet,
    disconnectWallet,
  };
}
