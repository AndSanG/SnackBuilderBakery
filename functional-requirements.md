# Functional Requirements

Use cases in BDD style (Given / When / Then). Features are listed in the order they will be implemented, where each one builds on the features before it.

## 1. Menu Management

```gherkin
Feature: Menu Management

  Scenario: Customer views the menu
    Given the bakery has items on the menu
    When a customer requests the menu
    Then they receive a list of available items with name, category, and price

  Scenario: Manager adds a menu item
    Given the manager submits a new item with name, category, and price
    When the item is valid
    Then it appears on the menu

  Scenario: Manager updates a menu item
    Given a menu item exists
    When the manager submits updated details
    Then the item reflects the new details

  Scenario: Manager removes a menu item
    Given a menu item exists
    When the manager deletes it
    Then it no longer appears on the menu
```

## 2. Order Placement

```gherkin
Feature: Order Placement

  Scenario: Customer requests items and receives a ticket
    Given the requested items exist on the menu
    When a customer submits a request for those items
    Then a ticket is created with the total price to pay
    And the order is assigned a priority tier based on its source

  Scenario: Order is confirmed after successful payment
    Given a ticket has been issued for an order
    When the customer pays successfully
    Then the order is confirmed
    And it enters the kitchen queue
    And the customer receives a confirmation with the estimated ready time

  Scenario: Customer tracks an order
    Given an order has been confirmed
    When the customer requests the order status
    Then they receive the current status of the order
```

## 3. Kitchen Scheduler

```gherkin
Feature: Kitchen Scheduler

  Scenario: Confirmed order items each enter the queue
    Given an order has been confirmed and paid
    When it enters the kitchen
    Then each item in the order joins the baking queue as its own unit

  Scenario: An item occupies one oven slot
    Given there is at least one free oven slot
    And there are items waiting in the queue
    When the scheduler assigns work
    Then the highest-priority waiting item is placed in one free slot
    And it begins baking for its category's bake time

  Scenario: An item finishes baking after its bake time elapses
    Given an item is baking
    When its bake time has elapsed
    Then the item is marked as done
    And its oven slot becomes free

  Scenario: An order is ready when its last item finishes
    Given an order has multiple items baking or queued
    When all of its items are done
    Then the order is marked ready
    And its ready time is the completion time of its last finished item

  Scenario: A baking item cannot be preempted
    Given all oven slots are occupied
    When a higher-priority item is waiting in the queue
    Then no baking item is removed to make room
    And the waiting item stays in the queue until a slot frees naturally
```

## 4. Capacity-Based Estimation

```gherkin
Feature: Capacity-Based Estimation

  Scenario: Estimate when oven slots are free
    Given the kitchen has a free oven slot for each item in the order
    When the order is confirmed
    Then each item's ready time is the current time plus its bake time
    And the order's estimated ready time is the latest item ready time

  Scenario: Estimate when items must wait for a slot
    Given all oven slots are occupied
    And no items are waiting ahead in the queue
    When the order is confirmed
    Then each item takes the next slot to free
    And its ready time is that slot's free time plus its bake time
    And the order's estimated ready time is the latest item ready time

  Scenario: Estimate accounts for items already queued ahead
    Given there are items already waiting in the queue
    When the order is confirmed
    Then the items already waiting take the freeing slots first
    And the order's items take the slots that free after them
    And the order's estimated ready time reflects that wait

  Scenario: Estimation does not change kitchen state
    Given the kitchen has items baking and queued
    When an order's estimate is calculated
    Then no item is started, moved, or completed as a result
    And the kitchen state is identical before and after the estimate
```
