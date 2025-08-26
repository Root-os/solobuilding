const express = require("express");
const router = express.Router();
const userController = require("../controllers/authController");
const { adminAuth,verifyToken, tenantAuth, employeeAuth,adminOrEmployeeAuth } = require("../middleware/auth");

// Authentication & User Management
router.post("/register", userController.registerUser);
router.post("/register/employee", adminAuth,userController.registerUserEmployee);

router.post("/login", userController.login);
router.post("/logout",adminOrEmployeeAuth, userController.logout);

// User Profile
router.get("/me", adminOrEmployeeAuth, userController.myProfile);
router.put("/update",adminOrEmployeeAuth, userController.updateUser);
router.put("/change-password",adminOrEmployeeAuth, userController.changePassword);

// Password Reset
router.post("/forgot-password", userController.forgotPassword);
router.post("/reset-password/:resetToken", userController.resetPassword);

// User Management (Admin Only)
router.get("/users",adminAuth, userController.getAllUsers);
router.get("/employee",adminOrEmployeeAuth,userController.getAllEmployeeUsers)
router.get("/user/:id",adminAuth, userController.getUserById);
router.delete("/delete/:id",adminAuth, userController.deleteUser);
router.delete("/delete-my-account",adminOrEmployeeAuth, userController.deleteMyAccount);
router.put("/update-employee/:id", adminAuth, userController.updateEmployee);
// Session Verification
router.get("/verify-session",adminOrEmployeeAuth, userController.verifySession);

// Permissions
router.get('/permissions', verifyToken, userController.getPermissions);
router.get('/permissions/:id', verifyToken, userController.getUsersPermissions);


module.exports = router;
