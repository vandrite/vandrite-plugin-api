// Plugin System Types
// Vandrite Plugin API v2.0

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Generic callback type for events
 * @template T - Tuple of argument types
 */
export type EventCallback<T extends unknown[] = []> = (...args: T) => void;

/**
 * JSON-compatible value types
 */
export type JsonPrimitive = string | number | boolean | null;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = JsonPrimitive | JsonArray | JsonObject;

/**
 * Generic object for settings/state data
 */
export type SettingsData = JsonObject;

// =============================================================================
// COMMAND SYSTEM
// =============================================================================

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  authorUrl?: string;
  minAppVersion?: string;
  main: string;
  isDesktopOnly?: boolean;
}

export interface Command {
  id: string;
  name: string;
  callback?: () => void;
  checkCallback?: (checking: boolean) => boolean | void;
  hotkeys?: Hotkey[];
  icon?: string;
}

export interface Hotkey {
  modifiers: Modifier[];
  key: string;
}

export type Modifier = 'Mod' | 'Ctrl' | 'Meta' | 'Shift' | 'Alt';

export interface Notice {
  message: string;
  timeout?: number;
}

// =============================================================================
// FILE SYSTEM TYPES
// =============================================================================

export interface FileStats {
  ctime: number;
  mtime: number;
  size: number;
}

export abstract class TAbstractFile {
  path!: string;
  name!: string;
  parent!: TFolder | null;
  vault!: VaultAPI;
}

export class TFile extends TAbstractFile {
  stat!: FileStats;
  basename!: string;
  extension!: string;
}

export class TFolder extends TAbstractFile {
  children!: TAbstractFile[];
}

// =============================================================================
// EVENT SYSTEM - Strongly Typed
// =============================================================================

/**
 * Event reference for unsubscribing
 */
export interface EventRef<K extends string = string, T extends unknown[] = unknown[]> {
  event: K;
  callback: EventCallback<T>;
}

/**
 * Vault event definitions
 */
export interface VaultEventMap {
  create: [file: TAbstractFile];
  modify: [file: TAbstractFile];
  delete: [file: TAbstractFile];
  rename: [file: TAbstractFile, oldPath: string];
}

/**
 * Workspace event definitions
 */
export interface WorkspaceEventMap {
  'file-open': [file: TFile | null];
  'layout-change': [];
  'active-leaf-change': [leaf: WorkspaceLeaf | null];
}

/**
 * App-level event definitions
 */
export interface AppEventMap extends VaultEventMap, WorkspaceEventMap {
  'theme-change': [themeName: string];
  'settings-change': [];
  'plugin-loaded': [pluginId: string];
  'plugin-unloaded': [pluginId: string];
}

/**
 * Generic Events API with type safety
 */
export interface EventsAPI {
  on<K extends keyof AppEventMap>(
    event: K,
    callback: EventCallback<AppEventMap[K]>
  ): EventRef<K & string, AppEventMap[K]>;

  on(event: string, callback: EventCallback<unknown[]>): EventRef;

  off(ref: EventRef): void;

  trigger<K extends keyof AppEventMap>(event: K, ...args: AppEventMap[K]): void;
  trigger(event: string, ...args: unknown[]): void;
}

// =============================================================================
// WORKSPACE API
// =============================================================================

/**
 * View state for serialization
 */
export interface ViewStateData {
  [key: string]: string | number | boolean | null | ViewStateData | ViewStateData[];
}

export interface ViewState {
  type: string;
  state?: ViewStateData;
  active?: boolean;
  pinned?: boolean;
  group?: string;
}

export interface OpenViewState {
  state?: ViewStateData;
  eState?: ViewStateData;
  active?: boolean;
}

/**
 * View interface - base for all views
 */
export interface IView {
  app: App;
  leaf: WorkspaceLeaf;
  containerEl: HTMLElement;

  onOpen(): Promise<void>;
  onClose(): Promise<void>;
  getViewType(): string;
  getState(): ViewStateData;
  setState(state: ViewStateData, result: ViewStateData): Promise<void>;
  getIcon(): string;
  getDisplayText(): string;
}

export interface WorkspaceLeaf {
  id: string;
  app: App;
  view: IView;

  /**
   * Open a file in this leaf
   */
  openFile(file: TFile, state?: OpenViewState): Promise<void>;

  /**
   * Set the view state
   */
  setViewState(state: ViewState): Promise<void>;

  /**
   * Get the view state
   */
  getViewState(): ViewState;

  /**
   * Detach (close) the leaf
   */
  detach(): void;
}

export interface WorkspaceAPI {
  /**
   * Get the active leaf (focused tab)
   */
  activeLeaf: WorkspaceLeaf | null;

