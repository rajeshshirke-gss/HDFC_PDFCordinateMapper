import { MenuNode } from '../../../core/auth/auth.models';

export interface ModuleMasterRecord {
  raw: Record<string, unknown>;
  autoId: string;
  moduleId: string;
  moduleName: string;
  description: string;
  link: string;
  active: string;
}

export interface RoleAccessOption {
  raw: Record<string, unknown>;
  roleId: string;
  roleCode: string;
  roleName: string;
}

export interface RoleMenuAccessSnapshot {
  modules: ModuleMasterRecord[];
  roles: RoleAccessOption[];
}

export interface ModuleMenuResult {
  module: ModuleMasterRecord;
  menu: MenuNode[];
}
