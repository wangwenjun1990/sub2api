/** Limits for the independent balance checkout; existing checkout is unchanged. */
export const BALANCE_RECHARGE_MAX = 1000
export const BALANCE_RECHARGE_PRESETS = [10, 20, 50, 100, 500, 1000] as const

export function isBalanceRechargeAmountValid(value: number): boolean {
  return Number.isFinite(value) && value > 0 && value <= BALANCE_RECHARGE_MAX
    && Math.abs(Math.round(value * 100) / 100 - value) < 1e-9
}
