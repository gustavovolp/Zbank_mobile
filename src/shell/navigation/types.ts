export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type TabsParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  Logout: undefined;
};

export type AppStackParamList = {
  Tabs: undefined;
  TransactionForm: { transactionId?: string } | undefined;
};
