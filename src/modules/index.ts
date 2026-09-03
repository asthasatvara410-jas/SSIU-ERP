/**
 * SSIU ERP — Master Modules Plugin Loader
 * File: src/modules/index.ts
 *
 * Imports and auto-registers all self-contained ERP modules into the runtime registry.
 */

import './organization';
import './permissions';
import './database';
import './students';
import './staff';
import './hr';
import './attendance';
import './fees';
import './finance';
import './academics';
import './examination';
import './lms';
import './dms';

export * from './moduleRegistry';
export * from './organization';
export * from './permissions';
export * from './database';
export * from './students';
export * from './staff';
export * from './hr';
export * from './attendance';
export * from './fees';
export * from './finance';
export * from './academics';
export * from './examination';
export * from './lms';
export * from './dms';
