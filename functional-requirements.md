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
