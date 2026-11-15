export interface NewUserInitializer {
  initialize(uid: string): Promise<void>;
}
