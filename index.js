/* This file is part of WordNotifications, a Powercord plugin that notifies you when someone says specific words
 * Copyright (C) 2021 Vendicated
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

const { Plugin } = require("powercord/entities");
const { FluxDispatcher } = require("powercord/webpack");
const Command = require("./command");
const Settings = require("./Components/Settings");
const { TOAST_TIMEOUT, BODY_FORMAT, HEADER_FORMAT } = require("./constants");
const Handler = require("./handler");

module.exports = class WordNotifications extends Plugin {
  async startPlugin() {
    this.handler = new Handler(this);
    this.command = new Command(this);
    this.onDispatch = this.handler.onDispatch.bind(this.handler);

    this.loadStylesheet("style.css");

    powercord.api.settings.registerSettings("venWnSettings", {
      category: this.entityID,
      label: "Word Notifications",
      render: Settings
    });

    // Default settings
    this.settings.set("triggerType", this.settings.get("triggerType", "plain"));
    this.settings.set("notificationType", this.settings.get("notificationType", "toasts"));
    this.settings.set("triggers", this.settings.get("triggers", []));
    this.settings.set("toastTimeout", this.settings.get("toastTimeout", TOAST_TIMEOUT));
    this.settings.set("headerFormat", this.settings.get("headerFormat", HEADER_FORMAT));
    this.settings.set("bodyFormat", this.settings.get("bodyFormat", BODY_FORMAT));
    this.settings.set("ignoreMuted", this.settings.get("ignoreMuted", true));
    this.settings.set("mutedGuilds", this.settings.get("mutedGuilds", []));
    this.settings.set("whitelistFriends", this.settings.get("whitelistFriends", true));

    FluxDispatcher.subscribe("MESSAGE_CREATE", this.onDispatch);
    FluxDispatcher.subscribe("MESSAGE_UPDATE", this.onDispatch);
  }

  pluginWillUnload() {
    this.command.unload();
    powercord.api.settings.unregisterSettings("venWnSettings");
    FluxDispatcher.unsubscribe("MESSAGE_CREATE", this.onDispatch);
    FluxDispatcher.unsubscribe("MESSAGE_UPDATE", this.onDispatch);
  }
};
