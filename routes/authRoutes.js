const express = require("express");
const router = express.Router();
const userController = require("../controllers/authController");

// Authentication & User Management
router.post("/register", userController.registerUser);
router.post("/login", userController.login);
router.post("/logout", userController.logout);

// User Profile
router.get("/me", userController.myProfile);
router.put("/update/:id", userController.updateUser);
router.put("/change-password", userController.changePassword);

// Password Reset
router.post("/forgot-password", userController.forgotPassword);
router.post("/reset-password/:resetToken", userController.resetPassword);

// User Management (Admin Only)
router.get("/users", userController.getAllUsers);
router.get("/user/:id", userController.getUserById);
router.delete("/delete/:id", userController.deleteUser);

// Session Verification
router.get("/verify-session", userController.verifySession);

module.exports = router;
