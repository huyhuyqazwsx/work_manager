export type AccountStatusBuckets = {
  pendingInSystem: string[];
  notFound: string[];
  active: string[];
  inactive: string[];
};

export type AccountIdsInfo = {
  inSystem: string[];
  notFound: string[];
};
