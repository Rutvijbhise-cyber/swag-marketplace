import { body, param, query, validationResult } from 'express-validator';

// Sanitize string input to prevent XSS
const sanitizeString = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
};

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

export const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .customSanitizer(sanitizeString)
    .withMessage('Name must be 2-100 characters'),
  handleValidationErrors
];

export const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

export const addressValidation = [
  body('address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .customSanitizer(sanitizeString)
    .withMessage('Address must be 5-200 characters'),
  body('city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .customSanitizer(sanitizeString)
    .withMessage('City must be 2-100 characters'),
  body('state')
    .trim()
    .isLength({ min: 2, max: 100 })
    .customSanitizer(sanitizeString)
    .withMessage('State must be 2-100 characters'),
  body('zipCode')
    .trim()
    .isLength({ min: 3, max: 20 })
    .customSanitizer(sanitizeString)
    .withMessage('ZIP code must be 3-20 characters'),
  body('country')
    .trim()
    .isLength({ min: 2, max: 100 })
    .customSanitizer(sanitizeString)
    .withMessage('Country must be 2-100 characters'),
  handleValidationErrors
];

export const cartItemValidation = [
  body('itemId')
    .isUUID()
    .withMessage('Valid item ID is required'),
  body('quantity')
    .isInt({ min: 1, max: 10 })
    .withMessage('Quantity must be between 1 and 10'),
  handleValidationErrors
];

export const uuidParamValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('category')
    .optional()
    .trim()
    .customSanitizer(sanitizeString),
  query('search')
    .optional()
    .trim()
    .customSanitizer(sanitizeString),
  handleValidationErrors
];

export const paymentValidation = [
  body('amount')
    .isFloat({ min: 5, max: 500 })
    .withMessage('Amount must be between $5 and $500'),
  handleValidationErrors
];
