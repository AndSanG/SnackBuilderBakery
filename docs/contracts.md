# Contracts

The contracts that hold the system together, described as operations with inputs, outputs, and outcomes. No framework or language is named here on purpose: the design is meant to stand on its own, and the chosen stack (see [architecture-decisions.md](architecture-decisions.md)) is only one way to realize it.

Two kinds of contract appear here:

- Ports: the boundaries between layers and modules, defined by the module that consumes them and implemented by the provider (see [module-map.md](module-map.md)). Each module exposes at most one port to its consumer; the boundary exists so consumers stay unit-testable with a small fake, not as inversion for its own sake.
- Use case contracts: the command each use case accepts and the result or error it returns.

## Ports

### Clock

Owned by Shared. Implemented by the system clock.

| Operation | Input | Output |
|-----------|-------|--------|
| now | none | the current instant |

### MenuRepository

Owned by Menu. Implemented by Menu infrastructure.

| Operation | Input | Output / Outcome |
|-----------|-------|------------------|
| add | a menu item | the stored item |
| update | a menu item | the updated item, or not found |
| remove | an item id | success, or not found |
| getAll | none | all menu items |
| findById | an item id | the item, or none |

### OrderRepository

Owned by Orders. Implemented by Orders infrastructure.

| Operation | Input | Output / Outcome |
|-----------|-------|------------------|
| save | an order | the stored order |
| findById | an order id | the order, or none |

### MenuCatalog

Owned by Orders. Implemented by a Menu adapter. Exposes only what Orders needs to validate and price an order.

| Operation | Input | Output / Outcome |
|-----------|-------|------------------|
| findItem | an item id | the item's id, category, and price, or none |

### Kitchen

Owned by Orders. Implemented by a Kitchen adapter. One port with both operations Orders needs from the kitchen.

| Operation | Input | Output / Outcome |
|-----------|-------|------------------|
| enqueueAndEstimate | the bakeable items of a confirmed order, each carrying its category, owning order reference, and priority | the estimated ready time. Enqueue and estimate are one atomic call so two simultaneous confirmations cannot both estimate before either enqueues |
| readyTimes | none | current estimated ready time of every order still in the kitchen, keyed by order id. Used by ReconcileOrders to check liveness and by ConfirmPayment to refresh estimates after a VIP reorders the queue |

## Use case contracts

| Use case | Input | Result | Error outcomes |
|----------|-------|--------|----------------|
| ViewMenu | none | all menu items | none |
| AddMenuItem | name, category, price | the created item | invalid data |
| UpdateMenuItem | item id, updated fields | the updated item | not found, invalid data |
| RemoveMenuItem | item id | success | not found |
| PlaceOrder | requested items (item id and quantity each), order source | a ticket: order reference and total price | unknown item, empty request |
| ConfirmPayment | order reference, payment (cash or card) | a confirmation: order reference, status, estimated ready time, settled payment | not found, already confirmed, payment declined |
| TrackOrder | order reference | order reference, status, estimated ready time | not found |
| ReconcileOrders | none (reads the clock and calls the Kitchen port internally) | orders advanced from InKitchen to Ready when their live kitchen finish time has passed | none |
| MonitorKitchen | the current instant | a view: two ovens of three trays (the item baking in each and its ready time) and the waiting items in bake order | none |
