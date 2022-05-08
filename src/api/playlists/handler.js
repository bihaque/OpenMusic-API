class PlaylistsHandler {
  constructor(playlistsService, songsService, validator) {
    this._playlistsService = playlistsService;
    this._songsService = songsService;
    this._validator = validator;

    this.postPlaylistHandler = this.postPlaylistHandler.bind(this);
    this.getPlaylistsHandler = this.getPlaylistsHandler.bind(this);
    this.deletePlaylistByIdHandler = this.deletePlaylistByIdHandler.bind(this);
    this.postSongToPlaylistByIdHandler = this.postSongToPlaylistByIdHandler.bind(this);
    this.getSongsInPlaylistByIdHandler = this.getSongsInPlaylistByIdHandler.bind(this);
    this.deleteSongFromPlaylistByIdHandler = this.deleteSongFromPlaylistByIdHandler.bind(this);
    this.getPlaylistActivitiesHandler = this.getPlaylistActivitiesHandler.bind(this);
  }

  async postPlaylistHandler(request, h) {
    this._validator.validatePostPlaylistPayload(request.payload);

    const { name } = request.payload;
    const { id: credentialId } = request.auth.credentials;
    const playlistId = await this._playlistsService.addPlaylist({ name, credentialId });

    return h.response({
      status: 'success',
      data: {
        playlistId,
      },
    }).code(201);
  }

  async getPlaylistsHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const playlists = await this._playlistsService.getPlaylists(credentialId);

    return {
      status: 'success',
      data: {
        playlists,
      },
    };
  }

  async deletePlaylistByIdHandler(request) {
    const { id: playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._playlistsService.verifyPlaylistOwner(playlistId, credentialId);
    await this._playlistsService.deletePlaylistById(playlistId);

    return {
      status: 'success',
      message: 'Playlist deleted!',
    };
  }

  async postSongToPlaylistByIdHandler(request, h) {
    const { id: playlistId } = request.params;
    const { songId } = request.payload;

    this._validator.validatePostSongToPlaylistPayload({ playlistId, songId });
    const { id: credentialId } = request.auth.credentials;

    await this._playlistsService.verifyAccessPlaylist(playlistId, credentialId);
    await this._songsService.getSongById(songId);

    await this._playlistsService.addSongToPlaylistById(playlistId, songId);
    await this._playlistsService.addPlaylistActivity(
      playlistId,
      songId,
      credentialId,
      'add',
    );

    return h.response({
      status: 'success',
      message: 'Song added to playlist!.',
    }).code(201);
  }

  async getSongsInPlaylistByIdHandler(request) {
    const { id: playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._playlistsService.verifyAccessPlaylist(playlistId, credentialId);
    const playlist = await this._playlistsService.getSongsInPlaylistById(playlistId);

    return {
      status: 'success',
      data: {
        playlist,
      },
    };
  }

  async deleteSongFromPlaylistByIdHandler(request) {
    const { id: playlistId } = request.params;
    const { songId } = request.payload;

    this._validator.validateDeleteSongFromPlaylistPayload({ playlistId, songId });
    const { id: credentialId } = request.auth.credentials;

    await this._playlistsService.verifyAccessPlaylist(playlistId, credentialId);
    await this._playlistsService.deleteSongFromPlaylistById(playlistId, songId);
    await this._playlistsService.addPlaylistActivity(
      playlistId,
      songId,
      credentialId,
      'delete',
    );

    return {
      status: 'success',
      message: 'Song succesfully removed from playlist!',
    };
  }

  async getPlaylistActivitiesHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._playlistsService.verifyAccessPlaylist(id, credentialId);
    const activities = await this._playlistsService.getPlaylistActivity(id);

    return {
      status: 'success',
      data: {
        playlistId: id,
        activities,
      },
    };
  }
}

module.exports = PlaylistsHandler;
