/**
 * Error system entry
 * @author Lorin Luo
 * @description Initializes the unified error center for Portal
 */

import type { App } from 'vue'
import { ErrorCenter } from './center'

export const errorCenter = new ErrorCenter()

/**
 * Install error center
 * @author Lorin Luo
 * @param {App} [app] - Vue app instance
 * @returns {void}
 */
export function installErrorCenter(app?: App): void {
  errorCenter.init({ app })
}

