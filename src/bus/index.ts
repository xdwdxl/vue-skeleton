/**
 * Bus singleton
 * @author Lorin Luo
 */
import { CoreBus } from './core'
import type { Bus } from './types'
import { SseAdapter } from './adapters/sse'
import config from '../config'

const channelName = (import.meta.env.VITE_BUS_CHANNEL ?? 'cids:bus')

const bus: Bus = new CoreBus({ broadcastChannel: channelName })
;(window as unknown as { __CIDS_BUS__?: Bus }).__CIDS_BUS__ = bus

// Initialize SSE adapter to bridge backend events
const configSseUrl = `${config.api.baseURL}/config/events`
export const configSseAdapter = (config as any).enableConfigEvents ? new SseAdapter(bus, configSseUrl) : undefined

let notifySseAdapter: SseAdapter | undefined

export function initNotifySseAdapter(urlFactory: string | (() => string | Promise<string>)) {
  try { notifySseAdapter?.close() } catch {}
  notifySseAdapter = new SseAdapter(bus, urlFactory)
  return notifySseAdapter
}

export default bus
