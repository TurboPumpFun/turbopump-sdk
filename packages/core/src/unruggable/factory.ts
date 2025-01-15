import { Fraction, Percent } from "@uniswap/sdk-core";
import type { BlockNumber, Calldata, ProviderInterface } from "starknet";
import {
  type AllowArray,
  BlockTag,
  type Call,
  CallData,
  hash,
  stark,
  uint256,
} from "starknet";
import {
  DECIMALS,
  EKUBO_FEES_MULTIPLICATOR,
  EKUBO_TICK_SPACING,
  FACTORY_ADDRESSES,
  TOKEN_CLASS_HASH,
} from "../constants.js";
import { TurboPumpError } from "../errors.js";
import {
  convertPercentageStringToPercent,
  decimalsScale,
  normalizeAmountString,
} from "../utils.js";
import { EKUBO_BOUND, getStartingTick } from "./ekubo.js";
import type { EkuboLaunchData, LaunchParameters, USDCPair } from "./types.js";
import {
  AMM,
  type CollectEkuboFeesParameters,
  type Config,
  type CreateMemecoinParameters,
  type DeployData,
} from "./types.js";

/**
 * Creates a new meme coin on the Starknet network.
 *
 * @param {Config} config - The configuration object containing the Starknet provider.
 * @param {CreateMemecoinParameters} parameters - The parameters for creating the meme coin.
 * @returns {Promise<{transactionHash: string, tokenAddress: string}>} A promise that resolves to an object containing the transaction hash and the token address.
 */
export async function createUnruggableToken(
  config: Config,
  parameters: CreateMemecoinParameters
): Promise<{ transactionHash: string; tokenAddress: string }> {
  try {
    const data = {
      initialSupply: parameters.initialSupply,
      name: parameters.name,
      owner: parameters.owner,
      symbol: parameters.symbol,
    };
    const { calls, tokenAddress } = getDeployCalldata(config, data);
    const response = await parameters.starknetAccount.execute(calls);
    return { transactionHash: response.transaction_hash, tokenAddress };
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error creating meme coin:", error);
    }
    throw new TurboPumpError("Failed to create meme coin");
  }
}

async function getPairPrice(
  provider: ProviderInterface,
  pair?: USDCPair,
  blockNumber: BlockNumber = BlockTag.LATEST
) {
  if (!pair) {
    return new Fraction(1, 1);
  }

  const result = await provider.callContract(
    {
      contractAddress: pair.address,
      entrypoint: "get_reserves",
    },
    blockNumber
  );

  const [reserve0Low, reserve0High, reserve1Low, reserve1High] = result;

  const pairPrice = new Fraction(
    uint256
      .uint256ToBN({ low: reserve1Low || "", high: reserve1High || "" })
      .toString(),
    uint256
      .uint256ToBN({ low: reserve0Low || "", high: reserve0High || "" })
      .toString()
  );

  // token0 and token1 are switched on some pairs
  return (pair.reversed ? pairPrice.invert() : pairPrice).multiply(
    decimalsScale(12)
  );
}

