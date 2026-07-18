export const routes = {
  login: '/login',
  dashboard: '/dashboard',
  customers: '/customers',
  customer: (id: string) => `/customers/${id}`,
  contracts: '/contracts',
  newContract: '/contracts/new',
  contract: (id: string) => `/contracts/${id}`,
  reports: '/reports',
  publicCustomer: (publicId: string) => `/customer/${publicId}`,
} as const;
