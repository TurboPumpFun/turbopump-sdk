"use client";

import type { Config } from "@turbopump-sdk/core";
import { type PropsWithChildren, createContext, createElement } from "react";

export type State = {
  config: Config;
};

export const TurbopumpContext = createContext<State | undefined>(undefined);

export type TurbopumpProviderProps = {
  config: Config;
};

export function TurbopumpProvider({
  config,
  children,
}: PropsWithChildren<TurbopumpProviderProps>) {
  return createElement(
    TurbopumpContext.Provider,
    { value: { config } },
    children,
  );
}
