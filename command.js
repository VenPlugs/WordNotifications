/* WordNotifications, a Powercord plugin that notifies you when someone says specific words
 * Copyright (C) 2021 Vendicated
 *
 * WordNotifications is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * WordNotifications is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with WordNotifications.  If not, see <https://www.gnu.org/licenses/>.
 */

const commands = {
  list: "List all triggers",
  add: "Add one or more triggers",
  remove: "Remove one or more triggers",
  clear: "Remove all triggers"
};

module.exports = class Command {
  constructor({ settings }) {
    this.settings = settings;

    powercord.api.commands.registerCommand({
      command: "triggers",
      description: "Manage your custom notification triggers. Hint: You can also do this and way more in the settings",
      usage: `{c} [${Object.keys(commands).join(" | ")}]`,
      executor: this.executor.bind(this),
      autocomplete: this.autocomplete.bind(this)
    });
  }

  unload() {
    powercord.api.commands.unregisterCommand("triggers");
  }

  get triggers() {
    return this.settings.get("triggers", []);
  }

  formatTriggers(triggers) {
    return triggers.map(t => `\`${t}\``).join(", ");
  }

  executor(input) {
    const [command, ...args] = input.map(x => x.toLowerCase());
    const { triggers } = this;
    switch (command) {
      case "clear":
        this.settings.set("triggers", []);
        return {
          result: "Done!"
        };

      case "add":
        if (!args.length)
          return {
            result: "You didn't specify any triggers to add"
          };

        const added = [];
        for (const arg of args) {
          if (triggers.includes(arg)) continue;
          triggers.push(arg);
          added.push(arg);
        }

        return {
          result: added.length
            ? `Successfully added ${this.formatTriggers(added)}\n\nAll triggers: ${this.formatTriggers(triggers)}`
            : "All specified triggers already exist"
        };

      case "remove":
        if (!args.length)
          return {
            result: "You didn't specify any triggers to remove"
          };

        const removed = [];
        for (const arg of args) {
          if (!triggers.includes(arg)) continue;
          triggers.splice(triggers.indexOf(arg), 1);
          removed.push(arg);
        }

        return {
          result: added.length
            ? `Successfully removed ${this.formatTriggers(removed)}\n\nRemaining triggers: ${this.formatTriggers(triggers) || "None"}`
            : "None of the specified triggers exist"
        };

      case "list":
      case undefined:
        return {
          result: triggers.length ? this.formatTriggers(triggers) : "You don't have any triggers"
        };

      default:
        return {
          result: `Invalid command ${command}`
        };
    }
  }

  autocomplete(args) {
    if (args.length > 1) {
      switch (args[0].toLowerCase()) {
        case "remove":
          const { triggers } = this;
          if (!triggers.length)
            return {
              commands: [{ command: "You don't have any triggers to remove", instruction: true }]
            };

          args = args.slice(1).map(x => x.toLowerCase());
          return {
            header: "Please specify which triggers you would like to remove",
            commands: triggers.filter(t => !args.includes(triggers)).map(t => ({ command: t }))
          };

        default:
          return false;
      }
    }

    return {
      header: "Trigger management",
      commands: Object.keys(commands)
        .filter(cmd => cmd.includes((args[0] || "").toLowerCase()))
        .map(cmd => ({ command: cmd, description: commands[cmd] }))
    };
  }
};
