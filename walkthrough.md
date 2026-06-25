# Code Walkthrough

A guided tour of how the codebase fits together. It traces one order through every layer, then explains the two designs worth understanding. Frontend analogies are used throughout.

## 1. The mental model: layers as concentric rings

Clean architecture is one rule: **dependencies point inward**. Outer rings know about inner rings, never the reverse.

```
   ┌─────────────────────────────────────────────┐
   │ presentation/   HTTP. Controllers, DTOs,     │   (the "frameworky" edge)
   │                 exception filters            │
   │   ┌───────────────────────────────────────┐  │
   │   │ application/  use cases (PlaceOrder,   │  │   (your business operations)
   │   │               ConfirmPayment) + ports  │  │
   │   │   ┌─────────────────────────────────┐ │  │
   │   │   │ domain/  Order, Kitchen,         │ │  │   (pure rules, no imports
   │   │   │          bake times, tiers       │ │  │    from Nest or anything)
   │   │   └─────────────────────────────────┘ │  │
   │   └───────────────────────────────────────┘  │
   │ infrastructure/ adapters: in-memory repos    │   (the "outside world" edge)
   └─────────────────────────────────────────────┘
```

The test of whether it is working: open [src/orders/application/place-order.ts](src/orders/application/place-order.ts) and [src/kitchen/domain/kitchen.ts](src/kitchen/domain/kitchen.ts). They have **zero `@nestjs/...` imports**. The business logic does not know it is in a web server. That is the whole point: you could swap NestJS for a CLI, or in-memory storage for Postgres, without touching these files.

Frontend analogy: it is like keeping your pure data-transformation functions free of React. The components (controllers) are the framework edge; the logic underneath is plain TypeScript.

## 2. Folder anatomy (every feature module looks the same)

```
src/orders/
  domain/          order.ts, order-source.ts, priority-tier.ts   types & rules
  application/     place-order.ts, confirm-payment.ts, ...        use cases
                   order-repository.ts, menu-catalog.ts, ...      PORTS (interfaces)
  infrastructure/  in-memory-order-repository.ts                  ADAPTERS (impls)
  presentation/    orders.controller.ts, dto/, *.filter.ts        HTTP
  orders.module.ts                                                the wiring
```

`src/menu/` and `src/kitchen/` follow the same shape. `src/shared/` holds cross-cutting pieces (the `Clock`, the `Category` enum and bake times).

## 3. Trace a request: `POST /orders/:id/confirm`

This is the richest path. It touches Orders, the Kitchen, and the Clock. Follow it inward and back out.

### (a) HTTP arrives

[orders.controller.ts](src/orders/presentation/orders.controller.ts):

```ts
@Post(':id/confirm')
async confirm(@Param('id') id: string) {
  return this.confirmPayment.execute(id);
}
```

The controller is deliberately dumb: it pulls `id` off the URL and delegates. No logic. (For `POST /orders`, the `@Body() dto: PlaceOrderDto` is validated before this method runs. See section 4.)

### (b) The use case runs the operation

[confirm-payment.ts](src/orders/application/confirm-payment.ts):

```ts
async execute(orderId: string): Promise<Confirmation> {
  const order = await this.orders.findById(orderId);
  if (order === null) throw new OrderNotFoundError(orderId);
  if (order.status !== OrderStatus.AwaitingPayment)
    throw new OrderAlreadyConfirmedError(orderId);   // the 409 guard

  const kitchenItems = order.items.map(...);

  // estimate BEFORE enqueue, so the order's own items are not counted twice
  const estimatedReadyTime = await this.kitchen.estimateReadyTime(kitchenItems);
  await this.kitchen.enqueue(kitchenItems);

  await this.orders.save({ ...order, status: OrderStatus.InKitchen, estimatedReadyTime });
  return { orderId: order.id, status: OrderStatus.InKitchen, estimatedReadyTime };
}
```

Notice `this.orders` and `this.kitchen` are **interfaces** (`OrderRepository`, `KitchenService`), not concrete classes. The use case never imports the in-memory repo or the real Kitchen. It states what it needs; something else decides what fulfills it. Those interfaces are the **ports**.

### (c) The ports

They live next to the use case that needs them: [order-repository.ts](src/orders/application/order-repository.ts), [kitchen-service.ts](src/orders/application/kitchen-service.ts). The key idea is "consumer-owned": Orders defines the `KitchenService` interface, sized to exactly the two things `ConfirmPayment` needs:

```ts
export interface KitchenService {
  enqueue(items: KitchenItem[]): Promise<void>;
  estimateReadyTime(items: KitchenItem[]): Promise<Date>;
}
```

The Kitchen module does not get to dictate a fat API. The consumer declares its needs.

### (d) The adapters implement the ports

[in-memory-order-repository.ts](src/orders/infrastructure/in-memory-order-repository.ts) is just a `Map`:

```ts
async findById(id: string): Promise<Order | null> {
  return this.orders.get(id) ?? null;
}
```

When you add Postgres later, you write a `PostgresOrderRepository` implementing the same interface and change one line of wiring. The use case is untouched. That is the swappability the whole structure buys you.

