import { App, WorkspaceLeaf, ViewStateData } from './types';
import { Component } from './Component';

declare global {
  interface Window {
    app?: App;
  }
}

/**
 * Base class for all views
 */
export abstract class View extends Component {
  app: App;
  leaf: WorkspaceLeaf;
  containerEl: HTMLElement;

  /**
   * @param leaf The leaf this view belongs to
   */
  constructor(leaf: WorkspaceLeaf) {
    super();
    this.leaf = leaf;
    this.app = leaf.app || window.app!;
    this.containerEl = document.createElement('div');
    this.containerEl.classList.add('view-content');
    this.containerEl.style.height = '100%';
    this.containerEl.style.width = '100%';
  }

  /**
   * Called when the view is opened.
   */
  async onOpen(): Promise<void> {}

  /**
   * Called when the view is closed.
   */
  async onClose(): Promise<void> {}

  /**
   * Get the type of the view.
   */
  abstract getViewType(): string;

  /**
   * Get the display text (title) of the view.
   */
  abstract getDisplayText(): string;

  /**
   * Get the icon of the view.
   */
  getIcon(): string {
    return 'document';
  }

  /**
   * Get the state of the view.
   */
  getState(): ViewStateData {
    return {};
  }

  /**
   * Set the state of the view.
   */
  async setState(_state: ViewStateData, _result: ViewStateData): Promise<void> {}
}

/**
 * A view that displays custom content (not a file).
 */
export abstract class ItemView extends View {
  contentEl: HTMLElement;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    this.contentEl = this.containerEl;
  }
}
