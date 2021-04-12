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

const { SliderInput, TextInput, Category, SwitchItem } = require("powercord/components/settings");
const { React, getModule } = require("powercord/webpack");
const { TOAST_TIMEOUT, HEADER_FORMAT, BODY_FORMAT } = require("../constants");
const Trigger = require("./Trigger");

const { getFlattenedGuilds } = getModule(["getFlattenedGuilds"], false);

const guide = `
{CONTENT} 				- The message content
{TRIGGERS}  			- A comma separated list of triggers found in the message
{TRIGGER_CONTEXT} 		- All triggers with the preceding and proceeding 5 words, delimited by three periods
{TRIGGER_COUNT} 		- Amount of triggers found in the message
{GUILD_ID} 				- The id of the server the message came from, or the id of the author if it was a private message
{GUILD_NAME}			- The name of the server the message came from, or the name of the author if it was a private message
{CHANNEL_ID} 			- The id of the channel the message came from
{CHANNEL_NAME}			- The name of the channel the message came from
{USER_ID} 				- The id of the message author
{USER_NAME} 			- The name of the message author
{USER_TAG} 				- The full tag of the message author
`;

module.exports = class Settings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      triggers: this.props.getSetting("triggers", []),
      hideServersOpened: false,
      ignoresOpened: false,
      formatOpened: false,
      triggersOpened: false
    };
  }

  removeTrigger(idx) {
    this.setState(({ triggers }) => {
      triggers.splice(idx, 1);
      return { triggers };
    });
  }

  addTrigger(str) {
    this.setState(({ triggers }) => {
      triggers.push(str);
      return { triggers };
    });
  }

  setTrigger(i, str) {
    if (i === -1) return this.appendTrigger(str);

    this.setState(({ triggers }) => {
      triggers[i] = str;
      return { triggers };
    });
  }

  validateIds(str) {
    return /\d{17,19}[, ]*/.test(str);
  }

  onGuildToggle({ id }) {
    const mutedGuilds = this.props.getSetting("mutedGuilds", []);

    if (!mutedGuilds.includes(id)) {
      this.props.updateSetting("mutedGuilds", [...mutedGuilds, id]);
    } else {
      this.props.updateSetting(
        "mutedGuilds",
        mutedGuilds.filter(g => g !== id)
      );
    }
  }

  render() {
    const { getSetting, updateSetting } = this.props;
    return (
      <div>
        <Category
          name="Triggers"
          description="Here you can manage your triggers"
          opened={this.state.triggersOpened}
          onChange={() => this.setState(prev => ({ triggersOpened: !prev.triggersOpened }))}
        >
          {this.state.triggers.map((t, i) => (
            <Trigger
              key={t}
              value={t}
              pos={i}
              setTrigger={this.setTrigger.bind(this)}
              removeTrigger={this.removeTrigger.bind(this)}
              triggers={this.state.triggers}
            />
          ))}

          <Trigger pos={-1} value="" addTrigger={this.addTrigger.bind(this)} triggers={this.state.triggers} />
        </Category>

        <Category
          name="Toast Format"
          description="Here you can customise the toast that is shown if a trigger is detected"
          opened={this.state.formatOpened}
          onChange={() => this.setState(prev => ({ formatOpened: !prev.formatOpened }))}
        >
          <SliderInput
            stickToMarkers
            required
            className="venTriggersToastTimeout"
            minValue={1}
            maxValue={10}
            defaultValue={TOAST_TIMEOUT}
            initialValue={getSetting("toastTimeout", TOAST_TIMEOUT)}
            markers={[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 10]}
            onValueChange={v => updateSetting("toastTimeout", v)}
          >
            The toast timeout, in seconds
          </SliderInput>
          <TextInput value={getSetting("headerFormat", HEADER_FORMAT)} onChange={v => updateSetting("headerFormat", v)}>
            The toast header format
          </TextInput>
          <TextInput value={getSetting("bodyFormat", BODY_FORMAT)} onChange={v => updateSetting("bodyFormat", v)}>
            The toast body format
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
          opened={this.state.ignoresOpened}
          onChange={() => this.setState(prev => ({ ignoresOpened: !prev.ignoresOpened }))}
        >
          <SwitchItem
            note="Whether own messages should be ignored"
            value={this.props.getSetting("ignoreSelf", true)}
            onChange={v => this.props.updateSetting("ignoreSelf", v)}
          >
            Ignore self. Highly recommended
          </SwitchItem>
          <SwitchItem
            note="Whether all muted servers should be ignored"
            value={this.props.getSetting("ignoreMuted", true)}
            onChange={v => this.props.updateSetting("ignoreMuted", v)}
          >
            Ignore all muted servers
          </SwitchItem>

          <SwitchItem
            note="Whether all friends should always alert you regardless of your server mutes"
            value={this.props.getSetting("whitelistFriends", true)}
            onChange={v => this.props.updateSetting("whitelistFriends", v)}
          >
            Whitelist all friends
          </SwitchItem>
        </Category>

        {!this.props.getSetting("ignoreMuted", true) && (
          <Category
            name="Ignore specific Servers"
            description="Ignore messages from specific servers. They won't alert you any more"
            opened={this.state.hideServersOpened}
            onChange={() => this.setState(prev => ({ hideServersOpened: !prev.hideServersOpened }))}
          >
            {getFlattenedGuilds().map(g => (
              <SwitchItem key={g.id} value={this.props.getSetting("mutedGuilds", []).includes(g.id)} onChange={() => this.onGuildToggle(g)}>
                Mute messages from {g.name}
              </SwitchItem>
            ))}
          </Category>
        )}
      </div>
    );
  }
};
