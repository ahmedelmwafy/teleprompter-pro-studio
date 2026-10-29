import { ControllerMessage, ControllerActionType } from '../types';

type Listener = (message: ControllerMessage) => void;

class ControllerSyncService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<Listener> = new Set();
  private pairingCode: string = 'STUDIO-789';

  constructor() {
    this.initChannel();
    this.listenToStorage();
  }

  private initChannel() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.channel = new BroadcastChannel('teleprompter_sync_channel');
        this.channel.onmessage = (event) => {
          this.handleIncoming(event.data);
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported, falling back to storage events');
    }
  }

  private listenToStorage() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === 'teleprompter_remote_action' && event.newValue) {
          try {
            const data = JSON.parse(event.newValue);
            this.handleIncoming(data);
          } catch (e) {
            // ignore
          }
        }
      });
    }
  }

  private handleIncoming(message: ControllerMessage) {
    if (!message || !message.type) return;
    this.listeners.forEach(fn => fn(message));
  }

  setPairingCode(code: string) {
    this.pairingCode = code.toUpperCase();
  }

  getPairingCode(): string {
    return this.pairingCode;
  }

  sendAction(type: ControllerActionType, payload?: any) {
    const msg: ControllerMessage = {
      type,
      payload,
      senderId: typeof window !== 'undefined' ? window.name || 'remote-' + Math.random().toString(36).substring(2, 6) : 'remote',
      timestamp: Date.now()
    };

    // Broadcast channel
    if (this.channel) {
      this.channel.postMessage(msg);
    }

    // Local storage event for other windows/tabs
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('teleprompter_remote_action', JSON.stringify(msg));
        // Reset after short delay to allow repeated actions (like clicking NEXT multiple times)
        setTimeout(() => {
          localStorage.removeItem('teleprompter_remote_action');
        }, 100);
      } catch (e) {
        // storage quota or private mode
      }
    }

    // Also notify local listeners
    this.handleIncoming(msg);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const controllerSync = new ControllerSyncService();
