export interface Clock {
  now(): Date;
}

export interface LocalDataEraser {
  eraseAll(): Promise<void>;
}
