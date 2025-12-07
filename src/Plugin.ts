import { App, PluginManifest, Command, EventRef, PluginSettings, WorkspaceLeaf } from './types';
import { Component } from './Component';
import { View } from './View';
import { PluginSettingTab } from './PluginSettingTab';

export abstract class Plugin extends Component {
  app: App;
  manifest: PluginManifest;
  enabled: boolean = false;
  private registeredCommands: string[] = [];
  private registeredEvents: EventRef[] = [];
  private settingsData: PluginSettings = {};

  constructor(app: App, manifest: PluginManifest) {
    super();
    this.app = app;
    this.manifest = manifest;
  }

  /**
   * Called when the plugin is loaded
   * Override this to initialize your plugin
   */
  abstract onload(): Promise<void> | void;

  /**
   * Called when the plugin is unloaded
   * Override this to cleanup resources
   */
  onunload(): void {
    // Cleanup registered commands
    this.registeredCommands.forEach((id) => {
      this.app.commands.unregister(id);
    });

    // Cleanup registered events
    this.registeredEvents.forEach((ref) => {
      this.app.events.off(ref);
    });
  }

  /**
   * Register a command
   */
  addCommand(command: Command): void {
    this.app.commands.register(command);
    this.registeredCommands.push(command.id);
  }

  /**
   * Register an event listener
   */
  registerEvent(ref: EventRef): void {
    this.registeredEvents.push(ref);
  }

  /**
   * Register a new view type
   */
  registerView(type: string, viewCreator: (leaf: WorkspaceLeaf) => View): void {
    this.app.workspace.registerView(type, viewCreator);
    this.register(() => {
      this.app.workspace.unregisterView(type);
    });
  }

  /**
   * Register file extensions to be handled by a view
   */
  registerExtensions(extensions: string[], viewType: string): void {
    this.app.workspace.registerExtensions(extensions, viewType);
    this.register(() => {
      this.app.workspace.unregisterExtensions(extensions);
    });
  }

  /**
   * Load CSS for the plugin
   */
  loadCss(css: string): void {
    const style = document.createElement('style');
    style.id = `plugin-css-${this.manifest.id}`;
    style.textContent = css;
    document.head.appendChild(style);
    this.register(() => {
      style.remove();
    });
  }

  /**
   * Get the settings directory path for this plugin
   * Uses the OS-specific app config directory (AppData on Windows)
   */
  private async getSettingsDir(): Promise<string> {
    const { appConfigDir, join } = await import('@tauri-apps/api/path');
    const configDir = await appConfigDir();
    return await join(configDir, 'plugins', this.manifest.id);
  }

  /**
   * Get the settings file path for this plugin
   * Returns: {appConfigDir}/plugins/{pluginId}/settings.json
   */
  private async getSettingsPath(): Promise<string> {
    const { join } = await import('@tauri-apps/api/path');
    const settingsDir = await this.getSettingsDir();
    return await join(settingsDir, 'settings.json');
  }

  /**
   * Ensure the plugin's settings directory exists
   */
  private async ensureSettingsDir(): Promise<void> {
    try {
      const { appConfigDir, join } = await import('@tauri-apps/api/path');
      const { exists, mkdir } = await import('@tauri-apps/plugin-fs');

      const configDir = await appConfigDir();
      const pluginsDir = await join(configDir, 'plugins');
      const pluginDir = await join(pluginsDir, this.manifest.id);

      // Create plugins dir if needed
      if (!(await exists(pluginsDir))) {
        await mkdir(pluginsDir, { recursive: true });
      }

      // Create plugin-specific dir if needed
      if (!(await exists(pluginDir))) {
        await mkdir(pluginDir, { recursive: true });
      }
    } catch (error) {
      console.error(`Failed to create settings directory for ${this.manifest.id}:`, error);
    }
  }

  /**
   * Load plugin settings
   * Settings are stored in: {appConfigDir}/plugins/{pluginId}/settings.json
   */
  async loadData(): Promise<PluginSettings> {
    try {
      const { exists, readTextFile } = await import('@tauri-apps/plugin-fs');
      const settingsPath = await this.getSettingsPath();

      if (await exists(settingsPath)) {
        const data = await readTextFile(settingsPath);
        this.settingsData = JSON.parse(data);
        return this.settingsData;
      }
      return {};
    } catch (error) {
      console.error(`Failed to load settings for ${this.manifest.id}:`, error);
      return {};
    }
  }

  /**
   * Save plugin settings
   * Settings are stored in: {appConfigDir}/plugins/{pluginId}/settings.json
   */
  async saveData(data: PluginSettings): Promise<void> {
    try {
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');
      await this.ensureSettingsDir();
      const settingsPath = await this.getSettingsPath();
      this.settingsData = data;
      await writeTextFile(settingsPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Failed to save settings for ${this.manifest.id}:`, error);
    }
  }

  /**
   * Add a ribbon icon (left sidebar)
   */
  addRibbonIcon(icon: string, title: string, callback: (evt: MouseEvent) => void): HTMLElement {
    const ribbonContainer = document.querySelector('.ribbon-actions');
    const element = document.createElement('button');
    element.className = 'ribbon-action';
    element.setAttribute('aria-label', title);
    element.setAttribute('title', title);
    element.innerHTML = `<i class="${icon}"></i>`;
    element.onclick = callback;

    if (ribbonContainer) {
      ribbonContainer.appendChild(element);
      this.register(() => element.remove());
    }

    return element;
  }

  /**
   * Add a status bar item (bottom bar)
   */
  addStatusBarItem(): HTMLElement {
    const statusBar = document.querySelector('.status-bar');
    const element = document.createElement('div');
    element.className = 'status-bar-item plugin-status-bar-item';

    if (statusBar) {
      statusBar.appendChild(element);
      this.register(() => element.remove());
    }

    return element;
  }

  /**
   * Add a settings tab for this plugin
   */
  addSettingTab(tab: PluginSettingTab): void {
    this.app.plugins.registerSettingsTab(this.manifest.id, tab);
    this.register(() => {
      this.app.plugins.unregisterSettingsTab(this.manifest.id);
    });
  }
}
