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

const { Button, Card } = require("powercord/components");
const { TextInput } = require("powercord/components/settings");
const { React } = require("powercord/webpack");

module.exports = class Trigger extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.value,
      pos: this.props.pos
    };
  }

  remove() {
    this.props.removeTrigger(this.state.pos);
  }

  add() {
    if (this.state.value && this.isValid()) {
      this.props.addTrigger(this.state.value);
      this.setState({ value: "" });
    }
  }

  isValid() {
    return /^[A-Za-z0-9]*$/.test(this.state.value) && !this.existsAlready();
  }

  existsAlready() {
    const idx = this.props.triggers.indexOf(this.state.value);
    return idx !== -1 && (idx !== this.state.pos || this.props.triggers.lastIndexOf(this.state.value) !== this.state.pos);
  }

  onChange(value) {
    this.setState({ value: value.toLowerCase() });
  }

  onBlur() {
    if (this.state.pos !== -1 && this.state.value && this.isValid()) this.props.setTrigger(this.state.pos, this.state.value);
  }

  render() {
    return (
      <Card className="venTriggersSection">
        <TextInput
          className="venTriggersInput"
          onChange={this.onChange.bind(this)}
          onBlur={this.onBlur.bind(this)}
          value={this.state.value}
          note={this.state ? "" : "Add a new trigger"}
          style={this.isValid() ? {} : { borderColor: "#e53935" }}
        />

        {this.state.pos === -1 ? (
          <Button
            className="venTriggersButton"
            size={Button.Sizes.SMALL}
            onClick={this.add.bind(this)}
            color={this.isValid() ? (this.state.value ? Button.Colors.GREEN : Button.Colors.BRAND) : Button.Colors.GREY}
          >
            {this.isValid() ? (this.state.value ? "Save" : "Add New") : this.existsAlready() ? "Already exists" : "Invalid trigger"}
          </Button>
        ) : (
          <Button className="venTriggersButton" size={Button.Sizes.SMALL} onClick={this.remove.bind(this)} color={Button.Colors.RED}>
            Remove
          </Button>
        )}
      </Card>
    );
  }
};
