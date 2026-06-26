# Spike: data structure alternatives

Explores whether the two simple data structures in the kitchen and order
repository should be replaced with their textbook "faster" counterparts. Each
alternative is implemented behind a shared interface under [spike/](../../spike),
proven equivalent by a test, and benchmarked. The conclusion for both: keep the
simple structure. The faster-looking alternatives do not pay off for the access
patterns this system actually has.

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

## Summary

Both subsystems keep their current structure. The value of the spike is the
justification: the heap is slower for a full-ordered read, and the index does
not help a non-selective query. Both conclusions are counterintuitive enough
that writing them down prevents a well-meaning future "optimization" that
regresses performance and adds complexity.

The two genuine upgrade triggers, should they ever arrive:

- A **variable oven count** would make the estimate's inner `Math.min` over slot
  free-times matter; that specific scan becomes a min-heap keyed on free-time.
- A **selective status query** (for example "find the one order pending a manual
  refund among millions") would justify an index, best provided by the database.
