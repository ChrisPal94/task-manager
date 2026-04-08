import type { Request } from 'express';
import type { UserRole } from '../../users/user.entity';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}
