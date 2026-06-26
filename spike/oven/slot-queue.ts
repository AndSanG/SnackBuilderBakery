// Spike: the oven-side data structure. The estimator assigns each item to the
// earliest-free slot, then advances that slot's free time. With S = 6 ovens
// that is a linear Math.min scan. This explores replacing the scan with a min
// heap when the oven count grows.

export interface SlotQueue {
  // Assign a job of `duration` to the earliest-free slot and return its finish
  // time. The slot then frees at that finish time.
  assign(duration: number): number;
}

// Current approach: a flat array of slot free-times, scanned for the minimum.
// O(S) per assignment.
export class ArrayScanSlotQueue implements SlotQueue {
  private readonly free: number[];

  constructor(slotCount: number) {
    this.free = new Array<number>(slotCount).fill(0);
  }

  assign(duration: number): number {
    let min = 0;
    for (let i = 1; i < this.free.length; i++) {
      if (this.free[i] < this.free[min]) min = i;
    }
    const finish = this.free[min] + duration;
    this.free[min] = finish;
    return finish;
  }
}

// Alternative: a binary min-heap of slot free-times. assign is replace-min,
// O(log S). An all-equal array is already a valid heap, so no build step.
export class HeapSlotQueue implements SlotQueue {
  private readonly heap: number[];

  constructor(slotCount: number) {
    this.heap = new Array<number>(slotCount).fill(0);
  }

  assign(duration: number): number {
    const finish = this.heap[0] + duration;
    this.heap[0] = finish;
    this.siftDown();
    return finish;
  }

  private siftDown(): void {
    const n = this.heap.length;
    let i = 0;
    for (;;) {
      const left = 2 * i + 1;
      const right = left + 1;
      let smallest = i;
      if (left < n && this.heap[left] < this.heap[smallest]) smallest = left;
      if (right < n && this.heap[right] < this.heap[smallest]) smallest = right;
      if (smallest === i) break;
      [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
      i = smallest;
    }
  }
}
