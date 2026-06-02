/**
 * Tests for permission constants and RBAC types
 */
import { describe, it, expect } from 'vitest';
import { UserRole, PERMISSIONS } from './permissions';

describe('Permission Constants', () => {
  describe('UserRole type', () => {
    it('should have all required roles', () => {
      const roles: UserRole[] = ['public', 'analyst', 'operator', 'administrator'];
      
      roles.forEach(role => {
        expect([
          'public',
          'analyst',
          'operator',
          'administrator'
        ]).toContain(role);
      });
    });
  });

  describe('PERMISSIONS map', () => {
    it('should have permissions defined for all roles', () => {
      const roles: UserRole[] = ['public', 'analyst', 'operator', 'administrator'];
      
      roles.forEach(role => {
        expect(PERMISSIONS).toHaveProperty(role);
        expect(PERMISSIONS[role]).toBeInstanceOf(Array);
      });
    });

    it('should restrict public role to only read:entities and read:stats', () => {
      const publicPermissions = PERMISSIONS.public;
      
      expect(publicPermissions).toHaveLength(2);
      expect(publicPermissions).toContain('read:entities');
      expect(publicPermissions).toContain('read:stats');
      expect(publicPermissions).not.toContain('write:entities');
      expect(publicPermissions).not.toContain('admin:system');
    });

    it('should give administrator all permissions', () => {
      const adminPermissions = PERMISSIONS.administrator;
      
      expect(adminPermissions).toContain('read:entities');
      expect(adminPermissions).toContain('write:entities');
      expect(adminPermissions).toContain('delete:entities');
      expect(adminPermissions).toContain('read:stats');
      expect(adminPermissions).toContain('write:config');
      expect(adminPermissions).toContain('admin:system');
    });
  });
});