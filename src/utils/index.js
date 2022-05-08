/* eslint-disable camelcase */

const mapSongDB = ({ song_id, song_title, performer }) => ({
  id: song_id,
  title: song_title,
  performer,
});

const mapPlaylistDB = ({ id, name, username }) => ({
  id,
  name,
  username,
});

module.exports = { mapSongDB, mapPlaylistDB };
