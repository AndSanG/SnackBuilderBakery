# Spike: data structure alternatives

Explores whether the simple structures in the kitchen and order repository should
be replaced with their textbook "faster" counterparts, and how the oven model
would change under more items or more ovens. Each measurable alternative is
implemented behind a shared interface under [spike/](../../spike), proven
equivalent by a test, and benchmarked. The conclusion throughout: keep the simple
structure at the current scale, and the doc records the exact trigger that would
flip each decision. The faster-looking alternatives do not pay off for the access
patterns and sizes this system actually has.

Three parts: the waiting queue, the status lookup, and the oven model.

Reproduce:

```bash
npx jest --config spike/jest-spike.json   # equivalence of the alternatives
npx ts-node spike/bench.ts                 # the numbers below
```

Benchmark numbers are single-run micro-benchmarks (Node, one machine). Treat the
small-N rows as noise and read the trends. Times are milliseconds per operation.

## Subsystem A: the scheduling queue

The kitchen stores waiting items and, every reconcile and every estimate, asks
for them in bake order (priority, then arrival). The access pattern is **build
the set, then read the whole thing in order, non-destructively** (the estimate
reads a copy). Three implementations of the same `WaitingQueue` interface:

| Alternative | enqueue | ordered() read | Notes |
| --- | --- | --- | --- |
| `ArraySortQueue` (current) | O(1) push | O(Q log Q) sort a copy | order derived only on read |
| `SortedInsertQueue` | O(Q) binary-search + splice | O(Q) copy | order maintained on write |
| `BinaryHeapQueue` | O(log Q) sift-up | O(Q log Q) clone + heapsort | the textbook priority queue |

### Numbers

```
impl                N           build ms    read ms
ArraySortQueue      1000            0.0186      0.0550
SortedInsertQueue   1000            0.0645      0.0058
BinaryHeapQueue     1000            0.0265      0.0346
ArraySortQueue      10000           0.1496      0.6072
SortedInsertQueue   10000           1.7872      0.0641
BinaryHeapQueue     10000           0.2526      0.8282
```

### Reading the result

