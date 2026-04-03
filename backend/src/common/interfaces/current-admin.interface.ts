export interface CurrentAdmin {
  id: number;
  publicId: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  status: string;
  mustChangePassword: boolean;
  sessionId: number;
  roles: Array<{
    id: number;
    code: string;
    name: string;
    description: string | null;
  }>;
  permissions: string[];
}
