# Decision: keep the simple scheduling data structures

We evaluated whether the kitchen's and repository's plain data structures should
be replaced with their textbook "faster" counterparts, and how the oven model
would change under more items or more ovens. Each alternative was implemented
behind a seam, proven equivalent by a test, and benchmarked, both in isolation
and swapped into the real `Kitchen` and `ReconcileOrders` paths.

**Conclusion: keep every current structure.** At this system's scale the
alternatives tie or lose, and two of them lose precisely because of the access
pattern. This record exists so the next person who sees an "obvious optimization"
finds it already tried, with the trigger that would actually justify it.

The implementations, benchmarks, and raw numbers live on the `spike/data-structure-alternatives`
branch (`spike/`, plus `npm run test:spike` and `npm run bench`). They are not on
`master` on purpose: every alternative lost, so shipping the seam would be an
interface with one production implementation, the speculative abstraction the
project rules forbid.

## What was measured

| Subsystem | Current | Alternatives tried | Result |
| --- | --- | --- | --- |
| Waiting queue | array + sort on read | binary heap, sorted-insert | heap is slower for the full non-destructive read the estimate needs; sorted-insert has a quadratic build |
| Status lookup (`findByStatus`) | scan and filter | secondary index (status to ids) | index ties in isolation and is strictly worse end to end, because `InKitchen` matches most orders (non-selective) |
| Slot picker | `Math.min` over slot free-times | binary min-heap | tied at 6 ovens; heap only wins past roughly a few dozen ovens |
| Oven model | flat, one item per slot | batch baking (trays) | roughly 10x throughput, but a domain change, not an optimization |

The two counterintuitive findings worth remembering: the **heap is slower** for
the queue because the kitchen reads the whole order non-destructively every
reconcile (a heap only yields the minimum cheaply), and the **index does not
help** a query that matches most rows.

## Triggers that would flip a decision

| Pressure | Change to make |
| --- | --- |
| More **ovens** (dozens or more) | min-heap slot picker, keyed on slot free-time |
| More **items** as the throughput bottleneck | batch baking (trays of same-bake-time items) |
| A **selective** status query (few matches among many) | an index, best provided by the database |
| Large order volume on `findByStatus` | the database index from the persistence work, not a hand-rolled in-memory one |
| Per-oven rules or monitoring | oven identity (2x3) |
| Real non-uniform equipment | per-(oven, category) bake times |

## How to revisit

Re-run the experiment from the spike branch with current data before acting on
any trigger. The branch holds the exact alternative implementations and the
benchmark, so re-measuring is a checkout, not a rewrite.
