export interface InviteImportResponse {
  total: number;
  success: number;
  failed: number;
  errors: {
    row: number;
    email?: string;
    reason: string;
  }[];
}
