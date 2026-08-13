// Browser-safe EventEmitter (Node's `events` module is not available in the browser)
class EventEmitter {
  private maxListeners = 10;
  private listeners: Record<string, Array<(...args: any[]) => void>> = {};

  setMaxListeners(n: number) {
    this.maxListeners = n;
  }

  addListener(event: string, fn: (...args: any[]) => void) {
    (this.listeners[event] ||= []).push(fn);
    return this;
  }

  removeListener(event: string, fn: (...args: any[]) => void) {
    const arr = this.listeners[event];
    if (arr) {
      this.listeners[event] = arr.filter(f => f !== fn);
    }
    return this;
  }

  emit(event: string, ...args: any[]) {
    (this.listeners[event] || []).forEach(fn => fn(...args));
    return this;
  }
}
const eventBus = new EventEmitter();

const WIDGET_MOVE = 'widgetMove';
const WIDGET_MOVE_END = 'widgetMoveEnd';
const BOARD_SCROLL = 'boardScroll';
eventBus.setMaxListeners(1000);
interface FnWidgetMove {
  (selectedIdStr: string, deltaX: number, deltaY: number): void;
}

export const widgetMove = {
  on: (fn: FnWidgetMove) => {
    eventBus.addListener(WIDGET_MOVE, fn);
  },
  emit: (selectedIdStr: string, deltaX: number, deltaY: number) => {
    eventBus.emit(WIDGET_MOVE, selectedIdStr, deltaX, deltaY);
  },
  off: (fn: FnWidgetMove) => {
    eventBus.removeListener(WIDGET_MOVE, fn);
  },
};
export const widgetMoveEnd = {
  on: (fn: () => void) => {
    eventBus.addListener(WIDGET_MOVE_END, fn);
  },
  emit: () => {
    eventBus.emit(WIDGET_MOVE_END);
  },
  off: (fn: () => void) => {
    eventBus.removeListener(WIDGET_MOVE_END, fn);
  },
};
//
export const getScrollEvName = id => `${BOARD_SCROLL}_${id}`;
export const boardScroll = {
  on: (boardId: string, fn: () => void) => {
    eventBus.addListener(getScrollEvName(boardId), fn);
  },
  emit: (boardId: string) => {
    eventBus.emit(getScrollEvName(boardId));
  },
  off: (boardId: string, fn: () => void) => {
    eventBus.removeListener(getScrollEvName(boardId), fn);
  },
};
