import type { BigintIsh, Percent } from "@uniswap/sdk-core";
import type { AccountInterface, constants, ProviderInterface } from "starknet";

export interface Config {
  starknetChainId: constants.StarknetChainId;
  starknetProvider: ProviderInterface;
}

export enum AMM {
  EKUBO = "Ekubo",
  JEDISWAP = "Jediswap",
  STARKDEFI = "StarkDeFi",
}

type MemecoinBaseLaunchData = {
  amm: AMM;
  teamAllocations: {
    address: string;
    amount: number | string;
  }[];
  holdLimit: Percent;

  /**
   * Anti bot period in *seconds*
   */
  antiBotPeriod: number;

  /**
   * Quote token
   */
  quoteToken: Token;

  /**
   * Starting market cap in USDC
   */
  startingMarketCap: number | string;
};

export type EkuboLaunchData = MemecoinBaseLaunchData & {
  tokenAddress: string;
  fees: Percent;
  totalSupply: BigintIsh;
};

export type UnruggableTokenData = UnruggableTokenBase & {
  isLaunched: boolean;
} & Partial<Omit<LaunchedMemecoin, "isLaunched">>;

export type Token = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  camelCased?: boolean;
  usdcPair?: USDCPair;
};

export type USDCPair = {
  address: string;
  reversed: boolean;
};

export enum LiquidityType {
  JEDISWAP_ERC20 = "JEDISWAP_ERC20",
  STARKDEFI_ERC20 = "STARKDEFI_ERC20",
  EKUBO_NFT = "EKUBO_NFT",
}

type BaseLiquidity = {
  type: LiquidityType;
  lockManager: string;
  unlockTime: number;
  owner: string;
  quoteToken: string;
};

type LaunchedLiquidity = EkuboLiquidity;

type EkuboPoolKey = {
  token0: string;
  token1: string;
  fee: string;
  tickSpacing: string;
  extension: string;
};

type i129 = {
  mag: string;
  sign: string;
};

type EkuboBounds = {
  lower: i129;
  upper: i129;
};

export type EkuboLiquidity = {
  type: LiquidityType.EKUBO_NFT;
  ekuboId: string;
  startingTick: number;
  poolKey: EkuboPoolKey;
  bounds: EkuboBounds;
} & Omit<BaseLiquidity, "type">;

export type LaunchedMemecoin =
  | {
      isLaunched: false;
    }
  | {
      isLaunched: true;
      quoteToken: Token | undefined;
      launch: {
        teamAllocation: string;
        blockNumber: number;
      };
      liquidity: LaunchedLiquidity;
    };

export type MultichainToken = { [chainId in constants.StarknetChainId]: Token };

export type UnruggableTokenBase = {
  address: string;
  name: string;
  symbol: string;
  owner: string;
  decimals: number;
  totalSupply: string;
};

export type DeployData = {
  name: string;
  symbol: string;
  owner: string;
  initialSupply: string;
};

export interface CreateMemecoinParameters {
  starknetAccount: AccountInterface;
  name: string;
  symbol: string;
  owner: string;
  initialSupply: string;
}

export interface LaunchParameters {
  tokenAddress: string;
  starknetAccount: AccountInterface;
  startingMarketCap: string;
  holdLimit: string;
  fees: string;
  antiBotPeriodInSecs: number;
  liquidityLockPeriod?: number;
  quoteToken: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    camelCased?: boolean;
    usdcPair?: {
      address: string;
      reversed: boolean;
    };
  };
  teamAllocations: {
    address: string;
    amount: number | string;
  }[];
  totalSupply: string | number;
}

export interface CollectEkuboFeesParameters {
  starknetAccount: AccountInterface;
  memecoinAddress: string;
}
