const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class SongsService {
  constructor() {
    this._pool = new Pool();
  }

  async addSong({
    title, year, genre, performer, duration, albumId,
  }) {
    const id = `song_${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO songs VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id',
      values: [id, title, year, genre, performer, duration, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Failed to add song!');
    }

    return result.rows[0].id;
  }

  async getSongs(title, performer) {
    let result = await this._pool.query('SELECT id, title, performer FROM songs');

    if (title !== undefined) {
      result = await this._pool.query(`SELECT id, title, performer FROM songs WHERE LOWER(title) LIKE '%${title}%'`);
    }

    if (performer !== undefined) {
      result = await this._pool.query(`SELECT id, title, performer FROM songs WHERE LOWER(performer) LIKE '%${performer}%'`);
    }

    return result.rows;
  }

  async getSongById(id) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Song couldn\'t be found!');
    }

    return result.rows[0];
  }

  async editSongById(id, {
    title, year, genre, performer, duration, albumId,
  }) {
    const query = {
      text: 'UPDATE songs SET title = $2, year = $3, genre = $4, performer = $5, duration = $6, "albumId" = $7 WHERE id=$1 RETURNING id',
      values: [id, title, year, genre, performer, duration, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Failed to update! Couldn\'t find id.');
    }
  }

  async deleteSongById(id) {
    const query = {
      text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Failed to delete! Couldn\' find id.');
    }
  }
}

module.exports = SongsService;
