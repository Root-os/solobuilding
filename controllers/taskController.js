const { Task, User } = require('../models');

const createTask = async (req, res) => {
  try {
    const { name, description } = req.body;

    const existingTask = await Task.findOne({ where: { name } });
    if (existingTask) {
      return res.status(400).json({ message: 'Task already exists' });
    }

    const task = await Task.create({ name, description });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const assignTaskToUser= async (req, res) => {
  try {
    const { userId, taskId } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await user.addTask(task);
    res.json({ message: 'Task assigned to user' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getUserTasks = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: Task,
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.Tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createTask,
  assignTaskToUser,
  getUserTasks,
};