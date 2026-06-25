# Snack Builder Bakery: Functional Requirements

Feature specs as user stories with acceptance criteria, followed by the use cases each one exercises. Features are listed in the order they will be implemented, where each one builds on the features before it.

## Menu Management Feature Specs

### Story: Customer requests to see the menu

#### Narrative

```gherkin
As a customer
I want to see the bakery menu
So I can choose what to order
```

#### Scenarios (Acceptance criteria)

```gherkin
Given the bakery has items on the menu
 When the customer requests the menu
 Then the system should display all available items with name, category, and price
```

### Story: Store manager manages the menu

#### Narrative

```gherkin
As a store manager
I want to add, update, and remove menu items
So the menu reflects what the bakery currently offers
```

#### Scenarios (Acceptance criteria)

```gherkin
Given valid item details
 When the manager adds an item
 Then the system should add the item to the menu

Given an existing menu item
 When the manager updates its details
 Then the system should reflect the new details

Given an existing menu item
 When the manager removes it
 Then the system should remove it from the menu
```

## Order Placement Feature Specs

### Story: Customer requests items and receives a ticket

#### Narrative

```gherkin
As a customer
I want to request one or more items and receive a ticket with the price
So I know what I need to pay
```

#### Scenarios (Acceptance criteria)

```gherkin
Given the requested items exist on the menu
 When the customer submits a request for those items
 Then the system should create a ticket with the total price to pay
  And assign a priority tier based on the order source
```

### Story: Customer pays and the order starts baking

#### Narrative

```gherkin
As a customer
I want my order to enter the kitchen once I pay
So my snacks get baked
```

#### Scenarios (Acceptance criteria)

```gherkin
Given a ticket has been issued for an order
 When the customer pays successfully
 Then the system should confirm the order
  And enqueue its items in the kitchen
  And deliver a confirmation with the estimated ready time
```

### Story: Customer tracks an order

#### Narrative

```gherkin
As a customer
I want to track the status of my order
So I know how it is progressing
```

#### Scenarios (Acceptance criteria)

```gherkin
Given a confirmed order
 When the customer requests its status
 Then the system should deliver the current status of the order
```

## Kitchen Scheduler Feature Specs

### Story: The kitchen bakes queued items as capacity allows

#### Narrative

```gherkin
As the bakery
I want queued items to bake as oven slots free up
So orders are completed in a fair and predictable order
```

#### Scenarios (Acceptance criteria)

```gherkin
Given a confirmed and paid order
 When it enters the kitchen
 Then each item in the order should join the baking queue as its own unit

Given a free oven slot
  And items waiting in the queue
 When the kitchen is reconciled
 Then the next waiting item should be placed in the free slot
  And begin baking for its category's bake time

Given a baking item whose bake time has elapsed
 When the kitchen is reconciled
 Then the item should be marked as done
  And its oven slot should become free

Given an order with multiple items baking or queued
 When all of its items are done
 Then the order should be marked ready
  And its ready time should be the completion time of its last finished item

Given all oven slots are occupied
 When the kitchen is reconciled
 Then no baking item should be removed to make room
  And waiting items should stay in the queue until a slot frees naturally
```

## Capacity-Based Estimation Feature Specs

### Story: Customer receives an estimated ready time

#### Narrative

```gherkin
As a customer
I want an estimated ready time when my order is confirmed
So I know when to expect my snacks
```

#### Scenarios (Acceptance criteria)

```gherkin
Given a free oven slot for each item in the order
 When the order is confirmed
 Then each item's ready time should be the current time plus its bake time
  And the order's estimated ready time should be the latest item ready time

Given all oven slots are occupied
  And no items are waiting ahead in the queue
 When the order is confirmed
 Then each item should take the next slot to free
  And its ready time should be that slot's free time plus its bake time
  And the order's estimated ready time should be the latest item ready time

Given items already waiting in the queue
 When the order is confirmed
 Then the waiting items should take the freeing slots first
  And the order's items should take the slots that free after them
  And the order's estimated ready time should reflect that wait

Given the kitchen has items baking and queued
 When an order's estimate is calculated
 Then no item should be started, moved, or completed as a result
  And the kitchen state should be identical before and after the estimate
```

## Use Cases

### View Menu Use Case

#### Primary course (happy path):
1. Execute "View Menu" command.
2. System retrieves all menu items.
3. System delivers the menu items.

#### Empty menu course (sad path):
1. System delivers no items.

---

### Add Menu Item Use Case

#### Data:
- Name
- Category
- Price

#### Primary course (happy path):
1. Execute "Add Menu Item" command with above data.
2. System validates the data.
3. System creates a new menu item.
4. System delivers the created item.

#### Invalid data course (sad path):
1. System delivers invalid data error.

---

### Update Menu Item Use Case

#### Data:
- Item id
- Updated fields (name, category, price)

#### Primary course (happy path):
1. Execute "Update Menu Item" command with above data.
2. System validates the data.
3. System updates the existing item.
4. System delivers the updated item.

#### Item not found course (sad path):
1. System delivers not found error.

#### Invalid data course (sad path):
1. System delivers invalid data error.

---

### Remove Menu Item Use Case

#### Data:
- Item id

#### Primary course (happy path):
1. Execute "Remove Menu Item" command with above data.
2. System removes the item from the menu.
3. System delivers success.

#### Item not found course (sad path):
1. System delivers not found error.

---

### Place Order Use Case

#### Data:
- Requested items
- Order source

#### Primary course (happy path):
1. Execute "Place Order" command with above data.
2. System validates the requested items exist on the menu.
3. System assigns a priority tier from the order source.
4. System calculates the total price.
5. System creates an order in an unpaid state.
6. System delivers a ticket with the order reference and total price.

#### Unknown item course (sad path):
1. System delivers invalid item error.

#### Empty request course (sad path):
1. System delivers invalid data error.

---

### Confirm Payment Use Case

#### Data:
- Order reference

#### Primary course (happy path):
1. Execute "Confirm Payment" command with above data.
2. System confirms payment successfully.
3. System enqueues each order item in the kitchen.
4. System estimates the order ready time.
5. System delivers a confirmation with the estimated ready time.

#### Unknown order course (sad path):
1. System delivers not found error.

#### Already confirmed course (sad path):
1. System delivers invalid state error.

---

### Track Order Use Case

#### Data:
- Order reference

#### Primary course (happy path):
1. Execute "Track Order" command with above data.
2. System retrieves the order.
3. System delivers the current order status.

#### Unknown order course (sad path):
1. System delivers not found error.

---

### Reconcile Kitchen Use Case

#### Data:
- Current time (from the clock)

#### Primary course (happy path):
1. Execute "Reconcile Kitchen" command.
2. System marks every baking item whose bake time has elapsed as done and frees its slot.
3. System fills each free slot with the next waiting item from the queue.
4. System starts those items baking at the current time.

#### No free slots course:
1. System leaves the queue unchanged.

#### Empty queue course:
1. System leaves free slots empty.

---

### Estimate Order Ready Time Use Case

#### Data:
- Order items
- Current oven slot states
- Waiting queue
- Current time (from the clock)

#### Primary course (happy path):
1. Execute "Estimate Order Ready Time" command with above data.
2. System simulates the schedule forward without changing any state.
3. System assigns each waiting item, then each order item, to the next slot to free.
4. System computes each order item's finish time.
5. System delivers the latest finish time as the estimated ready time.
