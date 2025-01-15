"use client";

import { useContext } from "react";

import { TurbopumpContext } from "../context.js";

export function useConfig() {
  const state = useContext(TurbopumpContext);

  if (!state?.config) {
    throw new Error("Turbopump provider not found");
  }

  return state.config;
}
