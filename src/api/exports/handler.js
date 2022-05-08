class ExportHandler {
  constructor(producerService, playlistsService, validator) {
    this._producerService = producerService;
    this._playlistsService = playlistsService;
    this._validator = validator;

    this.postExportPlaylistsHandler = this.postExportPlaylistsHandler.bind(this);
  }

  async postExportPlaylistsHandler(request, h) {
    this._validator.validateExportPlaylistsPayload(request.payload);
    const { id: credentialId } = request.auth.credentials;
    const { playlistId } = request.params;

    await this._playlistsService.verifyAccessPlaylist(playlistId, credentialId);
    // await this._playlistsService.getPlaylistById(playlistId);

    const message = {
      credentialId,
      playlistId,
      targetEmail: request.payload.targetEmail,
    };

    await this._producerService.sendMessage(
      process.env.PLAYLIST_CHANNEL_NAME,
      JSON.stringify(message),
    );

    const response = h.response({
      status: 'success',
      message: 'Permintaan Anda sedang kami proses',
    });
    response.code(201);
    return response;
  }
}

module.exports = ExportHandler;
