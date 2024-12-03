import { MULTICALL_ADDRESSES } from "@/constants";
import {
  hash,
  CallData,
  type Call,
  type constants,
  type ProviderInterface,
} from "starknet";

export async function multiCallContract(
  provider: ProviderInterface,
  chainId: constants.StarknetChainId,
  calls: Call[],
): Promise<string[][]> {
  const calldata = calls.map((call) => {
    return CallData.compile({
      to: call.contractAddress,
      selector: hash.getSelector(call.entrypoint),
      calldata: call.calldata ?? [],
    });
  });

  const rawResult = await provider.callContract({
    contractAddress: MULTICALL_ADDRESSES[chainId],
    entrypoint: "aggregate",
    calldata: [calldata.length, ...calldata.flat()],
  });
  const raw = rawResult.slice(2);

  const result: string[][] = [];
  let idx = 0;

  for (let i = 0; i < raw.length; i += idx + 1) {
    idx = parseInt(raw[i], 16);

    result.push(raw.slice(i + 1, i + 1 + idx));
  }

  return result;
}