  /**
   * Get the most recently active leaf
   */
  getMostRecentLeaf(): WorkspaceLeaf | null;

  /**
   * Get the active file
   */
  getActiveFile(): TFile | null;

  /**
   * Open a file in a leaf
   */
  openFile(file: TFile, state?: OpenViewState): Promise<WorkspaceLeaf>;

  /**
   * Get a leaf by id
   */
  getLeaf(id: string): WorkspaceLeaf | null;

  /**
   * Create a new leaf
   */
  getLeaf(create?: boolean): WorkspaceLeaf;

  /**
   * Get all leaves of a specific view type
   */
  getLeavesOfType(viewType: string): WorkspaceLeaf[];

  /**
   * Register a new view type
   */
  registerView(type: string, viewCreator: (leaf: WorkspaceLeaf) => IView): void;

  /**
   * Unregister a view type
   */
  unregisterView(type: string): void;

  // Typed event methods
  on<K extends keyof WorkspaceEventMap>(
    event: K,
    callback: EventCallback<WorkspaceEventMap[K]>,
    ctx?: object
  ): EventRef<K & string, WorkspaceEventMap[K]>;

  on(event: string, callback: EventCallback<unknown[]>, ctx?: object): EventRef;

  trigger<K extends keyof WorkspaceEventMap>(event: K, ...args: WorkspaceEventMap[K]): void;
  trigger(event: string, ...args: unknown[]): void;

  /**
   * Register file extensions to be opened with a specific view type
   */
  registerExtensions(extensions: string[], viewType: string): void;

  /**
   * Unregister file extensions
   */
  unregisterExtensions(extensions: string[]): void;
}

// =============================================================================
// VAULT API
// =============================================================================

export interface DataAdapter {
  read(path: string): Promise<string>;
  write(path: string, data: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  list(path: string): Promise<{ files: string[]; folders: string[] }>;
  mkdir(path: string): Promise<void>;
  trash(path: string, system: boolean): Promise<void>;
  rename(normalizedPath: string, normalizedNewPath: string): Promise<void>;
  remove(path: string): Promise<void>;
}

export interface VaultAPI {
  adapter: DataAdapter;

  /**
   * Read a file
   */
  read(file: TFile): Promise<string>;
  read(path: string): Promise<string>;

  /**
   * Modify a file
   */
  modify(file: TFile, data: string): Promise<void>;

  /**
   * Create a new file
   */
  create(path: string, data: string): Promise<TFile>;

  /**
   * Create a new folder
   */
  createFolder(path: string): Promise<void>;

  /**
   * Delete a file
   */
  delete(file: TAbstractFile, force?: boolean): Promise<void>;

  /**
   * Rename/Move a file
   */
  rename(file: TAbstractFile, newPath: string): Promise<void>;

  /**
   * Get a file by path
   */
  getAbstractFileByPath(path: string): TAbstractFile | null;

  /**
   * Get all files in the vault
   */
  getFiles(): TFile[];

  /**
   * Get all markdown files in the vault
   */
  getMarkdownFiles(): TFile[];

  // Typed event methods
  on<K extends keyof VaultEventMap>(
    event: K,
    callback: EventCallback<VaultEventMap[K]>,
    ctx?: object
  ): EventRef<K & string, VaultEventMap[K]>;

  on(event: string, callback: EventCallback<unknown[]>, ctx?: object): EventRef;

  trigger<K extends keyof VaultEventMap>(event: K, ...args: VaultEventMap[K]): void;
  trigger(event: string, ...args: unknown[]): void;
}

// =============================================================================
// PLUGIN SYSTEM
// =============================================================================

/**
 * Plugin settings - strongly typed
 */
export type PluginSettings = SettingsData;

/**
 * Plugin base interface - actual class is in Plugin.ts
 */
export interface IPlugin {
  app: App;
  manifest: PluginManifest;
}

/**
 * Plugin instance
 */
export interface PluginInstance {
  manifest: PluginManifest;
  path: string;
  enabled: boolean;
  instance?: IPlugin;
  settings?: PluginSettings;
  error?: string;
}

export interface PluginManager {
  getPlugin<T extends IPlugin = IPlugin>(id: string): T | undefined;
  enabledPlugins: Set<string>;
  manifests: Map<string, PluginManifest>;

  /**
   * Register a settings tab for a plugin
   */
  registerSettingsTab(pluginId: string, tab: unknown): void;

