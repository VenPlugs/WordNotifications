const { Plugin } = require("powercord/entities");
const { inject, uninject } = require("powercord/injector");
const { FluxDispatcher } = require("powercord/webpack");
const Command = require("./command");
const Settings = require("./Components/Settings");
const { TOAST_TIMEOUT, BODY_FORMAT, HEADER_FORMAT } = require("./constants");
const Handler = require("./handler");

module.exports = class WordTriggers extends Plugin {
  async startPlugin() {
    this.handler = new Handler(this);
    this.command = new Command(this);
    this.onDispatch = this.handler.onDispatch.bind(this.handler);

    this.loadStylesheet("style.css");
    powercord.api.settings.registerSettings("venKwnSettings", {
      category: this.entityID,
      label: "Keyword Notifications",
      render: Settings
    });

    this.settings.set("triggers", this.settings.get("triggers", []));
    this.settings.set("toastTimeout", this.settings.get("toastTimeout", TOAST_TIMEOUT));
    this.settings.set("headerFormat", this.settings.get("headerFormat", HEADER_FORMAT));
    this.settings.set("bodyFormat", this.settings.get("bodyFormat", BODY_FORMAT));
    this.settings.set("ignoreMuted", this.settings.get("ignoreMuted", true));
    this.settings.set("mutedGuilds", this.settings.get("mutedGuilds", []));

    FluxDispatcher.subscribe("MESSAGE_CREATE", this.onDispatch);
    FluxDispatcher.subscribe("MESSAGE_UPDATE", this.onDispatch);
  }

  pluginWillUnload() {
    powercord.api.settings.unregisterSettings("venKwnSettings");
    FluxDispatcher.unsubscribe("MESSAGE_CREATE", this.handler);
    FluxDispatcher.unsubscribe("MESSAGE_UPDATE", this.handler);
    this.command.unload();
  }
};
