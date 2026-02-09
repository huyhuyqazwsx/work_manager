import { ResponseHandleZoho, ZohoUserProfilePayload } from '../dto/zoho.dto';

export interface IAuthService {
  handleZohoLogin(
    zohoUser: ZohoUserProfilePayload,
  ): Promise<ResponseHandleZoho>;
}
