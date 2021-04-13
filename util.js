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
  getMessageLink
};
