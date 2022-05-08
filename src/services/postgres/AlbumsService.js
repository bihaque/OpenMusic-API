const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = `album_${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO albums VALUES($1,$2,$3) RETURNING id',
      values: [id, name, year],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album failed to be added!');
    }

    return result.rows[0].id;
  }

  // coba lagi dengan kueri lain
  async getAlbumById(id) {
    const query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Album couldn\'t be found!');
    }

    return result.rows[0];
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $2, year = $3 WHERE id=$1 RETURNING id',
      values: [id, name, year],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Failed to update! Couldn\'t find id.');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Failed to delete! Couldn\'t find id');
    }
  }

  async getSongsByAlbumId(id) {
    const query = {
      text: 'SELECT id, title, performer FROM songs WHERE "albumId" = $1',
      values: [id],
    };
    const result = await this._pool.query(query);

    return result.rows;
  }

  async addCoverAlbum(id, cover) {
    const query = {
      text: 'UPDATE albums SET "coverUrl" = $1 WHERE id = $2 RETURNING id',
      values: [cover, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui cover. Id tidak ditemukan');
    }
  }

  async addAlbumLikes(albumId, userId) {
    const id = `like_${nanoid(16)}`;

    await this.getAlbumById(albumId);

    await this._cacheService.delete(`album_likes:${albumId}`);
    const isLiked = await this.verifyAlbumLikes(albumId, userId);

    if (isLiked) {
      const query = {
        text: 'DELETE FROM user_album_likes WHERE album_id = $1 AND user_id = $2 RETURNING id',
        values: [albumId, userId],
      };

      const result = await this._pool.query(query);

      if (!result.rowCount) {
        throw new InvariantError('Failed to unlike album!');
      }
      return 'Success to unlike album!';
    }

    const query = {
      text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
      values: [id, userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Failed to add like!');
    }
    return 'Success to add like!';
  }

  async verifyAlbumLikes(albumId, userId) {
    const query = {
      text: 'SELECT id FROM user_album_likes WHERE album_id = $1 AND user_id = $2',
      values: [albumId, userId],
    };
    const result = await this._pool.query(query);
    if (result.rowCount) return true;
    return false;
  }

  async getAlbumLikes(albumId) {
    try {
      const result = await this._cacheService.get(`album_likes:${albumId}`);
      return { likes: +result, isCache: true };
    } catch (error) {
      const query = {
        text: 'SELECT COUNT(*) FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };
      const result = await this._pool.query(query);
      const likes = +result.rows[0].count;

      await this._cacheService.set(`album_likes:${albumId}`, likes);

      return { likes, isCache: false };
    }
  }
}

module.exports = AlbumsService;