- **The binary heap, the instinctive choice, is the worst read at scale** (0.83 ms
  at 10k, slower than the array's 0.61 ms). A heap only yields the minimum
  cheaply; to produce the full order non-destructively it must clone and pop
  everything, which is a heapsort with worse cache locality than `Array.sort`.
  The heap only wins when you pop one item at a time and never need the full
  ordering. That is not this access pattern: both reconcile and the estimate
  want the whole queue in order.
- **`SortedInsertQueue` reads fastest but its build is quadratic** (1.79 ms at
  10k) because each insert shifts the array. It only wins if reads vastly
  outnumber writes and Q is large.
- **`ArraySortQueue` is the balanced middle and the simplest.** Cheap O(1)
  writes, a single well-optimized `Array.sort` on read.

### Decision: keep `ArraySortQueue`

1. **Scale is tiny.** Q is outstanding bakery items, realistically tens. At N =
   100 every option is sub-microsecond; the choice is noise. We are comparing
   structures at sizes the system will never see.
2. **The estimate needs a non-destructive full ordering on a copy.** A plain
   array is trivially copied (`[...queue]`) and ordered by a pure function. A
   stateful heap is awkward to fork and replay, which fights the "estimate
   replays the same algorithm as reconcile" invariant the whole design rests on.
3. **It is the least code and the least bug surface.** No sift logic, no
   insert-shift.

The heap is the right structure for a different problem (stream of single pops,
no full read). It is documented here so the next person does not "optimize" the
array into a heap and make the read slower.

## Subsystem B: the status lookup

`findByStatus` answers "which orders are InKitchen?" for `ReconcileOrders` and
the VIP ripple. Two implementations of the same `OrderStore` interface:

| Alternative | save | findByStatus | Notes |
| --- | --- | --- | --- |
| `ScanStore` (current) | O(1) | O(T) filter all | nothing to keep in sync |
| `IndexedStore` | O(1) + index upkeep | O(matches) | status -> set of ids |

### Numbers

```
impl            T           find ms     save ms
ScanStore       1000            0.0066      0.0001
IndexedStore    1000            0.0041      0.0002
ScanStore       10000           0.0666      0.0001
IndexedStore    10000           0.0603      0.0002
ScanStore       100000          0.8273      0.0002
IndexedStore    100000          0.8531      0.0003
```

### Reading the result

- **The index does not beat the scan here**, even at T = 100k (0.85 ms vs
  0.83 ms). The reason is selectivity: a secondary index pays off only when the
  result set is a small fraction of the whole. "InKitchen" is not selective:
  roughly a third of all orders match, so the index still materializes O(T/3)
  results, and `Set` spread plus per-id map lookups cost about what the scan's
  `filter` costs. An index wins for "find this one needle", not "find a third of
  the haystack".
- **The index adds a real bug surface.** A save that changes status must remove
  the id from its old status set before adding it to the new one. The scan has
  no such invariant to maintain.

### Decision: keep `ScanStore`

1. **No measurable gain** for this query's selectivity, even at 100x realistic T.
2. **It adds a stateful invariant** (the status-change path) for that non-gain.
3. **The real scale path is the database, not a hand-rolled in-memory index.**
   When the Postgres repository in the backlog lands, an index on the `status`
   column gives the selective-query win for free, maintained by the database.
   Hand-rolling it in the in-memory adapter now would be throwaway work that
   still would not help the non-selective query.

## End-to-end measurement: the real Kitchen and use case

The numbers above are isolated micro-benchmarks of the structures' own
operations. To check they hold when the structures run inside the real code, the
alternatives were also swapped behind the actual seams and driven through the
real paths: a `WaitingQueue` seam was added to `Kitchen` (so `reconcile`, the
estimate and `readyTimes` run on the chosen structure), and the `IndexedStore`
idea was reimplemented against the real `OrderRepository` port and run through
`ReconcileOrders.execute()`. A test confirms all three queues drive the real
Kitchen to identical baking, waiting and ready-time output.

Reproduce:

```bash
npx jest --config spike/jest-spike.json   # includes the real-Kitchen equivalence test
npx ts-node spike/integration/bench.ts
```

```
=== Real Kitchen: build+reconcile, then estimate+readyTimes read ===
queue                 N           build ms    read ms
ArraySort (current)   1000            0.0658      0.2283
SortedInsert          1000            0.0465      0.1547
BinaryHeap            1000            0.0072      0.2257
ArraySort (current)   10000           0.6429      2.9680
SortedInsert          10000           1.6364      2.0855
BinaryHeap            10000           0.0556      3.8042

=== Real ReconcileOrders.execute() over T in-kitchen orders ===
repo                  T             reconcile ms
ScanRepo (current)    10000             0.1057
IndexedRepo           10000             0.2508
ScanRepo (current)    100000            1.9281
IndexedRepo           100000            4.3384
```

What the real paths add to the isolated picture:

- **The heap's cheap insert does not matter, because the kitchen is read-heavy.**
  Its build is by far the cheapest (0.056 ms at 10k: enqueue is O(log Q) and
  reconcile only drains 6 slots), but every confirm does an estimate *and* a
  `readyTimes` (the ripple), and every reconcile reads too. Reads dominate, and
  the heap's read is the worst (3.80 ms), because each `ordered()` is a heapsort.
  The structure optimizes the operation the kitchen does least.
- **The index is now strictly worse, at every size** (4.34 ms vs 1.93 ms at
  T = 100k), more decisive than the isolated bench. Driven through the real
  `findByStatus(InKitchen)`, which matches *every* order, `IndexedRepo` round
  trips each id back through the id map, while `ScanRepo` does a single pass over
  the values. For a non-selective query the index is pure overhead.

Both end-to-end results reinforce the isolated conclusion rather than soften it.

The `WaitingQueue` seam added to `Kitchen` for this measurement is spike
scaffolding, not a shipped change. Since the decision is to keep the array, the
seam (an abstraction with one production implementation) stays on this branch
and does not merge: introducing it for real would be the speculative
abstraction the conclusion argues against.

## Oven-side alternatives

The two subsystems above are about *how items are stored*. A separate question is
*how the ovens are modeled* as the kitchen handles more items or more ovens. Five
levers, of which two are measurable data-structure swaps and three are model or
feature changes where "benchmark" means throughput or does not apply.

Reproduce the two measured ones:

```bash
npx jest --config spike/jest-spike.json   # oven equivalence tests
npx ts-node spike/oven/bench.ts
```

### Lever 1 (measured): slot picker, array scan vs min-heap

The estimator assigns each item to the earliest-free slot. With S ovens that is
a linear `Math.min` scan, O(S) per item. The alternative keys the slot free-times
in a binary min-heap, O(log S). Forward-simulating 50000 jobs:

```
picker          S (ovens)   sim ms
ArrayScan       6               0.7820
MinHeap         6               0.6546
ArrayScan       64              3.3874
MinHeap         64              0.7318
ArrayScan       512            19.7638
MinHeap         512             1.1166
ArrayScan       4096          151.7581
MinHeap         4096            2.0032
```

**Decision: keep the array scan.** At S = 6 the two are tied (the scan is noise).
The heap only pays off as the oven count climbs: 4.6x at 64 ovens, 75x at 4096,
with the crossover around a few dozen ovens. A real bakery does not have dozens
of ovens, so the scan is correct today. This is the exact upgrade trigger the
complexity notes call out: it is driven by **more ovens**, not more items.

### Lever 2 (measured): batch baking, the throughput lever

This is a model change, not a structure swap: a tray bakes up to `traySize`
same-bake-time items at once instead of one item per slot. Measured by makespan
(simulated minutes to finish all items), 6 ovens, tray of 12:

```
items     single min    batched min   speedup
60        140           20            7.0x
600       1150          105           11.0x
6000      11750         995           11.8x
```

**This is the lever for "more items".** Batching gives roughly an order of
magnitude more throughput on the same six ovens, and the gain grows with volume.
The cost is real: scheduling stops being "assign items to slots" and becomes a
packing problem (group by bake time, decide whether to start a partial tray or
wait to fill one). Worth it only when item volume is the measured bottleneck, but
when it is, no other lever comes close. Adopting it would also change the domain
model (a slot holds a batch, the estimate reasons about batches), so it is a
feature, not an optimization.

### Levers 3 to 5 (design analysis, not benchmarked)

These change behavior or constraints, not performance, so there is nothing to
time. They are recorded with their triggers.

- **Oven identity (2x3).** Today slots are a flat interchangeable array. Modeling
  `ovens[2].trays[3]` is required the moment a rule *binds* trays within an oven
  (one oven, one temperature, so its trays must share a category) or an oven goes
  offline as a unit. It is also a prerequisite for Kitchen Monitoring ("what is in
  oven 1"). Cost: scheduling gains an eligibility constraint, turning a free
  assignment into a constrained one. Trigger: monitoring, or any per-oven rule.

- **Heterogeneous ovens.** Today every slot is identical. Real equipment is not: a
  convection oven is faster, a deck oven is bread-only. This makes `bakeDuration`
  a function of (oven, category), and the greedy "earliest free slot" must also
  check "can this oven bake this item", edging toward a constrained assignment
  solver. Trigger: the real kitchen has non-uniform ovens.

- **Reservation timeline.** Today the future is re-simulated from current state on
  every estimate. The alternative keeps a persistent per-oven timeline of booked
  intervals, so an estimate reads the schedule instead of replaying it. Trigger:
  estimates becoming hot enough (huge Q and a high query rate) that re-simulation
  costs too much. Cost: a persistent schedule to keep consistent, exactly the
  stateful complexity the poll-based design avoids on purpose. This is the only
  one of the three with a performance angle, and it only appears under load the
  POC will not see.

### Which lever for which pressure

| Pressure | Lever |
| --- | --- |
| More **ovens** | min-heap slot picker (lever 1) |
| More **items** | batch baking (lever 2) |
| Monitoring or per-oven rules | oven identity (lever 3) |
| Real non-uniform equipment | heterogeneous ovens (lever 4) |
| Huge Q and query rate | reservation timeline (lever 5) |

## Summary

Both subsystems keep their current structure. The value of the spike is the
justification: the heap is slower for a full-ordered read, and the index does
not help a non-selective query. Both conclusions are counterintuitive enough
that writing them down prevents a well-meaning future "optimization" that
regresses performance and adds complexity.

The oven model keeps its flat single-item slots too, with batch baking measured
as the one lever that genuinely scales item throughput (an order of magnitude),
held back only because it is a domain change, not a free optimization.

The genuine upgrade triggers, should they ever arrive:

- **More ovens** (dozens or more) make the estimate's inner `Math.min` over slot
  free-times matter; that scan becomes a min-heap keyed on free-time (measured
  crossover around a few dozen ovens).
- **More items** as the throughput bottleneck justify batch baking (trays of
  same-bake-time items), the single highest-leverage change measured here.
- A **selective status query** (for example "find the one order pending a manual
  refund among millions") would justify an index, best provided by the database.
- **Per-oven rules, real heterogeneous equipment, or estimate load** would justify
  oven identity, per-(oven, category) bake times, or a reservation timeline
  respectively (see the oven-side section).
