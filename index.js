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

const { Plugin } = require("powercord/entities");
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
