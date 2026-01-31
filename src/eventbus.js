// Simple event bus for lightweight cross-module communication
const listeners = {};

export const on = (event, cb) => {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(cb);
  return () => off(event, cb);
};

export const off = (event, cb) => {
  if (!listeners[event]) return;
  listeners[event] = listeners[event].filter(fn => fn !== cb);
  if (listeners[event].length === 0) delete listeners[event];
};

export const emit = (event, payload) => {
  const fns = listeners[event] || [];
  for (let i = 0; i < fns.length; i++) {
    try { fns[i](payload); } catch (e) { console.error('eventBus handler error', e); }
  }
};

export default { on, off, emit };
