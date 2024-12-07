import {
  EKUBO_MAX_PRICE,
  EKUBO_TICK_SIZE,
  EKUBO_TICK_SIZE_LOG,
  EKUBO_TICK_SPACING,
} from "../constants.js";

export function getInitialPrice(startingTick: number): number {
  return EKUBO_TICK_SIZE ** startingTick;
}

export function getStartingTick(initialPrice: number): number {
  return (
    Math.floor(
      Math.log(initialPrice) / EKUBO_TICK_SIZE_LOG / EKUBO_TICK_SPACING
    ) * EKUBO_TICK_SPACING
  );
}

export const EKUBO_BOUND = getStartingTick(+EKUBO_MAX_PRICE);
