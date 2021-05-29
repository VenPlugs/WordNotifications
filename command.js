/* WordNotifications, a Powercord plugin that notifies you when someone says specific words
 * Copyright (C) 2021 Vendicated
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

const { isTriggerValid } = require("./util");

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

  executor(input) {
    const [command, ...args] = input.map(x => x.toLowerCase());
    const { triggers } = this;
    let response = "```diff\n";
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

        let skipped = 0;
        const added = [];
        for (const arg of args) {
          if (!isTriggerValid(arg, -1, this.settings.get("triggerType", "plain"), triggers)) {
            skipped++;
            continue;
          }
          triggers.push(arg);
          added.push(arg);
        }

        return {
          result: added.length
            ? response + `+>> Successfully added ${added.length} triggers:\n\t${added.join(", ")}\n\n>> All triggers:\n\t${triggers.join(", ")}\`\`\``
            : "Skipped all triggers as they were invalid or already existed"
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
          result: removed.length
            ? response +
              `->> Successfully removed ${removed.length} triggers:\n\t${removed.join(", ")}\n\n>> Remaining triggers: \n\t${triggers.join(", ") || "-"}\`\`\``
            : "None of the specified triggers exist"
        };

      case "list":
      case undefined:
        return {
          result: triggers.length ? "```\n>> List of triggers\n\t" + triggers.join(", ") + "```" : "You don't have any triggers"
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

          const txt = args.slice(1).map(x => x.toLowerCase());
          return {
            header: "Please specify which triggers you would like to remove",
            commands: triggers.filter(t => t.toLowerCase().includes(txt)).map(t => ({ command: t }))
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
