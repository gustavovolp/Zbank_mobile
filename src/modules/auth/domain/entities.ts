export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}
