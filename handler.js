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

const { getModule, _getModules } = require("powercord/webpack");
const { TOAST_TIMEOUT, HEADER_FORMAT, BODY_FORMAT } = require("./constants");

const { transitionTo } = getModule(["transitionTo"], false);
const { getChannel } = getModule(["getChannel"], false);
const { getCurrentUser } = getModule(["getCurrentUser"], false);

module.exports = class Handler {
  constructor({ settings }) {
    this.cache = new Map();
    this.settings = settings;
    this.deleteToast = this.deleteToast.bind(this);
  }

  get regex() {
    return new RegExp(`(^|[^A-Z0-9]+)${this.triggers.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")}([^A-Z0-9]+|$)`, "gi");
  }

  get triggers() {
    return this.settings.get("triggers", []);
  }

  get toastTimeout() {
    return this.settings.get("toastTimeout", TOAST_TIMEOUT);
  }

  get headerFormat() {
    return this.settings.get("headerFormat", HEADER_FORMAT);
  }

  get bodyFormat() {
    return this.settings.get("bodyFormat", BODY_FORMAT);
  }

  get ignoreSelf() {
    return this.settings.get("ignoreSelf", true);
  }

  get ignoreMuted() {
    return this.settings.get("ignoreMuted", true);
  }

  get mutedGuilds() {
    return this.settings.get("mutedGuilds", []);
  }

  queueToast(id, data) {
    if (typeof this.toast === "undefined") {
      this.toast = true;
      powercord.api.notices.sendToast(id, { ...data, callback: this.deleteToast });
    } else {
      setTimeout(() => this.queueToast(id, data), 500);
    }
  }

  deleteToast() {
    // Wait for cooldown https://github.com/powercord-org/powercord/blob/727a66a1fde5b2405285781faba257caa5bf7b2d/src/Powercord/apis/notices.js#L104
    setTimeout(() => delete this.toast, 600);
  }

  onDispatch(event) {
    if (!this.triggers.length) return;
    if (!event || !(event.type === "MESSAGE_CREATE" || event.type === "MESSAGE_UPDATE")) return;

    const { message } = event;
    if (!message || !message.author || message.author.bot || !message.content || message.state === "SENDING") return;

    let { id, content, edited_timestamp, guild_id, channel_id } = message;

    let matches = this.findTriggers(content);
    if (!matches.size) return;

    if (this.ignoreSelf && getCurrentUser().id === message.author.id) return;
    if (!guild_id) guild_id = getChannel(channel_id).guild_id;
    if (guild_id && this.mutedGuilds.includes(guild_id)) return;

    if (edited_timestamp) {
      const cached = this.cache.get(id);
      if (cached) {
        if (cached.content === content) return;
        if (matches.keys().every(trigger => cached.matches.has(trigger))) return;
      }
    } else if (this.cache.has(id)) return;

    this.cache.set(id, { matches, content });
    this.sendToast(matches, message);
  }

  findTriggers(str) {
    const { regex } = this;
    const matches = new Map();
    let match;

    while ((match = regex.exec(str))) {
      const trigger = match[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!matches.has(trigger)) matches.set(trigger, match[0]);
    }

    return matches;
  }

  sendToast(triggers, msg) {
    this.queueToast("ven-notifier", {
      header: this.format(this.headerFormat, triggers, msg),
      content: this.format(this.bodyFormat, triggers, msg),
      image: this.getAvatarUrl(msg.author.id, msg.author.avatar),
      type: "info",
      timeout: this.toastTimeout * 1000,
      buttons: [
        {
          text: "Jump",
          color: "green",
          size: "medium",
          look: "outlined",
          onClick: () => transitionTo(this.getMessageLink(msg.guild_id, msg.channel_id, msg.id))
        }
      ]
    });
  }

  format(str, triggers, { content, guild, author: { username, discriminator, id: authorId }, guild_id, channel_id }) {
    const replacements = {
      CONTENT: content,
      TRIGGERS: Array.from(triggers.values()).join(", "),
      TRIGGER_COUNT: triggers.size,
      GUILD_ID: guild_id || authorId,
      GUILD_NAME: guild ? guild.name : username,
      CHANNEL_ID: channel_id,
      CHANNEL_NAME: getChannel(channel_id).name,
      USER_ID: authorId,
      USER_NAME: username,
      get USER_TAG() {
        return `${username}#${discriminator}`;
      },
      get TRIGGER_CONTEXT() {
        const words = content.split(/ +/).map(x => x.toLowerCase());
        let result = [];
        for (const trigger of triggers.keys()) {
          const idx = words.findIndex(w => w.includes(trigger));
          if (idx === -1) continue;
          const startIdx = Math.max(0, idx - 5);
          const endIdx = Math.min(words.length, idx + 5);
          for (let i = startIdx; i < endIdx; i++) {
            result.push(i);
          }
        }
        result = [...new Set(result)].sort((a, b) => a - b);
        let resultStr = "";
        let last = -1;

        for (const value of result) {
          if (value - last !== 1) resultStr += "...";
          const word = words[value];

          let shouldUpper = false;
          for (const t of triggers.keys()) {
            if (word.includes(t)) {
              shouldUpper = true;
              break;
            }
          }

          resultStr += " " + (shouldUpper ? word.toUpperCase() : word);
          last = value;
        }
        if (last !== words.length - 1) resultStr += "...";

        return resultStr;
      }
    };

    return str.replace(/\{(\w+)\}/g, match => {
      const key = match.slice(1, -1).toUpperCase();
      return Object.prototype.hasOwnProperty.call(replacements, key) ? replacements[key] : match;
    });
  }

  getAvatarUrl(id, hash, discriminator) {
    const url = hash ? `avatars/${id}/${hash}.${hash.startsWith("_a") ? "gif" : "png"}` : `embed/avatars/${discriminator % 5}.png`;
    return `https://cdn.discordapp.com/${url}`;
  }

  getMessageLink(guildId, channelId, messageId) {
    return `/channels/${guildId || "@me"}/${channelId}/${messageId}`;
  }
};
