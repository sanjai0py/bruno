const KeyMapping = {
  save: { mac: 'command+s', windows: 'ctrl+s', linux: 'ctrl+s', name: 'Save' },
  sendRequest: { mac: 'command+enter', windows: 'ctrl+enter', linux: 'ctrl+enter', name: 'Send Request' },
  editEnvironment: { mac: 'command+e', windows: 'ctrl+e', linux: 'ctrl+e', name: 'Edit Environment' },
  newRequest: { mac: 'command+b', windows: 'ctrl+b', linux: 'ctrl+b', name: 'New Request' },
  closeTab: { mac: 'command+w', windows: 'ctrl+w', linux: 'ctrl+w', name: 'Close Tab' },
  openPreferences: { mac: 'command+,', windows: 'ctrl+,', linux: 'ctrl+,', name: 'Open Preferences' },
  minimizeWindow: {
    mac: 'command+Shift+Q',
    windows: 'control+Shift+Q',
    linux: 'control+Shift+Q',
    name: 'Minimize Window'
  },
  switchToPreviousTab: {
    mac: 'command+pageup',
    windows: 'ctrl+pageup',
    linux: 'ctrl+pageup',
    name: 'Switch to Previous Tab'
  },
  switchToNextTab: {
    mac: 'command+pagedown',
    windows: 'ctrl+pagedown',
    linux: 'ctrl+pagedown',
    name: 'Switch to Next Tab'
  },
  closeAllTabs: { mac: 'command+shift+w', windows: 'ctrl+shift+w', linux: 'ctrl+shift+w', name: 'Close All Tabs' }
};

/**
 * Retrieves the key bindings for a specific operating system.
 *
 * @param {string} os - The operating system (e.g., 'mac', 'windows', 'linux').
 * @returns {Object} An object containing the key bindings for the specified OS.
 */
export const getKeyBindingsForOS = (os) => {
  const keyBindings = {};
  for (const [action, { name, ...keys }] of Object.entries(KeyMapping)) {
    if (keys[os]) {
      keyBindings[action] = {
        keys: keys[os],
        name
      };
    }
  }
  return keyBindings;
};

/**
 * Retrieves the key bindings for a specific action across all operating systems.
 *
 * @param {string} action - The action for which to retrieve key bindings.
 * @returns {Object|null} An object containing the key bindings for macOS, Windows, and Linux, or null if the action is not found.
 */
export const getKeyBindingsForActionAllOS = (action) => {
  const actionBindings = KeyMapping[action];

  if (!actionBindings) {
    console.warn(`Action "${action}" not found in KeyMapping.`);
    return null;
  }

  return [actionBindings.mac, actionBindings.windows, actionBindings.linux];
};
