import { User } from '../../../../entities/user/user.entity';
import { ZohoUserProfilePayload } from '../dto/zoho.dto';

export interface IAuthService {
  handleZohoLogin(zohoUser: ZohoUserProfilePayload): Promise<User>;
}
