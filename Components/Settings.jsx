/* WordNotifications, a Powercord plugin that notifies you when someone says specific words
 * Copyright (C) 2021 Vendicated
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

const { SliderInput, TextInput, Category, SwitchItem, RadioGroup } = require("powercord/components/settings");
const { React, getModule } = require("powercord/webpack");
const { TOAST_TIMEOUT, HEADER_FORMAT, BODY_FORMAT } = require("../constants");
const Trigger = require("./Trigger");

const { useState, useEffect } = React;
const { getFlattenedGuilds } = getModule(["getFlattenedGuilds"], false);

const placeHolders = [
  "CONTENT",
  "TRIGGERS",
  "TRIGGER_CONTEXT",
  "TRIGGER_COUNT",
  "GUILD_ID",
  "GUILD_NAME",
  "CHANNEL_ID",
  "CHANNEL_NAME",
  "USER_ID",
  "USER_NAME",
  "USER_TAG"
];

const guide = `
{CONTENT}         - The message content
{TRIGGERS}        - A comma separated list of triggers found in the message
{TRIGGER_CONTEXT} - All triggers with the preceding and proceeding 5 words, delimited by three periods
{TRIGGER_COUNT}   - Amount of triggers found in the message
{GUILD_ID}        - The id of the server the message came from, or the id of the author if it was a private message
{GUILD_NAME}      - The name of the server the message came from, or the name of the author if it was a private message
{CHANNEL_ID}      - The id of the channel the message came from
{CHANNEL_NAME}    - The name of the channel the message came from
{USER_ID}         - The id of the message author
{USER_NAME}       - The name of the message author
{USER_TAG}        - The full tag of the message author
`;

module.exports = ({ getSetting, updateSetting }) => {
  const [triggers, setTriggers] = useState(getSetting("triggers", []));
  const [hideServersOpened, setHideServersOpened] = useState(false);
  const [ignoresOpened, setIgnoresOpened] = useState(false);
  const [formatOpened, setFormatOpened] = useState(false);
  const [triggersOpened, setTriggersOpened] = useState(false);
  const [guildSearch, setGuildSearch] = useState("");
  const [toastTimeout, setToastTimeout] = useState(getSetting("toastTimeout", TOAST_TIMEOUT));

  useEffect(() => {
    updateSetting("triggers", triggers);
  }, [triggers]);

  function removeTrigger(idx) {
    const newTriggers = triggers.slice();
    newTriggers.splice(idx, 1);
    setTriggers(newTriggers);
  }

  function addTrigger(str) {
    setTriggers([...triggers, str]);
  }

  function setTrigger(i, str) {
    const newTriggers = triggers.slice();
    newTriggers[i] = str;
    setTriggers(newTriggers);
  }

  function onGuildToggle({ id }) {
    const mutedGuilds = getSetting("mutedGuilds", []);

    if (!mutedGuilds.includes(id)) {
      updateSetting("mutedGuilds", [...mutedGuilds, id]);
    } else {
      updateSetting(
        "mutedGuilds",
        mutedGuilds.filter(g => g !== id)
      );
    }
  }

  function isFormatValid(format) {
    const re = /\{(\w*)\}/g;
    let match;
    while ((match = re.exec(format))) {
      if (!placeHolders.includes(match[1])) return false;
    }
    return true;
  }

  const triggerType = getSetting("triggerType", "plain");
  return (
    <div>
      <Category name="Triggers" description="Here you can manage your triggers" opened={triggersOpened} onChange={() => setTriggersOpened(!triggersOpened)}>
        <RadioGroup
          onChange={e => updateSetting("triggerType", e.value)}
          value={triggerType}
          options={[
            {
              name: "Normal",
              desc: "Normal triggers",
              value: "plain"
            },
            {
              name: "Regex",
              desc: "Full regex support. Only select this if you know what you're doing",
              value: "regex"
            }
          ]}
        >
          Trigger type
        </RadioGroup>
        {triggers.map((t, i) => (
          <Trigger key={t} value={t} pos={i} setTrigger={setTrigger} removeTrigger={removeTrigger} triggers={triggers} triggerType={triggerType} />
        ))}

        <Trigger pos={-1} value="" addTrigger={addTrigger} triggers={triggers} triggerType={triggerType} />
      </Category>

      <Category
        name="Notification Format"
        description="Here you can customise the notification that is shown if a trigger is detected"
        opened={formatOpened}
        onChange={() => setFormatOpened(!formatOpened)}
      >
        <RadioGroup
          onChange={e => updateSetting("notificationType", e.value)}
          value={getSetting("notificationType", "toasts")}
          options={[
            {
              name: "Toasts",
              desc: "Notifications are sent via Powercord Toasts",
              value: "toasts"
            },
            {
              name: "Desktop Notifications",
              desc: "Notifications are sent via Desktop Notifications",
              value: "notifications"
            }
          ]}
        >
          Notification type
        </RadioGroup>

        {getSetting("notificationType", "toasts") === "toasts" && (
          <TextInput
            value={toastTimeout.toString()}
            onChange={setToastTimeout}
            onBlur={() => {
              const n = parseInt(toastTimeout, 10);
              if (!isNaN(n) && (n === -1 || n > 0)) updateSetting("toastTimeout", n);
              else setToastTimeout(TOAST_TIMEOUT);
            }}
            style={isNaN(toastTimeout) || toastTimeout < -1 ? { borderColor: "#e53935" } : {}}
          >
            The toast timeout, in seconds. Set to -1 for permament toasts
          </TextInput>
        )}

        <TextInput
          value={getSetting("headerFormat", HEADER_FORMAT)}
          onChange={v => updateSetting("headerFormat", v)}
          onBlur={() =>
            updateSetting(
              "headerFormat",
              getSetting("headerFormat", HEADER_FORMAT).replace(/\{\w+\}/g, m => m.toUpperCase())
            )
          }
          style={isFormatValid(getSetting("headerFormat", HEADER_FORMAT)) ? {} : { borderColor: "#e53935" }}
        >
          The notification header format
        </TextInput>
        <TextInput
          value={getSetting("bodyFormat", BODY_FORMAT)}
          onChange={v => updateSetting("bodyFormat", v)}
          onBlur={() =>
            updateSetting(
              "headerFormat",
              getSetting("headerFormat", HEADER_FORMAT).replace(/\{\w+\}/g, m => m.toUpperCase())
            )
          }
          style={isFormatValid(getSetting("bodyFormat", BODY_FORMAT)) ? {} : { borderColor: "#e53935" }}
        >
          The notification body format
        </TextInput>

        <p className="venTriggersFormatGuideTitle">The following variables can be used in the above two formats and will be replaced accordingly:</p>
        <p className="venTriggersFormatGuide">
          {guide.split("\n").map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </p>
      </Category>

      <Category
        name="Overrides and Ignores"
        description="Specify overrides and ignores"
        opened={ignoresOpened}
        onChange={() => setIgnoresOpened(!ignoresOpened)}
      >
        <SwitchItem note="Whether own messages should be ignored" value={getSetting("ignoreSelf", true)} onChange={v => updateSetting("ignoreSelf", v)}>
          Ignore self. Highly recommended
        </SwitchItem>

        <SwitchItem value={getSetting("ignoreBots", true)} onChange={v => updateSetting("ignoreBots", v)}>
          Ignore bots. Highly recommended
        </SwitchItem>

        <SwitchItem note="Whether blocked users should be ignored" value={getSetting("ignoreBlocked", true)} onChange={v => updateSetting("ignoreBlocked", v)}>
          Ignore blocked users
        </SwitchItem>

        <SwitchItem value={getSetting("ignoreMentions", true)} onChange={v => updateSetting("ignoreMentions", v)}>
          Ignore messages that you would already get notified for (Mentions/DMs)
        </SwitchItem>

        <SwitchItem value={getSetting("ignoreLurking", true)} onChange={v => updateSetting("ignoreLurking", v)}>
          Ignore currently selected channel
        </SwitchItem>

        <SwitchItem
          note="Whether all muted servers and channels should be ignored"
          value={getSetting("ignoreMuted", true)}
          onChange={v => updateSetting("ignoreMuted", v)}
        >
          Ignore all muted servers and channels
        </SwitchItem>

        <SwitchItem
          note="Whether friends should always alert you regardless of your other overrides"
          value={getSetting("whitelistFriends", true)}
          onChange={v => updateSetting("whitelistFriends", v)}
        >
          Whitelist all friends
        </SwitchItem>
      </Category>

      <Category
        name="Ignore specific Servers"
        description="Ignore messages from specific servers. They won't alert you any more"
        opened={hideServersOpened}
        onChange={() => setHideServersOpened(!hideServersOpened)}
      >
        <TextInput value={guildSearch} placeholder="What are you looking for?" onChange={setGuildSearch}></TextInput>

        {hideServersOpened &&
          getFlattenedGuilds()
            .filter(g => g.id === guildSearch || g.name.toLowerCase().includes(guildSearch.toLowerCase()))
            .map(g => (
              <SwitchItem key={g.id} value={getSetting("mutedGuilds", []).includes(g.id)} onChange={() => onGuildToggle(g)}>
                Mute messages from {g.name}
              </SwitchItem>
            ))}
      </Category>
    </div>
  );
};