async function getEkuboLaunchCalldata(
  config: Config,
  data: EkuboLaunchData
): Promise<{
  calls: {
    contractAddress: string;
    entrypoint: string;
    calldata: Calldata;
  }[];
}> {
  // If there are no team allocations, we only need the launch call
  if (data.teamAllocations.length === 0) {
    const initialPrice = +new Fraction(data.startingMarketCap)
      .multiply(decimalsScale(DECIMALS))
      .divide(new Fraction(data.totalSupply))
      .toFixed(DECIMALS);

    const startingTickMag = getStartingTick(initialPrice);
    const i129StartingTick = {
      mag: Math.abs(startingTickMag),
      sign: startingTickMag < 0,
    };

    const fees = data.fees
      .multiply(EKUBO_FEES_MULTIPLICATOR)
      .quotient.toString();

    const initialHolders = data.teamAllocations.map(({ address }) => address);
    const initialHoldersAmounts = data.teamAllocations.map(({ amount }) =>
      uint256.bnToUint256(BigInt(amount) * BigInt(decimalsScale(DECIMALS)))
    );

    const launchCalldata = CallData.compile([
      data.tokenAddress,
      data.antiBotPeriod,
      +data.holdLimit.toFixed(1) * 100,
      data.quoteToken.address,
      initialHolders,
      initialHoldersAmounts,
      fees,
      EKUBO_TICK_SPACING,
      i129StartingTick,
      EKUBO_BOUND,
    ]);

    return {
      calls: [
        {
          contractAddress: FACTORY_ADDRESSES[config.starknetChainId],
          entrypoint: "launch_on_ekubo",
          calldata: launchCalldata,
        },
      ],
    };
  }

  const quoteTokenPrice = await getPairPrice(
    config.starknetProvider,
    data.quoteToken.usdcPair
  );

  // get the team allocation amount
  const teamAllocationFraction = data.teamAllocations.reduce(
    (acc, { amount }) => acc.add(new Fraction(amount.toString(), 1)),
    new Fraction(0)
  );

  const teamAllocationPercentage = new Percent(
    teamAllocationFraction.quotient,
    new Fraction(data.totalSupply, decimalsScale(DECIMALS)).quotient
  );

  const teamAllocationQuoteAmount = new Fraction(data.startingMarketCap)
    .divide(quoteTokenPrice)
    .multiply(teamAllocationPercentage.multiply(data.fees.add(1)));

  const uin256TeamAllocationQuoteAmount = uint256.bnToUint256(
    BigInt(
      teamAllocationQuoteAmount
        .multiply(decimalsScale(data.quoteToken.decimals))
        .quotient.toString()
    )
  );

  // get initial price based on mcap and quote token price
  const initialPrice = +new Fraction(data.startingMarketCap)
    .divide(quoteTokenPrice)
    .multiply(decimalsScale(DECIMALS))
    .divide(new Fraction(data.totalSupply))
    .toFixed(DECIMALS);

  const startingTickMag = getStartingTick(initialPrice);

  const i129StartingTick = {
    mag: Math.abs(startingTickMag),
    sign: startingTickMag < 0,
  };

  const fees = data.fees.multiply(EKUBO_FEES_MULTIPLICATOR).quotient.toString();

  const transferCalldata = CallData.compile([
    FACTORY_ADDRESSES[config.starknetChainId], // recipient
    uin256TeamAllocationQuoteAmount, // amount
  ]);

  const initialHolders = data.teamAllocations.map(({ address }) => address);

  const initialHoldersAmounts = data.teamAllocations.map(({ amount }) =>
    uint256.bnToUint256(BigInt(amount) * BigInt(decimalsScale(DECIMALS)))
  );

  const launchCalldata = CallData.compile([
    data.tokenAddress,
    data.antiBotPeriod,
    +data.holdLimit.toFixed(1) * 100,
    data.quoteToken.address,
    initialHolders,
    initialHoldersAmounts,
    fees,
    EKUBO_TICK_SPACING,
    i129StartingTick,
    EKUBO_BOUND,
  ]);

  return {
    calls: [
      {
        contractAddress: data.quoteToken.address,
        entrypoint: "transfer",
        calldata: transferCalldata,
      },
      {
        contractAddress: FACTORY_ADDRESSES[config.starknetChainId],
        entrypoint: "launch_on_ekubo",
        calldata: launchCalldata,
      },
    ],
  };
}

export async function launchOnEkubo(
  config: Config,
  parameters: LaunchParameters
): Promise<{ transactionHash: string }> {
  const { calls } = await getEkuboLaunchCalldata(config, {
    amm: AMM.EKUBO,
    antiBotPeriod: parameters.antiBotPeriodInSecs * 60,
    fees: convertPercentageStringToPercent(parameters.fees),
    holdLimit: convertPercentageStringToPercent(parameters.holdLimit),
    quoteToken: parameters.quoteToken,
    startingMarketCap: normalizeAmountString(parameters.startingMarketCap),
    teamAllocations: parameters.teamAllocations,
    tokenAddress: parameters.tokenAddress,
    totalSupply: parameters.totalSupply,
  });

  try {
    const response = await parameters.starknetAccount.execute(calls);
    return { transactionHash: response.transaction_hash };
  } catch (error) {
    console.error("Error launching on Ekubo:", error);
    throw new TurboPumpError("Failed to launch on Ekubo");
  }
}

function getDeployCalldata(
  config: Config,
  data: DeployData
): { calls: AllowArray<Call>; tokenAddress: string } {
  const salt = stark.randomAddress();

  const constructorCalldata = CallData.compile([
    data.owner,
    data.name,
    data.symbol,
    uint256.bnToUint256(
      BigInt(data.initialSupply) * BigInt(decimalsScale(DECIMALS))
    ),
    salt,
  ]);

  const tokenAddress = hash.calculateContractAddressFromHash(
    salt,
    TOKEN_CLASS_HASH[config.starknetChainId],
    constructorCalldata.slice(0, -1),
    FACTORY_ADDRESSES[config.starknetChainId]
  );

  const calls: AllowArray<Call> = [
    {
      contractAddress: FACTORY_ADDRESSES[config.starknetChainId],
      entrypoint: "create_memecoin",
      calldata: constructorCalldata,
    },
  ];

  return { tokenAddress, calls };
}

export function collectEkuboFees(
  _config: Config,
  _parameters: CollectEkuboFeesParameters
): null {
  // TODO
  return null;
}