  /**
   * Unregister a settings tab for a plugin
   */
  unregisterSettingsTab(pluginId: string): void;
}

// =============================================================================
// THEME API
// =============================================================================

export type ThemeName = 'dark' | 'light' | 'catppuccin' | 'onedark' | 'stardust' | 'paper' | string;

export interface ThemeAPI {
  setTheme(themeName: ThemeName): void;
  getCurrentTheme(): string;
}

// =============================================================================
// COMMANDS API
// =============================================================================

export interface CommandsAPI {
  register(command: Command): void;
  unregister(commandId: string): void;
  executeCommand(commandId: string): void;
  listCommands(): Command[];
}

// =============================================================================
// MODAL API
// =============================================================================

export type ModalType = 'info' | 'success' | 'warning' | 'error';

export interface ModalButton {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick?: () => void;
  closeOnClick?: boolean;
}

export interface ModalOptions {
  title: string;
  content: unknown; // React.ReactNode | string
  buttons?: ModalButton[];
  width?: number | string;
  closable?: boolean;
  type?: ModalType;
  onClose?: () => void;
}

export interface InputModalOptions {
  title: string;
  placeholder?: string;
  initialValue?: string;
  label?: string;
  validate?: (value: string) => boolean | string;
  type?: 'text' | 'password' | 'email' | 'url' | 'number';
  confirmText?: string;
  cancelText?: string;
}

export interface ConfirmModalOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
}

export interface SelectModalOptions<T = string> {
  title: string;
  message?: string;
  options: Array<{ value: T; label: string; description?: string }>;
  allowMultiple?: boolean;
}

export interface ModalInstance {
  id: string;
  close: () => void;
}

export interface ModalAPI {
  showModal(options: ModalOptions): ModalInstance;
  alert(message: string, title?: string): Promise<void>;
  confirm(options: ConfirmModalOptions): Promise<boolean>;
  prompt(options: InputModalOptions): Promise<string | null>;
  select<T = string>(options: SelectModalOptions<T>): Promise<T | T[] | null>;
  closeAll(): void;
}

// =============================================================================
// HOTKEY API
// =============================================================================

export type HotkeyContext = 'global' | 'editor' | 'canvas' | 'modal';

export interface HotkeyBinding {
  id: string;
  keys: string; // e.g., "Ctrl+Shift+P", "Mod+K"
  callback: () => void;
  description?: string;
  context?: HotkeyContext;
  preventDefault?: boolean;
}

export interface HotkeyAPI {
  register(binding: HotkeyBinding): void;
  unregister(id: string): void;
  hasConflict(keys: string, context?: HotkeyContext): string | null;
  listBindings(): HotkeyBinding[];
  setContext(context: HotkeyContext): void;
  getContext(): HotkeyContext;
  formatForDisplay(keys: string): string;
}

// =============================================================================
// EDITOR API
// =============================================================================

export interface SelectionInfo {
  from: number;
  to: number;
  text: string;
  empty: boolean;
}

export interface EditorAPI {
  // Editor access
  isEditorAvailable(): boolean;

  // Text manipulation
  insertText(text: string): boolean;
  insertTextAt(text: string, position: number): boolean;
  replaceSelection(text: string): boolean;
  deleteSelection(): boolean;

  // Selection & Cursor
  getSelection(): SelectionInfo | null;
  getSelectedText(): string;
  setSelection(from: number, to: number): boolean;
  selectAll(): boolean;
  getCursorPosition(): number;
  setCursorPosition(pos: number): boolean;

  // Content
  getContent(): string;
  setContent(content: string): boolean;
  getHTML(): string;
  getText(): string;
  getWordCount(): number;
  getCharacterCount(): number;

  // Formatting
  toggleBold(): boolean;
  toggleItalic(): boolean;
  toggleStrikethrough(): boolean;
  toggleCode(): boolean;
  setHeading(level: 0 | 1 | 2 | 3 | 4 | 5 | 6): boolean;
  toggleBulletList(): boolean;
  toggleOrderedList(): boolean;
  toggleTaskList(): boolean;
  toggleBlockquote(): boolean;
  toggleCodeBlock(): boolean;
  insertHorizontalRule(): boolean;

  // Links & Media
  insertLink(url: string, text?: string): boolean;
  removeLink(): boolean;
  insertImage(src: string, alt?: string, title?: string): boolean;

  // Undo/Redo
  undo(): boolean;
  redo(): boolean;
  canUndo(): boolean;
  canRedo(): boolean;

  // Focus
  focus(): boolean;
  blur(): boolean;
  isFocused(): boolean;
}

// =============================================================================
// APP API - Main interface
// =============================================================================

export interface App {
  workspace: WorkspaceAPI;
  vault: VaultAPI;
  events: EventsAPI;
  plugins: PluginManager;
  commands: CommandsAPI;
  theme: ThemeAPI;
  modals: ModalAPI;
  hotkeys: HotkeyAPI;
  editor: EditorAPI;
}
