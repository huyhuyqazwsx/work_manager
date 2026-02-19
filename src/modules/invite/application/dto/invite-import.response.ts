import { InviteUsersResult } from '../../../user/application/dto/invite-user-result.dto';
import {
  InviteForm,
  InviteImportError,
} from '../../../../domain/type/invite.types';

export class InviteImportResponse {
  total: number;
  success: number;
  failed: number;
  validData: InviteForm[];
  errors: InviteImportError[];
  inviteResult?: InviteUsersResult;

  constructor(
    total: number,
    success: number,
    failed: number,
    validData: InviteForm[],
    errors: InviteImportError[],
    inviteResult?: InviteUsersResult,
  ) {
    this.total = total;
    this.success = success;
    this.failed = failed;
    this.validData = validData;
    this.errors = errors;
    this.inviteResult = inviteResult;
  }
}
