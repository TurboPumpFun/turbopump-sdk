import type { LaunchParameters, EkuboLaunchData } from "./types";
import {
  type CollectEkuboFeesParameters,
  type Config,
  type CreateMemecoinParameters,
  type DeployData,
  AMM,
} from "./types";
import type { Calldata } from "starknet";
import {
  type AllowArray,
  type Call,
  CallData,
  hash,
  stark,
  uint256,
} from "starknet";
import {
  convertPercentageStringToPercent,
  decimalsScale,
  normalizeAmountString,
} from "@/utils";
import {
  DECIMALS,
  EKUBO_FEES_MULTIPLICATOR,
  EKUBO_TICK_SPACING,
  FACTORY_ADDRESSES,
  TOKEN_CLASS_HASH,
} from "../constants";
import { TurboPumpError } from "@/errors";
import { Fraction, Percent } from "@uniswap/sdk-core";
import { EKUBO_BOUND, getStartingTick } from "./ekubo";

/**
 * Creates a new meme coin on the Starknet network.
 *
 * @param {Config} config - The configuration object containing the Starknet provider.
 * @param {CreateMemecoinParameters} parameters - The parameters for creating the meme coin.
 * @returns {Promise<{transactionHash: string, tokenAddress: string}>} A promise that resolves to an object containing the transaction hash and the token address.
 */
export async function createUnruggableToken(
  config: Config,
  parameters: CreateMemecoinParameters,
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

function getEkuboLaunchCalldata(
  config: Config,
  data: EkuboLaunchData,
): {
  calls: {
    contractAddress: string;
    entrypoint: string;
    calldata: Calldata;
  }[];
} {
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

    const launchCalldata = CallData.compile([
      data.tokenAddress,
      data.antiBotPeriod,
      +data.holdLimit.toFixed(1) * 100,
      data.quoteToken.address,
      [], // empty initial holders
      [], // empty initial holders amounts
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

  // Convert all team allocation amounts to Fractions
  const teamAllocationFraction = data.teamAllocations.reduce(
    (acc, { amount }) => acc.add(new Fraction(amount.toString(), 1)),
    new Fraction(0),
  );

  // Create fraction for total supply with decimals
  const totalSupplyFraction = new Fraction(data.totalSupply);
  const totalSupplyWithDecimals = totalSupplyFraction.multiply(
    decimalsScale(DECIMALS),
  );

  const teamAllocationPercentage = new Percent(
    teamAllocationFraction.quotient,
    totalSupplyWithDecimals.quotient,
  );

  const teamAllocationQuoteAmount = new Fraction(data.startingMarketCap)
    .multiply(teamAllocationPercentage)
    .multiply(data.fees.add(1));

  const uint256TeamAllocationQuoteAmount = uint256.bnToUint256(
    BigInt(
      teamAllocationQuoteAmount
        .multiply(decimalsScale(data.quoteToken.decimals))
        .quotient.toString(),
    ),
  );

  const initialPrice = +new Fraction(data.startingMarketCap)
    .multiply(decimalsScale(DECIMALS))
    .divide(totalSupplyFraction)
    .toFixed(DECIMALS);

  const startingTickMag = getStartingTick(initialPrice);
  const i129StartingTick = {
    mag: Math.abs(startingTickMag),
    sign: startingTickMag < 0,
  };

  const fees = data.fees.multiply(EKUBO_FEES_MULTIPLICATOR).quotient.toString();

  const transferCalldata = CallData.compile([
    FACTORY_ADDRESSES[config.starknetChainId],
    uint256TeamAllocationQuoteAmount,
  ]);

  const initialHolders = data.teamAllocations.map(({ address }) => address);
  const initialHoldersAmounts = data.teamAllocations.map(({ amount }) =>
    uint256.bnToUint256(
      BigInt(
        new Fraction(amount.toString())
          .multiply(decimalsScale(DECIMALS))
          .quotient.toString(),
      ),
    ),
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
  parameters: LaunchParameters,
): Promise<{ transactionHash: string }> {
  const { calls } = getEkuboLaunchCalldata(config, {
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
    throw new TurboPumpError(`Failed to launch on Ekubo`);
  }
}

function getDeployCalldata(
  config: Config,
  data: DeployData,
): { calls: AllowArray<Call>; tokenAddress: string } {
  const salt = stark.randomAddress();

  const constructorCalldata = CallData.compile([
    data.owner,
    data.name,
    data.symbol,
    uint256.bnToUint256(
      BigInt(data.initialSupply) * BigInt(decimalsScale(DECIMALS)),
    ),
    salt,
  ]);

  const tokenAddress = hash.calculateContractAddressFromHash(
    salt,
    TOKEN_CLASS_HASH[config.starknetChainId],
    constructorCalldata.slice(0, -1),
    FACTORY_ADDRESSES[config.starknetChainId],
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
  _parameters: CollectEkuboFeesParameters,
): null {
  // TODO
  return null;
}