The kitchen side is more interesting. [kitchen-service.adapter.ts](src/kitchen/infrastructure/kitchen-service.adapter.ts) wraps the stateful `Kitchen` and the `Clock`:

```ts
async estimateReadyTime(items: KitchenItem[]): Promise<Date> {
  const now = this.clock.now();
  this.kitchen.reconcile(now);                          // catch up to "now" first
  return this.kitchen.estimateReadyTime(items, now);
}
```

### (e) Back out

The use case returns a plain `Confirmation` object, the controller returns it, and Nest serializes it to JSON. If instead a `throw` happened, the **exception filter** [orders-exception.filter.ts](src/orders/presentation/orders-exception.filter.ts) catches the domain error and maps it to a status: `OrderNotFoundError` to 404, `OrderAlreadyConfirmedError` to 409, else 400. This is how the inner layers stay framework-free: they throw meaningful domain errors, and only this edge file knows about HTTP numbers.

## 4. DTO validation (the `400` path)

For `POST /orders`, the body is checked before your code runs, declaratively, in [place-order.dto.ts](src/orders/presentation/dto/place-order.dto.ts):

```ts
export class PlaceOrderDto {
  @IsArray() @ArrayNotEmpty() @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  items!: OrderLineDto[];

  @IsEnum(OrderSource)
  source!: OrderSource;
}
```

The global `ValidationPipe` (set up in [configure-app.ts](src/configure-app.ts)) reads these decorators and rejects bad input with a 400 before `PlaceOrder` ever sees it. Frontend analogy: this is your zod or yup form schema, but at the API boundary. The `!` is just TypeScript's "trust me, the framework fills this in."

## 5. How the pieces get connected: the module

The use cases take interfaces in their constructors. Who passes the real objects in? The module. [orders.module.ts](src/orders/orders.module.ts) is the wiring diagram:

```ts
{
  provide: ConfirmPayment,
  useFactory: (orders, kitchen) => new ConfirmPayment(orders, kitchen),
  inject: [ORDER_REPOSITORY, KITCHEN_SERVICE],   // what to pass, by token
}
```

`ORDER_REPOSITORY` and `KITCHEN_SERVICE` are **Symbol tokens**. Interfaces do not exist at runtime, so you cannot inject "an `OrderRepository`". You inject a token that is bound to a concrete class elsewhere. It reads as: "to build `ConfirmPayment`, construct an `InMemoryOrderRepository` and a `KitchenServiceAdapter`, and hand them in."

Frontend analogy: this is exactly React Context. `provide` is `<Provider value={...}>`, `inject` is `useContext`. The component asks for a contract; the provider supplies the implementation. NestJS just does it at construction time instead of render time.

The token-placement detail that avoids a circular import: Orders owns the `KITCHEN_SERVICE` token and provides the binding; the Kitchen module only exports its raw `Kitchen` singleton ([kitchen.module.ts](src/kitchen/kitchen.module.ts)). So Orders depends on Kitchen, never the reverse.

## 6. The two clever bits

### The poll-based Kitchen

[kitchen.ts](src/kitchen/domain/kitchen.ts). There are no timers anywhere. The kitchen is a plain data structure (6 slots and a queue) that only changes when someone calls `reconcile(now)`:

```ts
reconcile(now: Date): void {
  this.completeFinished(now);   // any slot where now - startedAt >= bakeTime is freed
  this.fillFreeSlots(now);      // pull from queue into free slots, FIFO
}
```

"Is this item done?" is pure arithmetic: `startedAt + bakeDuration <= now`. No `setTimeout`, nothing to leak, and, crucially, fully deterministic, because "now" is an argument, not `Date.now()`.

`estimateReadyTime` runs that exact same scheduling algorithm forward on a throwaway copy of the slots and queue. That is why an estimate can never lie about how the kitchen actually behaves: prediction and reality share one algorithm. Read the two methods side by side; that symmetry is the core idea.

### The Clock port

[clock.ts](src/shared/clock/clock.ts). Time is hidden behind `now(): Date`. Production uses `SystemClock` (real time). Tests use [fake-clock.ts](src/shared/clock/fake-clock.ts) with an `advance(minutes)` method. That single seam is what lets the e2e test bake a cookie in 0ms:

```ts
clock.advance(5);                                  // 5 minutes "pass" instantly
await request(server).post('/orders/reconcile');   // kitchen catches up
// the order is now Ready
```

Without it, that test would have to sleep for 5 real minutes. With it, time is just a number you control.

## 7. The one path that ties it all together

Read these files in order:

1. [orders.controller.ts](src/orders/presentation/orders.controller.ts): the HTTP edge.
2. [confirm-payment.ts](src/orders/application/confirm-payment.ts): the use case and its ports.
3. [kitchen-service.adapter.ts](src/kitchen/infrastructure/kitchen-service.adapter.ts): the adapter that fulfills a port.
4. [kitchen.ts](src/kitchen/domain/kitchen.ts): the pure scheduling domain.
5. [orders.module.ts](src/orders/orders.module.ts): how they were all connected.

For how the project is built (TDD, clean architecture, testing flavor), see the guides under [docs/agents/](docs/agents/).
