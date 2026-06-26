# Concurrency audit

The challenge requires "no race conditions, deadlocks, or data corruption."
Persistence is in-memory, so there is no database transaction to lean on. This
note records every shared-state mutation path, the check-then-act races that
span an `await`, and how each one is made safe. The reasoning lives next to the
code; this table is the index.

Node runs one thread, so a purely synchronous read-modify-write cannot be
interleaved. The risk is only where a use case reads state, awaits, then writes:
another use case can run during the await and invalidate the read.

| Path | Race considered | Resolution |
|------|-----------------|------------|
| `OrderRepository.claimForPayment` | Two confirmations charge the same order. | Atomic compare-and-set: get, status check, and write run with no await between them. The loser sees `PaymentProcessing` and is rejected before charging. |
| `ConfirmPayment` claim then charge then save | A second writer corrupts the order mid-confirmation. | The claim flips the order to `PaymentProcessing`, a state no other path writes. The order is exclusively owned until the final save, so the decline-release and the `InKitchen` save are safe. |
| Kitchen operations (`enqueueAndEstimate`, `readyTimes`) | Estimate drifts when two confirmations interleave between estimating and enqueueing. | Each adapter method is a single synchronous block (reconcile, estimate, enqueue) with no internal await, so it runs as one microtask. See commit that introduced `enqueueAndEstimate`. |
| `ConfirmPayment.refreshBumpedEstimates` (VIP ripple) | A stale snapshot estimate write resurrects an order that `ReconcileOrders` just advanced to `Ready`, regressing its status back to `InKitchen`. | The estimate is written through `updateEstimateIfInKitchen`, an atomic guard that writes only while the order is still `InKitchen`. Verified by `confirm-payment.ripple-status.spec.ts`. |
| `ReconcileOrders` | Two reconcile runs double-write `Ready`. | The transition is monotonic (`InKitchen` to `Ready`) and idempotent, so the double-write produces no corruption. |
| `PlaceOrder` | Lost write on creation. | Each order gets a fresh UUID and is written once; there is no read-modify-write. |
| `UpdateMenuItem` | Two edits lose each other's fields; an edit racing a remove resurrects the item. | The merge runs in `MenuRepository.applyUpdate`, a synchronous read-merge-write that returns null when the item is gone, so a removed item is never written back. |
| `RemoveMenuItem` | A read-then-delete reports "not found" inconsistently when two removes race. | `MenuRepository.remove` deletes and reports whether a row existed in one step, so the not-found decision and the delete cannot be split. |

## Single Kitchen instance

There is one in-memory `Kitchen`. Every public method mutates synchronously
with no internal await, so the event loop cannot interleave a second mutation
inside one call. Orchestration that spans awaits lives in `ConfirmPayment`, and
the rows above cover it. Real locking is only needed if the kitchen moves to
multiple processes or a shared store.

## Accepted residual

After a VIP order bumps a lower-priority order, that order's stored estimate is
briefly stale-low until the ripple refreshes it. A reconcile landing in that
window can mark the order `Ready` slightly early. The status guard keeps this a
single forward transition (never a flap), and the window closes as soon as the
ripple runs. Eliminating it entirely means deriving readiness from the kitchen's
actual slot state rather than the stored estimate, which belongs with the
database work, not here.
