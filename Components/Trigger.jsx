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
const { isTriggerValid, existsTriggerAlready } = require("../util");

module.exports = ({ removeTrigger, addTrigger, setTrigger, triggers, triggerType, value: originalValue, pos }) => {
  const [value, setValue] = React.useState(originalValue);

  function add() {
    if (value && isValid()) {
      addTrigger(value);
      setValue("");
    }
  }

  function isValid() {
    return isTriggerValid(value, pos, triggerType, triggers);
  }

  function onBlur() {
    if (pos !== -1 && value && isValid()) setTrigger(pos, value);
  }

  return (
    <Card className="venTriggersSection">
      <TextInput
        className="venTriggersInput"
        onChange={v => setValue(v.toLowerCase())}
        onBlur={onBlur}
        value={value}
        style={isValid() ? {} : { borderColor: "#e53935" }}
      />

      {pos === -1 ? (
        <Button
          className="venTriggersButton"
          size={Button.Sizes.SMALL}
          onClick={add}
          color={isValid() ? (value ? Button.Colors.GREEN : Button.Colors.BRAND) : Button.Colors.GREY}
        >
          {isValid()
            ? value
              ? "Save"
              : "Add New"
            : existsTriggerAlready(value, pos, triggers)
            ? "Already exists"
            : triggerType === "regex"
            ? "Invalid regex"
            : "Invalid trigger"}
        </Button>
      ) : (
        <Button className="venTriggersButton" size={Button.Sizes.SMALL} onClick={() => removeTrigger(pos)} color={Button.Colors.RED}>
          Remove
        </Button>
      )}
    </Card>
  );
};
