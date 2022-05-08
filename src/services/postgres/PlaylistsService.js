const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const { mapPlaylistDB, mapSongDB } = require('../../utils');

const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistsService {
  constructor(collaborationService, cacheService) {
    this._pool = new Pool();
    this._collaborationService = collaborationService;
    this._cacheService = cacheService;
  }

  async addPlaylist({ name, credentialId: owner }) {
    const id = `playlist_${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlists VALUES ($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Failed to add playlist!');
    }

    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    const query = {
      text: `SELECT playlists.id, playlists.name, users.username FROM playlists
      LEFT JOIN users ON users.id = playlists.owner
      LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id
      WHERE playlists.owner = $1 OR collaborations.user_id = $1`,
      values: [owner],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Failed to delete playlist! Couldn\'t find id.');
    }
  }

  async addSongToPlaylistById(playlistId, songId) {
    const id = `playlistSong_${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Failed to add song into playlist!');
    }
    return result.rows[0].id;
  }

  async getPlaylistById(playlistId) {
    const query = {
      text: 'SELECT * FROM playlists WHERE playlistId = $1',
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Couldn\'t find playlist id!');
    }

    return result.rows[0];
  }

  // coba cek lagi dengan kueri lain
  async getSongsInPlaylistById(playlistId) {
    const query = {
      text: `SELECT playlists.*, users.username, songs.id as song_id, songs.title as song_title, songs.performer FROM playlists
      LEFT JOIN playlist_songs ON playlist_songs.playlist_id = playlists.id
      LEFT JOIN songs ON songs.id = playlist_songs.song_id
      LEFT JOIN users ON users.id = playlists.owner
      WHERE playlists.id = $1`,
      values: [playlistId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Invalid playlist id!');
    }
    const songs = result.rows.map(mapSongDB);

    const mappedResult = result.rows.map(mapPlaylistDB)[0];

    return { ...mappedResult, songs };
  }

  async deleteSongFromPlaylistById(playlistId, songId) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Failed to delete song! Couldn\'t find song id.');
    }
  }

  async addPlaylistActivity(playlistId, songId, userId, action) {
    const id = `activity_${nanoid(16)}`;
    const time = new Date().toISOString();

    const query = {
      text: 'INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [id, playlistId, songId, userId, action, time],
    };
    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Failed to save activity!');
    }

    return result.rows[0].id;
  }

  async getPlaylistActivity(playlistId) {
    try {
      const result = await this._cacheService.get(
        `playlist_activities:${playlistId}`,
      );
      return JSON.parse(result);
    } catch (error) {
      const query = {
        text: `SELECT users.username, songs.title, playlist_song_activities.action, playlist_song_activities.time FROM playlist_song_activities
        LEFT JOIN playlists ON playlist_song_activities.playlist_id = playlists.id
        LEFT JOIN songs ON playlist_song_activities.song_id = songs.id
        LEFT JOIN users ON playlist_song_activities.user_id = users.id
        WHERE playlists.id = $1`,
        values: [playlistId],
      };
      const result = await this._pool.query(query);

      if (!result.rowCount) {
        throw new NotFoundError('Playlist not found!');
      }

      await this._cacheService.set(
        `playlist_activities:${playlistId}`,
        JSON.stringify(result.rows),
      );

      return result.rows;
    }
  }

  async verifyPlaylistOwner(playlistId, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Invalid playlist id!');
    }

    const playlist = result.rows[0];

    if (playlist.owner !== owner) {
      throw new AuthorizationError('You have no permission to access this resource!');
    }
  }

  async verifyAccessPlaylist(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }
}

module.exports = PlaylistsService;
