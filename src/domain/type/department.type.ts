export type DepartmentClassifyBuckets = {
  found: Record<string, string>; // name → id
  notFound: string[];
};
