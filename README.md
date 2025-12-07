# @vandrite/plugin-api

Official API for developing plugins for [Vandrite](https://vandrite.com), a modern note-taking application.

## Installation

```bash
npm install @vandrite/plugin-api
```

## Quick Start

```typescript
import { Plugin, PluginManifest } from '@vandrite/plugin-api';

export default class MyPlugin extends Plugin {
  async onload() {
    console.log('Plugin loaded!');

    // Add a command
    this.addCommand({
      id: 'my-command',
      name: 'My Command',
      callback: () => {
        this.app.events.trigger('notice', 'Hello from my plugin!');
      },
    });
  }

  onunload() {
    console.log('Plugin unloaded!');
  }
}
```

## Plugin Manifest

Create a `manifest.json` in your plugin folder:

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "A sample plugin",
  "author": "Your Name",
  "minAppVersion": "0.1.0"
}
```

## Available APIs

### `app.commands`

Register and execute commands.

```typescript
this.addCommand({
  id: 'my-plugin:do-something',
  name: 'Do Something',
  hotkeys: [{ modifiers: ['Mod'], key: 'p' }],
  callback: () => {
    /* ... */
  },
});
```

### `app.events`

Subscribe to application events.

```typescript
const ref = this.app.events.on('file-open', (file) => {
  console.log('File opened:', file.path);
});
this.registerEvent(ref);
```

### `app.vault`

Access files in the user's vault.

```typescript
// Read a file
const content = await this.app.vault.read('path/to/file.md');

// Write a file
await this.app.vault.create('new-file.md', 'Hello World');

// List files
const files = await this.app.vault.getFiles();
```

### `app.modals`

Show dialogs and prompts.

```typescript
// Alert
await this.app.modals.alert('Success!', 'File saved');

// Confirm
const confirmed = await this.app.modals.confirm({
  title: 'Delete?',
  message: 'This cannot be undone',
  isDangerous: true,
});

// Prompt
const name = await this.app.modals.prompt({
  title: 'Enter Name',
  placeholder: 'Type here...',
});

// Select
const choice = await this.app.modals.select({
  title: 'Choose Template',
  options: [
    { value: 'blank', label: 'Blank Note' },
    { value: 'daily', label: 'Daily Note' },
  ],
});
```

### `app.hotkeys`

Register keyboard shortcuts.

```typescript
this.app.hotkeys.register({
  id: 'my-plugin:search',
  keys: 'Mod+Shift+F', // Cmd on Mac, Ctrl on Windows
  callback: () => openSearch(),
});
```

### `app.editor`

Interact with the text editor.

```typescript
// Insert text
this.app.editor.insertText('Hello');

// Get selection
const text = this.app.editor.getSelectedText();

// Formatting
this.app.editor.toggleBold();
this.app.editor.setHeading(2);

// Content
const markdown = this.app.editor.getContent();
const words = this.app.editor.getWordCount();
```

### `app.theme`

Access and modify the current theme.

```typescript
const theme = this.app.theme.getTheme();
this.app.theme.setTheme('dark');
```

## Plugin Settings

```typescript
interface MySettings {
  showGreeting: boolean;
  greetingText: string;
}

const DEFAULT_SETTINGS: MySettings = {
  showGreeting: true,
  greetingText: 'Hello!',
};

export default class MyPlugin extends Plugin {
  settings: MySettings;

  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
```

## Settings Tab

```typescript
import { PluginSettingTab, App } from '@vandrite/plugin-api';

class MySettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const container = this.containerEl;
    container.empty();
    container.createEl('h2', { text: 'My Plugin Settings' });
    // Add your settings UI here
  }
}
```

## Building Your Plugin

1. Compile your TypeScript to JavaScript
2. Create a folder with `manifest.json` and `main.js`
3. ZIP the folder for distribution

## License

MIT
