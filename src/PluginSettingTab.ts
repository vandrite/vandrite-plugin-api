import { Plugin } from './Plugin';

export abstract class PluginSettingTab {
  plugin: Plugin;
  id: string;
  name: string;

  constructor(plugin: Plugin, name: string) {
    this.plugin = plugin;
    this.id = plugin.manifest.id;
    this.name = name;
  }

  /**
   * Renders the settings tab content.
   * @param containerEl The container element to render into.
   */
  abstract display(containerEl: HTMLElement): void;
}
