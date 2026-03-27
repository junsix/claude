export class ProfileWriteQueue {
  private queues = new Map<string, Promise<void>>();

  async enqueue(profileId: string, fn: () => Promise<void>): Promise<void> {
    const prev = this.queues.get(profileId) ?? Promise.resolve();
    const next = prev.then(fn, fn);
    this.queues.set(profileId, next);
    return next;
  }
}
