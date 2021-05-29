/* WordNotifications, a Powercord plugin that notifies you when someone says specific words
 * Copyright (C) 2021 Vendicated
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
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
