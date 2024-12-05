import { Account, constants, RpcProvider } from "starknet";
import { unruggable, type Config, type CreateMemecoinParameters } from "../src";

const STARKNET_RPC = "https://starknet-mainnet.public.blastapi.io";
const ACCOUNT_ADDRESS = process.env.ACCOUNT_ADDRESS ?? "";
const PRIVATE_KEY = process.env.PRIVATE_KEY ?? "";

async function main() {
  const provider = new RpcProvider({ nodeUrl: STARKNET_RPC });
  const account = new Account(provider, ACCOUNT_ADDRESS, PRIVATE_KEY);

  const config: Config = {
    starknetProvider: provider,
    starknetChainId: constants.StarknetChainId.SN_MAIN,
  };

  const parameters: CreateMemecoinParameters = {
    name: "GG",
    symbol: "GG",
    initialSupply: "1000000",
    owner: ACCOUNT_ADDRESS,
    starknetAccount: account,
  };

  try {
    const { tokenAddress, transactionHash } =
      await unruggable.createUnruggableToken(config, parameters);
    console.log("Token créé avec succès !");
    console.log("Transaction Hash:", transactionHash);
    console.log("Token Address:", tokenAddress);

    await provider.waitForTransaction(transactionHash);
    const launchResult = await unruggable.launchOnEkubo(config, {
      tokenAddress:
        "0x7f1adf9b7f77c84e81e30fbce3b2c3254c377826c2b35efa80fc50a8d156fab",
      starknetAccount: account,
      antiBotPeriodInSecs: 1440,
      fees: "0.3",
      holdLimit: "1",
      startingMarketCap: "10000", // usd 
      quoteToken: {
        address:
          "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7", // ETH
        symbol: "ETH",
        decimals: 18,
        name: "Ether",
        camelCased: true,
        usdcPair: {
          address:
            "0x04d0390b777b424e43839cd1e744799f3de6c176c7e32c1812a41dbd9c19db6a",
          reversed: false,
        },
      },
      teamAllocations: [
        {
          address:
            "0x7a096ecaa08a3a50dc2e1283c38586c497e0e684648ab2abe02427e2afe1e77",
          amount: "100",
        },
      ],
      totalSupply: "100000000000000000000000000",
    });

    if (launchResult) {
      console.log(
        `Launching on Ekubo... Transaction hash: ${launchResult.transactionHash}`,
      );
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
