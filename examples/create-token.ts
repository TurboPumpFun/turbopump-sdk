import { Account, constants, RpcProvider } from "starknet";
import {
  Config,
  CreateMemecoinParameters,
  createUnruggableToken,
  launchOnEkubo,
} from "../packages/core/src";

const STARKNET_RPC = "https://starknet-mainnet.public.blastapi.io";
const ACCOUNT_ADDRESS = process.env.ACCOUNT_ADDRESS ?? "";
const PRIVATE_KEY = process.env.ACCOUNT_PRIVATE_KEY ?? "";

if (!ACCOUNT_ADDRESS || !PRIVATE_KEY) {
  console.error(
    "Please provide ACCOUNT_ADDRESS and ACCOUNT_PRIVATE_KEY environment variables\n"
  );
  process.exit(1);
}

async function main() {
  const provider = new RpcProvider({ nodeUrl: STARKNET_RPC });
  const account = new Account(provider, ACCOUNT_ADDRESS, PRIVATE_KEY);

  const config: Config = {
    starknetProvider: provider,
    starknetChainId: constants.StarknetChainId.SN_MAIN,
  };

  const parameters: CreateMemecoinParameters = {
    name: "Turbopump",
    symbol: "GG",
    initialSupply: "1000000",
    owner: ACCOUNT_ADDRESS,
    starknetAccount: account,
  };

  try {
    const { tokenAddress, transactionHash } = await createUnruggableToken(
      config,
      parameters
    );

    console.log("Token created successfully!", {
      tokenAddress,
      transactionHash,
    });

    await provider.waitForTransaction(transactionHash);

    const launchResult = await launchOnEkubo(config, {
      tokenAddress,
      starknetAccount: account,
      antiBotPeriodInSecs: 0,
      fees: "0.3",
      holdLimit: "1",
      startingMarketCap: "100000",
      quoteToken: {
        address:
          "0x0124aeb495b947201f5fac96fd1138e326ad86195b98df6dec9009158a533b49", // LORDS
        symbol: "LORDS",
        decimals: 18,
        name: "Realms: LORDS",
        camelCased: true,
      },
      teamAllocations: [], // TODO: issue when you pass teamAllocations
      totalSupply: parameters.initialSupply,
    });

    if (launchResult) {
      console.log(
        `Launching on Ekubo... Transaction hash: ${launchResult.transactionHash}`
      );
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
