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

  const isConnected = Boolean(account && client);

  useEffect(() => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    const checkConnection = async () => {
      try {
        const accounts = await ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          const saved = accounts[0];
          if (saved.startsWith("0x") && saved.length === 42) {
            setAccount(saved as Address);
            const walletClient = createWalletClient({
              chain: flareTestnet,
              transport: custom(ethereum),
            });
            setClient(walletClient);
            localStorage.setItem("walletAccount", saved);
          }
        } else {
          disconnectWallet();
        }
      } catch (err) {
        console.error("Error checking wallet connection:", err);
      }
    };

    checkConnection();

    // Listen for account changes or disconnection
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0] as Address);
        const walletClient = createWalletClient({
          chain: flareTestnet,
          transport: custom(ethereum),
        });
        setClient(walletClient);
        localStorage.setItem("walletAccount", accounts[0]);
      }
    };

    ethereum.on("accountsChanged", handleAccountsChanged);

    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, []);

  const connectWallet = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      alert("MetaMask is not installed!");
      return;
    }

    try {
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      const connectedAccount = accounts[0] as Address;
      const walletClient = createWalletClient({
        chain: flareTestnet,
        transport: custom(ethereum),
      });

      setAccount(connectedAccount);
      setClient(walletClient);
      localStorage.setItem("walletAccount", connectedAccount);

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
    } catch (err) {
      console.error("Wallet connection failed:", err);
      disconnectWallet();
    }
  };

  const disconnectWallet = () => {
    setAccount(undefined);
    setClient(undefined);
    localStorage.removeItem("walletAccount");
  };

  return {
    account,
    client,
    isConnected,
    connectWallet,
    disconnectWallet,
  };
}
