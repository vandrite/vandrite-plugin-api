export abstract class Component {
  private _loaded: boolean = false;
  private _children: Component[] = [];
  private _intervals: number[] = [];
  private _disposables: (() => void)[] = [];

  /**
   * Load this component and its children
   */
  load(): void {
    if (this._loaded) return;
    this._loaded = true;
    this.onload();
  }

  /**
   * Unload this component and its children
   */
  unload(): void {
    if (!this._loaded) return;

    // Unload children first
    this._children.forEach((child) => child.unload());
    this._children = [];

    // Clear intervals
    this._intervals.forEach((id) => window.clearInterval(id));
    this._intervals = [];

    // Run disposables
    this._disposables.forEach((cb) => cb());
    this._disposables = [];

    this.onunload();
    this._loaded = false;
  }

  /**
   * Register a callback to be called when this component is unloaded.
   */
  register(cb: () => void): void {
    this._disposables.push(cb);
  }

  /**
   * Register an interval to be automatically cleared when this component is unloaded.
   */
  registerInterval(id: number): number {
    this._intervals.push(id);
    return id;
  }

  /**
   * Override this to perform initialization logic
   */
  onload(): void {}

  /**
   * Override this to perform cleanup logic
   */
  onunload(): void {}

  /**
   * Add a child component. It will be unloaded when this component is unloaded.
   */
  addChild<T extends Component>(component: T): T {
    this._children.push(component);
    return component;
  }

  /**
   * Remove a child component.
   */
  removeChild<T extends Component>(component: T): T {
    const index = this._children.indexOf(component);
    if (index !== -1) {
      this._children.splice(index, 1);
    }
    return component;
  }
}
