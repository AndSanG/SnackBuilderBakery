# Concurrency audit

The challenge requires "no race conditions, deadlocks, or data corruption."
This note records every shared-state mutation path, the check-then-act races
that span an `await`, and how each one is made safe. The reasoning lives next
to the code; this table is the index.

Node runs one thread, so a purely synchronous read-modify-write cannot be
interleaved. The risk is only where a use case reads state, awaits, then writes:
another use case can run during the await and invalidate the read. The in-memory
implementations guard each path with a synchronous compare-and-set. The Prisma
implementations translate each guard to an equivalent single SQL statement.

| Path | Race considered | In-memory resolution | SQL resolution |
|------|-----------------|----------------------|----------------|
| `OrderRepository.claimForPayment` | Two confirmations charge the same order. | Synchronous get/check/set with no await: one microtask, cannot be interleaved. | `UPDATE orders SET status='PaymentProcessing' WHERE id=? AND status='AwaitingPayment'`; check `count`. PostgreSQL's row-level lock ensures at most one caller wins. |
| `ConfirmPayment` claim then charge then save | A second writer corrupts the order mid-confirmation. | The claim flips the order to `PaymentProcessing`, a state no other path writes. | Same: the SQL claim is atomic; the owned order is in an exclusive state until the final save. |
| Kitchen operations (`enqueueAndEstimate`, `readyTimes`) | Estimate drifts when two confirmations interleave between estimating and enqueueing. | Each adapter method is a single synchronous block with no internal await. | Kitchen is still in-memory and single-instance; same guarantee applies. |
| `ConfirmPayment.refreshBumpedEstimates` (VIP ripple) | A stale snapshot estimate write resurrects an order that `ReconcileOrders` just advanced to `Ready`. | `updateEstimateIfInKitchen` synchronous compare-and-set: writes only while `InKitchen`. | `UPDATE orders SET estimatedReadyTime=? WHERE id=? AND status='InKitchen'`; silently no-ops for a Ready order. |
| `ReconcileOrders` | Two reconcile runs double-write `Ready`. | Monotonic and idempotent transition; double-write produces no corruption. | Same: the second UPDATE to `Ready` overwrites identically; no corruption. |
| `PlaceOrder` | Lost write on creation. | Fresh UUID, written once; no read-modify-write. | `INSERT` on a new UUID: no conflict possible. |
| `UpdateMenuItem` | Two edits lose each other's fields; an edit racing a remove resurrects the item. | Synchronous read-merge-write in `applyUpdate`; returns null when the item is gone. | Prisma `update()` maps to `UPDATE ... WHERE id=?`; throws P2025 (no rows) when the item is gone, returned as null. No resurrection. |
| `RemoveMenuItem` | A read-then-delete reports "not found" inconsistently when two removes race. | `remove` deletes and reports existence in one step. | `DELETE ... WHERE id=?` via `deleteMany`; count 0 means not found. One step, cannot split. |

## Single Kitchen instance

There is one in-memory `Kitchen`. Every public method mutates synchronously
with no internal await, so the event loop cannot interleave a second mutation
inside one call. Orchestration that spans awaits lives in `ConfirmPayment`, and
the rows above cover it. Real locking is only needed if the kitchen moves to
multiple processes or a shared store.

## Residual closed

`ReconcileOrders` now derives readiness from the kitchen's live schedule rather
than the stored estimate: it calls `kitchenService.readyTimes()` and prefers the
live finish time for orders still in the kitchen, falling back to the stored
estimate only once all of an order's items have cleared the slots. A VIP bump
that pushes order A's real finish time beyond the stale stored estimate is now
caught: `liveReadyTimes.get(A) > now` blocks the premature `Ready` transition.
The status guard (`updateEstimateIfInKitchen`) remains in place as defence in
depth.
