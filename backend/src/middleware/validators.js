import { body, param, validationResult } from "express-validator";


export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
};


export const validateRegisterBatch = [
  body("farmerName")
    .trim()
    .notEmpty().withMessage("Farmer name is required")
    .isLength({ max: 100 }).withMessage("Farmer name must be under 100 characters")
    .escape(),
  body("cropType")
    .trim()
    .notEmpty().withMessage("Crop type is required")
    .isLength({ max: 100 }).withMessage("Crop type must be under 100 characters")
    .escape(),
  body("quantity")
    .notEmpty().withMessage("Quantity is required")
    .isFloat({ min: 0.01 }).withMessage("Quantity must be a positive number"),
  body("location")
    .trim()
    .notEmpty().withMessage("Location is required")
    .isLength({ max: 200 }).withMessage("Location must be under 200 characters")
    .escape(),
  validate,
];

export const validateTokenizeBatch = [
  body("batchId")
    .optional()
    .trim()
    .isUUID().withMessage("Batch ID must be a valid UUID"),
  body("hcsTransactionIds")
    .optional()
    .isArray().withMessage("hcsTransactionIds must be an array"),
  validate,
];


export const validateVerifyBatch = [
  param("tokenId")
    .trim()
    .notEmpty().withMessage("Token ID is required")
    .matches(/^0\.0\.\d+$/).withMessage("Token ID must be a valid Hedera token ID (e.g. 0.0.12345)"),
  param("serialNumber")
    .notEmpty().withMessage("Serial number is required")
    .isInt({ min: 1 }).withMessage("Serial number must be a positive integer"),
  validate,
];

export const validateAIRequest = [
  body("prompt")
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage("Prompt must be under 2000 characters")
    .escape(),
  body("batchId")
    .optional()
    .trim()
    .isUUID().withMessage("Batch ID must be a valid UUID"),
  validate,
];
