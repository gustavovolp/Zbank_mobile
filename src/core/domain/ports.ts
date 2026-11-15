export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

export interface LocalDataEraser {
  eraseAll(): Promise<void>;
}
