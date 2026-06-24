Using the language or framework that you feel most proficient in, your task is to design a high-performance backend API for Snack Builders Bakery to handle order management, storefront operations, and a complex Priority-Based Kitchen Scheduler.

Our kitchen has 2 Ovens, each fitting 3 trays (Total capacity: 6 concurrent slots). The core challenge is managing a prioritized queue where VIP orders can affect the scheduling and estimations of all other active orders.

Core Requirements:
• Menu Management: Users must be able to see our menu, and store managers should be able to add, remove, or update the items that we offer.
• Order Placement: Customers need to be able to request one or multiple items. When an order is placed, the system must return a ticket to the customer with the price they need to pay. The customer should also have the ability to track the status of their order.
• Payment Management: We need to be able to handle payments from the clients, accepting both cash and credit cards.
• Bake Time Rules: Different snacks have different bake times:
Cookies: 5 minutes.
Pastries: 10 minutes.
Breads: 20 minutes.
• Capacity-Based Estimation: When an order is placed, you must give the user an estimated_ready_time calculated dynamically based on current oven capacity.
• Kitchen Monitoring: Provide our kitchen manager with complete visibility over the status of our kitchen, specifying which items are currently in which oven and which items are waiting in the queue to be baked.
• Priority Queuing: Every order must have an assigned priority_level:
• Tier 1 (VIP): Highest priority.
• Tier 2 (App/Delivery): Medium priority.
• Tier 3 (Walk-in): Standard priority.
When an oven slot opens, the system must pick the highest-priority item from the queue first, subject to the following constraints:
• You cannot remove a lower-priority item from the oven once it has started baking.
• If a VIP order is placed, the estimated_ready_time for all lower-priority orders in the queue must be updated dynamically to reflect their new delayed position.


Constraints & Technical Expectations:

Design Patterns: Use appropriate software design patterns to manage the complex scheduling and queuing logic cleanly.
Resilience & Concurrency: The system should handle high concurrency without race conditions, deadlocks, or data corruption.
Time Simulation: The test suite should be able to mock or accelerate time to verify "future states" and scheduling flow without requiring real-world minutes to pass.
What We Look For:
To gain insight into your thought process, please include brief documentation explaining the key design decisions you made. Also, AI tools are welcome here—we use them too!
In addition, we’d love to see the following in your submission for extra points: 
• Clean Code Architecture: Exceptional object-oriented or functional code, avoiding repetition, favoring a consistent organization, and sticking closely to the semantics of your chosen language.
• Robust Automated Testing: A verification test suite to make sure that the project solves the task at hand.
• Version Control Best Practices: Correct usage of Git, displaying a clear commit history and incremental software delivery practices.
• Orchestration: The use of Docker Compose for easy environment setup and observability (logging/metrics).