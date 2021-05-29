/* This file is part of WordNotifications, a Powercord plugin that notifies you when someone says specific words
 * Copyright (C) 2021 Vendicated
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

function existsTriggerAlready(trigger, pos, triggers) {
  const idx = triggers.indexOf(trigger);
  return idx !== -1 && (idx !== pos || triggers.lastIndexOf(trigger) !== pos);
}

function isTriggerValid(trigger, pos, type, triggers) {
  if (existsTriggerAlready(trigger, pos, triggers)) return false;
  if (type === "plain") return true;

  try {
    if (new RegExp(`(^|[^A-Z0-9]+)${trigger}([^A-Z0-9]+|$)`, "gi").test("jisjkaskjkjsjkaskajksjajkoskjoasjkjkasjksjkaskjakjjks")) return false;
    return true;
  } catch {
    return false;
  }
}

function getAllIndexes(arr, val) {
  const indexes = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === val) indexes.push(i);
  }
  return indexes;
}

function range(start, end) {
  return Array.from(Array(end + 1).keys()).slice(start);
}

function uniqueSorted(arr) {
  return Array.from(new Set(arr)).sort((x, y) => x - y);
}

function getAvatarUrl(id, hash, discriminator) {
  const url = hash ? `avatars/${id}/${hash}.${hash.startsWith("_a") ? "gif" : "png"}` : `embed/avatars/${discriminator % 5}.png`;
  return `https://cdn.discordapp.com/${url}`;
}

function getMessageLink(guildId, channelId, messageId) {
  return `/channels/${guildId || "@me"}/${channelId}/${messageId}`;
}

module.exports = {
  getAllIndexes,
  range,
  uniqueSorted,
  getAvatarUrl,
  getMessageLink,
  isTriggerValid,
  existsTriggerAlready
};
