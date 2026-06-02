/**
 * Permission constants and RBAC types for Osiris Redux
 * Defines user roles and their associated permissions
 */

/**
 * User role types for RBAC system
 */
export type UserRole = 'public' | 'analyst' | 'operator' | 'administrator';

/**
 * Permission strings used throughout the system
 */
export type Permission =
  | 'read:entities'
  | 'write:entities'
  | 'delete:entities'
  | 'read:stats'
  | 'write:stats'
  | 'write:config'
  | 'admin:system';

/**
 * Map of permissions for each user role
 * Implements Role-Based Access Control (RBAC)
 */
export const PERMISSIONS: Record<UserRole, Permission[]> = {
  /** Public users - read-only access to basic data */
  public: [
    'read:entities',
    'read:stats'
  ],
  /** Analysts - can read and write entities and stats */
  analyst: [
    'read:entities',
    'write:entities',
    'read:stats',
    'write:stats'
  ],
  /** Operators - analysts plus config access */
  operator: [
    'read:entities',
    'write:entities',
    'delete:entities',
    'read:stats',
    'write:stats',
    'write:config'
  ],
  /** Administrators - full system access */
  administrator: [
    'read:entities',
    'write:entities',
    'delete:entities',
    'read:stats',
    'write:stats',
    'write:config',
    'admin:system'
  ]
};