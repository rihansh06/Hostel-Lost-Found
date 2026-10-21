const claimService = require('../services/claimService');

const submitClaim = async (req, res, next) => {
  try {
    const claim = await claimService.submitClaim(req.params.id, req.body.answers, req.user);
    res.status(201).json({
      success: true,
      message: 'Claim submitted successfully. Item is now claim_pending awaiting review.',
      data: claim,
    });
  } catch (error) {
    next(error);
  }
};

const reviewClaim = async (req, res, next) => {
  try {
    const { status, reviewNote } = req.body;
    const claim = await claimService.reviewClaim(req.params.id, status, reviewNote, req.user);
    res.status(200).json({
      success: true,
      message: `Claim ${status} successfully`,
      data: claim,
    });
  } catch (error) {
    next(error);
  }
};

const getMyClaims = async (req, res, next) => {
  try {
    const claims = await claimService.getMyClaims(req.user._id);
    res.status(200).json({
      success: true,
      data: claims,
    });
  } catch (error) {
    next(error);
  }
};

const getPostClaims = async (req, res, next) => {
  try {
    const data = await claimService.getPostClaims(req.params.id, req.user);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const resetUserStrikes = async (req, res, next) => {
  try {
    const result = await claimService.resetUserStrikes(req.user.hostel, req.params.id);
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitClaim,
  reviewClaim,
  getMyClaims,
  getPostClaims,
  resetUserStrikes,
};
