/**
 * Server-side validation middleware
 * Validates request body against provided schema rules
 */

export const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      if (rules.required && (value === undefined || value === null || value === "")) {
        errors.push({ field, message: `${field} is required` });
        continue;
      }

      if (value === undefined || value === null || value === "") continue;

      if (rules.type === "string" && typeof value !== "string") {
        errors.push({ field, message: `${field} must be a string` });
        continue;
      }

      if (rules.type === "number" && (typeof value !== "number" || isNaN(value))) {
        errors.push({ field, message: `${field} must be a number` });
        continue;
      }

      if (rules.type === "array" && !Array.isArray(value)) {
        errors.push({ field, message: `${field} must be an array` });
        continue;
      }

      if (rules.minLength && typeof value === "string" && value.length < rules.minLength) {
        errors.push({ field, message: `${field} must be at least ${rules.minLength} characters` });
      }

      if (rules.maxLength && typeof value === "string" && value.length > rules.maxLength) {
        errors.push({ field, message: `${field} must be at most ${rules.maxLength} characters` });
      }

      if (rules.min && typeof value === "number" && value < rules.min) {
        errors.push({ field, message: `${field} must be at least ${rules.min}` });
      }

      if (rules.email && typeof value === "string") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push({ field, message: `${field} must be a valid email address` });
        }
      }

      if (rules.enum && !rules.enum.includes(value)) {
        errors.push({ field, message: `${field} must be one of: ${rules.enum.join(", ")}` });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors,
        success: false,
      });
    }

    next();
  };
};

// Validation schemas
export const signupValidation = {
  name: { required: true, type: "string", minLength: 2, maxLength: 50 },
  username: { required: true, type: "string", minLength: 3, maxLength: 30 },
  email: { required: true, type: "string", email: true },
  password: { required: true, type: "string", minLength: 6, maxLength: 100 },
};

export const loginValidation = {
  identifier: { required: true, type: "string", minLength: 3 },
  password: { required: true, type: "string", minLength: 6 },
};

export const createGroupValidation = {
  name: { required: true, type: "string", minLength: 1, maxLength: 100 },
};

export const createExpenseValidation = {
  description: { required: true, type: "string", minLength: 1, maxLength: 200 },
  amount: { required: true, type: "number", min: 0.01 },
  groupId: { required: true, type: "string" },
  splitType: { required: true, type: "string", enum: ["equal", "percentage", "exact", "you_owe", "they_owe"] },
};

export const settleUpValidation = {
  groupId: { required: true, type: "string" },
  paidTo: { required: true, type: "string" },
  amount: { required: true, type: "number", min: 0.01 },
};
