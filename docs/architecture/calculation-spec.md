# Calculation specification

Engines are pure functions. They use integer minor units and integer shares. They do not call a language model.

## Priced equity — `priced-equity-1`

Inputs: currency, pre-money, investment, existing fully diluted shares, unallocated pool, target pool in basis points, mechanic.

Rejected: non-integers, negative investment, non-positive pre-money, pool outside 0–100%, unallocated greater than existing shares, and any instrument other than the two mechanics below.

### Pre-money pool

The target unallocated pool is a share of post-money. The new pool shares are created before the investment, so existing holders bear them. Price is pre-money divided by existing shares plus the top-up.

Let post = pre + investment, holders = existing − unallocated, pool slice = round(post × bps / 10000).

Total shares = round(holders × post / (post − investment − pool slice)).

Investor shares = round(total × investment / post).

If the existing pool is already larger than the target, it is not reduced.

### Post-money pool

Price is pre-money / existing shares. Investor shares are issued on that price. Any pool top-up is created afterwards and dilutes the new investor as well. Their ownership is then below investment / post-money. The trace says so.

### Rounding

Half away from zero via integer division. A residual of shares, if any, is assigned to existing holders so the three buckets sum to the total. Proceeds are compared with the investment. The golden test allows a difference no larger than the value of one pre-top-up share.

Zero investment issues no shares and does not expand the pool.

### Worked case

Pre-money £6,000,000, investment £1,200,000, 8,000,000 existing shares, 500,000 unallocated, 10% post-money pool, pre-money mechanic. Headline investor target is 16.67%. The test `golden pre-money pool reconciles shares and proceeds` locks the invariants.

## Cash bridge — `cash-bridge-1`

Each month:

close = open + confirmed receipts + assumed receipts + financing − payroll − operating costs.

Receipts before the confirmed window are assumptions. A delay shifts which month a receipt lands in, including a zero receipt when the source month is negative. Hiring adds payroll from start month + delay.

Runway is the count of months whose close stays at or above the buffer before the first miss. If the horizon never misses, runway is null. That is not an infinite-runway claim.

Suggested raise is a binary search for the smallest minor-unit amount, landed in a chosen month, that clears the buffer. If £20,000,000 cannot, the result is null.

Growth compounds with integer truncation: value × (10000 + bps) / 10000 each month.

## Matching — `match-aid-1`

Hard stops: excluded geography, geography outside the stated list, stage not listed, explicit sector exclusion, exclusive sector with no overlap, smallest cheque larger than the whole round.

A cheque in another currency is not converted and is not treated as a fit or a fail.

The numeric aid exists only for non-disqualified firms: sector +2, lead fit +2, theme +1, fresh activity +1, missing activity −1. The product states that this is not a probability.
