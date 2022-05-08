// const ClientError = require('../../exceptions/ClientError');

/* eslint-disable no-underscore-dangle */
class AlbumsHandler {
  constructor(service, storageService, validator) {
    this._service = service;
    this._storageService = storageService;
    this._validator = validator;

    this.postAlbumHandler = this.postAlbumHandler.bind(this);
    this.getAlbumByIdHandler = this.getAlbumByIdHandler.bind(this);
    this.putAlbumByIdHandler = this.putAlbumByIdHandler.bind(this);
    this.deleteAlbumByIdHandler = this.deleteAlbumByIdHandler.bind(this);
    this.postUploadAlbumCoverHandler = this.postUploadAlbumCoverHandler.bind(this);
    this.postAlbumLikesHandler = this.postAlbumLikesHandler.bind(this);
    this.getAlbumLikesHandler = this.getAlbumLikesHandler.bind(this);
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { name, year } = request.payload;

    const albumId = await this._service.addAlbum({ name, year });

    const response = h.response({
      status: 'success',
      message: 'Album succesfully added!',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request) {
    const { id } = request.params;
    const album = await this._service.getAlbumById(id);
    const songs = await this._service.getSongsByAlbumId(id);
    const albumInDetail = { ...album, songs };
    return {
      status: 'success',
      data: {
        album: albumInDetail,
      },
    };
  }

  async putAlbumByIdHandler(request) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;

    await this._service.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album succesfully updated!',
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;
    await this._service.deleteAlbumById(id);
    return {
      status: 'success',
      message: 'Album successfully deleted!',
    };
  }

  async postUploadAlbumCoverHandler(request, h) {
    const { cover } = request.payload;
    const { id } = request.params;
    this._validator.validateImageHeaders(cover.hapi.headers);

    const filename = await this._storageService.writeFile(cover, cover.hapi);
    const coverUrl = `http://${process.env.HOST}:${process.env.PORT}/upload/images/${filename}`;

    await this._service.addCoverAlbum(id, coverUrl);
    const response = h.response({
      status: 'success',
      message: 'Cover uploaded!',
    });
    response.code(201);
    return response;
  }

  async postAlbumLikesHandler(request, h) {
    const { id: credentialId } = request.auth.credentials;
    const { id } = request.params;

    const message = await this._service.addAlbumLikes(id, credentialId);

    const response = h.response({
      status: 'success',
      message,
    });
    response.code(201);
    return response;
  }

  async getAlbumLikesHandler(request, h) {
    const { id } = request.params;

    const { likes, isCache } = await this._service.getAlbumLikes(id);

    return h
      .response({
        status: 'success',
        data: {
          likes,
        },
      })
      .header('X-Data-Source', isCache ? 'cache' : 'db');
  }
}

module.exports = AlbumsHandler;
