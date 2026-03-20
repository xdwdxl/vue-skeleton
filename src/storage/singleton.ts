/**
 * Storage singleton
 * @author Lorin Luo
 * @description Exposes a single StorageManager instance for the app
 */

import { PortalStorageManager } from './manager'

export const storage = new PortalStorageManager()
storage.init()


