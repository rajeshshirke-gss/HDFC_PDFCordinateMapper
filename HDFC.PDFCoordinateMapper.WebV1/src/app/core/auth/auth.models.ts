export interface LoginRequest {
  userId: string;
  password: string;
}

export interface AuthUser {
  userId: string;
  userName: string;
  roles: string[];
  roleId: string;
}

export interface AuthSession {
  token: string | null;
  tokenType: string;
  expiresInSeconds: number | null;
  sessionId: string;
  user: AuthUser;
  rawLoginData: unknown;
}

export interface ModuleAccessItem {
  raw: Record<string, unknown>;
  moduleId: string;
  moduleName: string;
  roleId: string;
  link: string;
}

export interface MenuNode {
  raw: Record<string, unknown>;
  id: string;
  parentId: string;
  moduleId: string;
  label: string;
  route: string;
  icon: string;
  iconType: 'fontawesome' | 'material';
  order: number;
  children: MenuNode[];
}
