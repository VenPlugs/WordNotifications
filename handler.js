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

const { getModule } = require("powercord/webpack");
const { TOAST_TIMEOUT, HEADER_FORMAT, BODY_FORMAT } = require("./constants");
const { getAvatarUrl, getAllIndexes, getMessageLink, range, uniqueSorted } = require("./util");

const { transitionTo } = getModule(["transitionTo"], false);
const { getChannel } = getModule(["getChannel"], false);
const { getGuild } = getModule(["getGuild"], false);
const { getCurrentUser } = getModule(["getCurrentUser"], false);
const { getRelationships } = getModule(["getRelationships"], false);
const { showNotification } = getModule(["showNotification"], false);
const muteStore = getModule(["isChannelMuted"], false);

module.exports = class Handler {
  constructor(cmd) {
    this.cache = new Map();
    this.error = cmd.error.bind(cmd);
    this.settings = cmd.settings;
    this.deleteToast = this.deleteToast.bind(this);
  }

  get regex() {
    const triggers = this.settings.get("triggerType", "plain") === "regex" ? this.triggers : this.triggers.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    return new RegExp(`(^|[^A-Z0-9]+)${triggers.join("|")}([^A-Z0-9]+|$)`, "gi");
  }

  get triggers() {
    return this.settings.get("triggers", []);
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
    try {
      if (!this.triggers.length) return;
      if (!event || !(event.type === "MESSAGE_CREATE" || event.type === "MESSAGE_UPDATE")) return;

      const { message } = event;
      if (!message || !message.author || message.author.bot || !message.content || message.state === "SENDING") return;

      let { id, content, edited_timestamp, guild_id, channel_id } = message;

      let matches = this.findTriggers(content);
      if (!matches.size) return;

      // For some reason guild messages sometimes just don't include the guild_id
      if (!guild_id) guild_id = getChannel(channel_id).guild_id;

      const isSelf = getCurrentUser().id === message.author.id;

      if (!this.settings.get("whitelistFriends", true) || !(isSelf || Object.prototype.hasOwnProperty.call(getRelationships(), message.author.id))) {
        if (isSelf && this.settings.get("ignoreSelf", true)) return;
        if (guild_id && this.settings.get("ignoreMuted", true) && (muteStore.isMuted(guild_id) || muteStore.isChannelMuted(guild_id, channel_id))) return;
        if (guild_id && this.settings.get("mutedGuilds", []).includes(guild_id)) return;
      }

      if (edited_timestamp) {
        const cached = this.cache.get(id);
        if (cached) {
          if (cached.content === content) return;
          if (Array.from(matches.keys()).every(trigger => cached.matches.has(trigger))) return;
        }
      } else if (this.cache.has(id)) return;

      this.cache.set(id, { matches, content });
      this.sendToast(matches, message);
    } catch (error) {
      this.error(`Something went wrong while handling message event`, error);
    }
  }

  findTriggers(str) {
    const { regex } = this;
    const matches = new Map();
    let match;

    while ((match = regex.exec(str))) {
      const trigger = match[0].toLowerCase().replace(/\W/g, "");
      if (!matches.has(trigger)) matches.set(trigger, match[0]);
    }

    return matches;
  }

  sendToast(triggers, msg) {
    const image = getAvatarUrl(msg.author.id, msg.author.avatar);
    const header = this.format(this.settings.get("headerFormat", HEADER_FORMAT), triggers, msg);
    const content = this.format(this.settings.get("bodyFormat", BODY_FORMAT), triggers, msg);
    const onClick = () => transitionTo(getMessageLink(msg.guild_id, msg.channel_id, msg.id));
    if (this.settings.get("notificationType", "toasts") === "toasts") {
      this.queueToast("ven-notifier", {
        header,
        content,
        image,
        type: "info",
        timeout: this.settings.get("toastTimeout", TOAST_TIMEOUT) * 1000,
        buttons: [
          {
            text: "Jump",
            color: "green",
            size: "medium",
            look: "outlined",
            onClick
          }
        ]
      });
    } else {
      showNotification(image, header, content, { onClick });
    }
  }

  format(str, triggers, { mentions, mention_roles, content, guild, author: { username, discriminator, id: authorId }, guild_id, channel_id }) {
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
        let str = content;
        const output = [];
        for (const [stripped, original] of triggers.entries()) {
          str = str.replace(new RegExp(`\s*${original}\s*`, "gi"), ` ${stripped} `);
        }
        const words = str.trim().split(/ +/);
        const triggerIndexes = uniqueSorted(Array.from(triggers.keys()).flatMap(t => getAllIndexes(words, t)));
        const allIndexes = uniqueSorted(triggerIndexes.flatMap(x => range(Math.max(0, x - 5), Math.min(words.length, x + 5))));
        let last = -1;
        for (const idx of allIndexes) {
          if (idx - last !== 1) output.push("...");
          if (triggerIndexes.includes(idx)) output.push(triggers.get(words[idx]).toUpperCase());
          else output.push(words[idx]);
          last = idx;
        }
        if (last !== words.length) output.push("...");
        return output.join(" ");
      }
    };

    try {
      let formatted = str.replace(/\{(\w+)\}/g, match => {
        const key = match.slice(1, -1).toUpperCase();
        return Object.prototype.hasOwnProperty.call(replacements, key) ? replacements[key] : match;
      });

      if (mentions) {
        for (const mention of mentions) {
          formatted = formatted.replace(new RegExp(`<@!?${mention.id}>`, "g"), `@${mention.username}#${mention.discriminator}`);
        }
      }

      if (mention_roles && guild_id) {
        if (!guild) guild = getGuild(guild_id);
        for (const roleId of mention_roles) {
          const role = guild.roles[roleId];
          formatted = formatted.replace(new RegExp(`<@&${roleId}>`, "g"), `@${role ? role.name : "invalid-role"}`);
        }
      }

      return formatted.replace(/<a?(:\w{2,32}:)\d{17,19}>/g, "$1").replace(/<#(\d{17,19})>/, m => {
        const channel = getChannel(m.replace(/\D/g, ""));
        return `#${channel ? channel.name : "deleted-channel"}`;
      });
    } catch (error) {
      this.error(error);
      return "Something went wrong while formatting the output. Check the console";
    }
  }
};
