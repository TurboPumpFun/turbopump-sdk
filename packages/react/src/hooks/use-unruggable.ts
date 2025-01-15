import {
  type CollectEkuboFeesParameters,
  type CreateMemecoinParameters,
  type LaunchParameters,
  collectEkuboFees,
  createUnruggableToken,
  launchOnEkubo,
} from "@turbopump-sdk/core";
import { useState } from "react";
import { useConfig } from "./use-config.js";

export default function useUnruggable({
  onError,
  onSuccess,
}: {
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}) {
  const config = useConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  async function _collectEkuboFees({
    params,
  }: {
    params: CollectEkuboFeesParameters;
  }) {
    setIsLoading(true);

    try {
      collectEkuboFees(config, params);
      if (onSuccess) onSuccess();
    } catch (error) {
      setError(true);
      if (onError) onError(error as Error);
    }

    setIsLoading(false);
  }

  async function _createUnruggableToken({
    params,
  }: {
    params: CreateMemecoinParameters;
  }) {
    setIsLoading(true);

    try {
      await createUnruggableToken(config, params);
      if (onSuccess) onSuccess();
    } catch (error) {
      setError(true);
      if (onError) onError(error as Error);
    }

    setIsLoading(false);
  }

  async function _launchOnEkubo({ params }: { params: LaunchParameters }) {
    setIsLoading(true);

    try {
      await launchOnEkubo(config, params);
      if (onSuccess) onSuccess();
    } catch (error) {
      setError(true);
      if (onError) onError(error as Error);
    }

    setIsLoading(false);
  }

  return {
    isLoading,
    error,
    collectEkuboFees: _collectEkuboFees,
    createUnruggableToken: _createUnruggableToken,
    launchOnEkubo: _launchOnEkubo,
  };
}
