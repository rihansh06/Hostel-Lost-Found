const postService = require('../services/postService');

const createPost = async (req, res, next) => {
  try {
    const post = await postService.createPost(req.body, req.files, req.user);
    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

const getPosts = async (req, res, next) => {
  try {
    const result = await postService.getPosts(req.query, req.user);
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const getPostById = async (req, res, next) => {
  try {
    const post = await postService.getPostById(req.params.id, req.user);
    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

const markReturned = async (req, res, next) => {
  try {
    const post = await postService.markReturned(req.params.id, req.user);
    res.status(200).json({
      success: true,
      message: 'Post marked as returned',
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const result = await postService.deletePost(req.params.id, req.user);
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const getSpots = async (req, res, next) => {
  try {
    const spots = await postService.getSpots(req.user.hostel);
    res.status(200).json({
      success: true,
      data: spots,
    });
  } catch (error) {
    next(error);
  }
};

const getPostMatches = async (req, res, next) => {
  try {
    const matches = await postService.getPostMatches(req.params.id, req.user);
    res.status(200).json({
      success: true,
      data: matches,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getPosts,
  getPostById,
  markReturned,
  deletePost,
  getSpots,
  getPostMatches,
};
