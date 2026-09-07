export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type TabsParamList = {
  Dashboard: undefined;
  Transactions: undefined;
};

export type AppStackParamList = {
  Tabs: undefined;
  TransactionForm: { transactionId?: string } | undefined;
};
