import { constants, getChecksumAddress, type BigNumberish } from "starknet";
import type { MultichainToken, Token } from "./unruggable/types.js";

export const PERCENTAGE_INPUT_PRECISION = 2;

export const STARKNET_MAX_BLOCK_TIME = 3600 * 2; // 2h

export const DECIMALS = 18;

export const TOKEN_CLASS_HASH: Record<constants.StarknetChainId, BigNumberish> =
  {
    [constants.StarknetChainId.SN_SEPOLIA]: "",
    [constants.StarknetChainId.SN_MAIN]:
      "0x063ee878d3559583ceae80372c6088140e1180d9893aa65fbefc81f45ddaaa17",
  };

export const FACTORY_ADDRESSES: Record<constants.StarknetChainId, string> = {
  [constants.StarknetChainId.SN_SEPOLIA]: "",
  [constants.StarknetChainId.SN_MAIN]:
    "0x01a46467a9246f45c8c340f1f155266a26a71c07bd55d36e8d1c7d0d438a2dbc",
};

export enum QUOTE_TOKEN_SYMBOL {
  ETH = "ETH",
  STRK = "STRK",
  USDC = "USDC",
}

export const ETH_ADDRESSES = {
  [constants.StarknetChainId.SN_SEPOLIA]:
    "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
  [constants.StarknetChainId.SN_MAIN]:
    "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
};

export const STRK_ADDRESSES = {
  [constants.StarknetChainId.SN_SEPOLIA]:
    "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
  [constants.StarknetChainId.SN_MAIN]:
    "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
};

export const USDC_ADDRESSES = {
  [constants.StarknetChainId.SN_SEPOLIA]:
    "0x5a643907b9a4bc6a55e9069c4fd5fd1f5c79a22470690f75556c4736e34426",
  [constants.StarknetChainId.SN_MAIN]:
    "0x53c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
};

// ETH
export const Ether: MultichainToken = {
  [constants.StarknetChainId.SN_SEPOLIA]: {
    address: ETH_ADDRESSES[constants.StarknetChainId.SN_SEPOLIA],
    symbol: QUOTE_TOKEN_SYMBOL.ETH,
    name: "Ether",
    decimals: 18,
    camelCased: true,
  },
  [constants.StarknetChainId.SN_MAIN]: {
    address: ETH_ADDRESSES[constants.StarknetChainId.SN_MAIN],
    symbol: QUOTE_TOKEN_SYMBOL.ETH,
    name: "Ether",
    decimals: 18,
    camelCased: true,
  },
};

// STRK
export const Stark: MultichainToken = {
  [constants.StarknetChainId.SN_SEPOLIA]: {
    address: STRK_ADDRESSES[constants.StarknetChainId.SN_SEPOLIA],
    symbol: QUOTE_TOKEN_SYMBOL.STRK,
    name: "Stark",
    decimals: 18,
    camelCased: true,
  },
  [constants.StarknetChainId.SN_MAIN]: {
    address: STRK_ADDRESSES[constants.StarknetChainId.SN_MAIN],
    symbol: QUOTE_TOKEN_SYMBOL.STRK,
    name: "Stark",
    decimals: 18,
    camelCased: true,
  },
};

// USDC
export const USDCoin: MultichainToken = {
  [constants.StarknetChainId.SN_SEPOLIA]: {
    address: USDC_ADDRESSES[constants.StarknetChainId.SN_SEPOLIA],
    symbol: QUOTE_TOKEN_SYMBOL.USDC,
    name: "USD Coin",
    decimals: 6,
    camelCased: true,
  },
  [constants.StarknetChainId.SN_MAIN]: {
    address: USDC_ADDRESSES[constants.StarknetChainId.SN_MAIN],
    symbol: QUOTE_TOKEN_SYMBOL.USDC,
    name: "USD Coin",
    decimals: 6,
    camelCased: true,
  },
};

export const QUOTE_TOKENS: {
  [chainId in constants.StarknetChainId]: Record<string, Token>;
} = {
  [constants.StarknetChainId.SN_SEPOLIA]: {
    [getChecksumAddress(ETH_ADDRESSES[constants.StarknetChainId.SN_SEPOLIA])]:
      Ether[constants.StarknetChainId.SN_SEPOLIA],

    [getChecksumAddress(STRK_ADDRESSES[constants.StarknetChainId.SN_SEPOLIA])]:
      Stark[constants.StarknetChainId.SN_SEPOLIA],

    [getChecksumAddress(USDC_ADDRESSES[constants.StarknetChainId.SN_SEPOLIA])]:
      USDCoin[constants.StarknetChainId.SN_SEPOLIA],
  },

  [constants.StarknetChainId.SN_MAIN]: {
    [getChecksumAddress(ETH_ADDRESSES[constants.StarknetChainId.SN_MAIN])]:
      Ether[constants.StarknetChainId.SN_MAIN],
    [getChecksumAddress(STRK_ADDRESSES[constants.StarknetChainId.SN_MAIN])]:
      Stark[constants.StarknetChainId.SN_MAIN],
    [getChecksumAddress(USDC_ADDRESSES[constants.StarknetChainId.SN_MAIN])]:
      USDCoin[constants.StarknetChainId.SN_MAIN],
  },
};

export const LIQUIDITY_LOCK_FOREVER_TIMESTAMP = 9999999999; // 20/11/2286

export const EKUBO_TICK_SIZE = 1.000001;
export const EKUBO_MAX_PRICE = "0x100000000000000000000000000000000"; // 2 ** 128
export const EKUBO_TICK_SPACING = 5982; // log(1 + 0.6%) / log(1.000001) => 0.6% is the tick spacing percentage
export const EKUBO_TICK_SIZE_LOG = Math.log(EKUBO_TICK_SIZE);
export const EKUBO_FEES_MULTIPLICATOR = EKUBO_MAX_PRICE;
