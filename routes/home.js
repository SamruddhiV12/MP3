

const Task = require('../models/task');
const User = require('../models/user');

module.exports = function (router) {


    // Building query parameters

    const buildQuery = (queryParams) => {
        const { where, sort, select, skip, limit, count } = queryParams;

        let query = {};
        let sortObj = {};
        let selectObj = {};
        let skipNum = 0;
        let limitNum = 100; // Default limit for tasks
        let isCount = false;

        if (where) try { query = JSON.parse(where); } catch { throw new Error('Invalid where parameter'); }
        if (sort) try { sortObj = JSON.parse(sort); } catch { throw new Error('Invalid sort parameter'); }
        if (select) try { selectObj = JSON.parse(select); } catch { throw new Error('Invalid select parameter'); }
        if (skip) { skipNum = parseInt(skip); if (isNaN(skipNum)) throw new Error('Invalid skip parameter'); }
        if (limit) { limitNum = parseInt(limit); if (isNaN(limitNum)) throw new Error('Invalid limit parameter'); }
        if (count) isCount = count === 'true';

        return { query, sortObj, selectObj, skipNum, limitNum, isCount };
    };

    // USERS ENDPOINTS

    const usersRoute = router.route('/users');

    // GET /api/users
    usersRoute.get(async (req, res) => {
        try {
            const { query, sortObj, selectObj, skipNum, limitNum, isCount } = buildQuery(req.query);
            if (isCount) {
                const count = await User.countDocuments(query);
                return res.status(200).json({ message: 'OK', data: count });
            }

            let dbQuery = User.find(query);
            if (Object.keys(sortObj).length > 0) dbQuery = dbQuery.sort(sortObj);
            if (Object.keys(selectObj).length > 0) dbQuery = dbQuery.select(selectObj);
            if (skipNum > 0) dbQuery = dbQuery.skip(skipNum);
            if (limitNum > 0) dbQuery = dbQuery.limit(limitNum);

            const users = await dbQuery.exec();
            res.status(200).json({ message: 'OK', data: users });
        } catch (err) {
            res.status(500).json({ message: 'Error retrieving users', data: {} });
        }
    });

    // POST /api/users
    usersRoute.post(async (req, res) => {
        try {
            const { name, email, pendingTasks } = req.body;
            if (!name || !email)
                return res.status(400).json({ message: 'Name and email are required', data: {} });

            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser)
                return res.status(400).json({ message: 'User with this email already exists', data: {} });

            const user = new User({
                name,
                email,
                pendingTasks: pendingTasks || [],
                dateCreated: new Date()
            });
            await user.save();
            res.status(201).json({ message: 'User created successfully', data: user });
        } catch (err) {
            res.status(500).json({ message: 'Error creating user', data: {} });
        }
    });


    // USERS BY ID ROUTES (/api/users/:id)

    const userRoute = router.route('/users/:id');

    // GET /api/users/:id
    userRoute.get(async (req, res) => {
        try {
            const { id } = req.params;
            let selectObj = {};
            if (req.query.select) {
                try { selectObj = JSON.parse(req.query.select); }
                catch { return res.status(400).json({ message: 'Invalid select parameter', data: {} }); }
            }

            let query = User.findById(id);
            if (Object.keys(selectObj).length > 0) query = query.select(selectObj);
            const user = await query.exec();

            if (!user) return res.status(404).json({ message: 'User not found', data: {} });
            res.status(200).json({ message: 'OK', data: user });
        } catch {
            res.status(500).json({ message: 'Error retrieving user', data: {} });
        }
    });

    // PUT /api/users/:id
    userRoute.put(async (req, res) => {
        try {
            const { id } = req.params;
            const { name, email, pendingTasks } = req.body;

            if (!name || !email)
                return res.status(400).json({ message: 'Name and email are required', data: {} });

            const existingUser = await User.findById(id);
            if (!existingUser) return res.status(404).json({ message: 'User not found', data: {} });

            // Check if another user has same email
            const duplicate = await User.findOne({ email: email.toLowerCase(), _id: { $ne: id } });
            if (duplicate)
                return res.status(400).json({ message: 'User with this email already exists', data: {} });

            const oldTasks = existingUser.pendingTasks;
            const newTasks = pendingTasks || [];

            existingUser.name = name;
            existingUser.email = email.toLowerCase();
            existingUser.pendingTasks = newTasks;
            await existingUser.save();

            // Handle two-way reference updates
            const removed = oldTasks.filter(tid => !newTasks.includes(tid));
            const added = newTasks.filter(tid => !oldTasks.includes(tid));

            for (const tid of removed)
                await Task.findByIdAndUpdate(tid, { assignedUser: '', assignedUserName: 'unassigned' });

            for (const tid of added)
                await Task.findByIdAndUpdate(tid, { assignedUser: id, assignedUserName: name });

            res.status(200).json({ message: 'User updated successfully', data: existingUser });
        } catch (err) {
            res.status(500).json({ message: 'Error updating user', data: {} });
        }
    });

    // DELETE /api/users/:id
    userRoute.delete(async (req, res) => {
        try {
            const { id } = req.params;
            const user = await User.findById(id);
            if (!user) return res.status(404).json({ message: 'User not found', data: {} });

            // Unassign all user's tasks
            await Task.updateMany({ assignedUser: id }, { assignedUser: '', assignedUserName: 'unassigned' });
            await User.findByIdAndDelete(id);

            res.status(200).json({ message: 'User deleted successfully', data: user });
        } catch {
            res.status(500).json({ message: 'Error deleting user', data: {} });
        }
    });


    // TASKS ENDPOINTS

    const tasksRoute = router.route('/tasks');

    // GET /api/tasks
    tasksRoute.get(async (req, res) => {
        try {
            const { query, sortObj, selectObj, skipNum, limitNum, isCount } = buildQuery(req.query);
            if (isCount) {
                const count = await Task.countDocuments(query);
                return res.status(200).json({ message: 'OK', data: count });
            }

            let dbQuery = Task.find(query);
            if (Object.keys(sortObj).length > 0) dbQuery = dbQuery.sort(sortObj);
            if (Object.keys(selectObj).length > 0) dbQuery = dbQuery.select(selectObj);
            if (skipNum > 0) dbQuery = dbQuery.skip(skipNum);
            if (limitNum > 0) dbQuery = dbQuery.limit(limitNum);

            const tasks = await dbQuery.exec();
            res.status(200).json({ message: 'OK', data: tasks });
        } catch (err) {
            res.status(500).json({ message: 'Error retrieving tasks', data: {} });
        }
    });

    // POST /api/tasks
    tasksRoute.post(async (req, res) => {
        try {
            const { name, description, deadline, completed, assignedUser, assignedUserName } = req.body;
            if (!name || !deadline)
                return res.status(400).json({ message: 'Task name and deadline are required', data: {} });

            const task = new Task({
                name,
                description: description || '',
                deadline,
                completed: completed || false,
                assignedUser: assignedUser || '',
                assignedUserName: assignedUserName || 'unassigned',
                dateCreated: new Date()
            });

            await task.save();

            if (assignedUser && assignedUser !== '') {
                const user = await User.findById(assignedUser);
                if (user && !user.pendingTasks.includes(task._id.toString())) {
                    user.pendingTasks.push(task._id.toString());
                    await user.save();
                }
            }

            res.status(201).json({ message: 'Task created successfully', data: task });
        } catch {
            res.status(500).json({ message: 'Error creating task', data: {} });
        }
    });


    // TASKS BY ID ROUTES (/api/tasks/:id)

    const taskRoute = router.route('/tasks/:id');

    // GET /api/tasks/:id
    taskRoute.get(async (req, res) => {
        try {
            const { id } = req.params;
            let selectObj = {};
            if (req.query.select) {
                try { selectObj = JSON.parse(req.query.select); }
                catch { return res.status(400).json({ message: 'Invalid select parameter', data: {} }); }
            }

            let query = Task.findById(id);
            if (Object.keys(selectObj).length > 0) query = query.select(selectObj);
            const task = await query.exec();

            if (!task) return res.status(404).json({ message: 'Task not found', data: {} });
            res.status(200).json({ message: 'OK', data: task });
        } catch {
            res.status(500).json({ message: 'Error retrieving task', data: {} });
        }
    });

    // PUT /api/tasks/:id
    taskRoute.put(async (req, res) => {
        try {
            const { id } = req.params;
            const { name, description, deadline, completed, assignedUser, assignedUserName } = req.body;

            if (!name || !deadline)
                return res.status(400).json({ message: 'Task name and deadline are required', data: {} });

            const existingTask = await Task.findById(id);
            if (!existingTask) return res.status(404).json({ message: 'Task not found', data: {} });

            const oldUserId = existingTask.assignedUser;
            const newUserId = assignedUser || '';

            existingTask.name = name;
            existingTask.description = description || '';
            existingTask.deadline = deadline;
            existingTask.completed = completed || false;
            existingTask.assignedUser = newUserId;
            existingTask.assignedUserName = assignedUserName || 'unassigned';
            await existingTask.save();

            // Remove from old user
            if (oldUserId && oldUserId !== '' && oldUserId !== newUserId) {
                const oldUser = await User.findById(oldUserId);
                if (oldUser) {
                    oldUser.pendingTasks = oldUser.pendingTasks.filter(tid => tid !== id);
                    await oldUser.save();
                }
            }

            // Add to new user
            if (newUserId && newUserId !== '' && oldUserId !== newUserId) {
                const newUser = await User.findById(newUserId);
                if (newUser && !newUser.pendingTasks.includes(id)) {
                    newUser.pendingTasks.push(id);
                    await newUser.save();
                }
            }

            res.status(200).json({ message: 'Task updated successfully', data: existingTask });
        } catch {
            res.status(500).json({ message: 'Error updating task', data: {} });
        }
    });

    // DELETE /api/tasks/:id
    taskRoute.delete(async (req, res) => {
        try {
            const { id } = req.params;
            const task = await Task.findById(id);
            if (!task) return res.status(404).json({ message: 'Task not found', data: {} });

            if (task.assignedUser && task.assignedUser !== '') {
                const user = await User.findById(task.assignedUser);
                if (user) {
                    user.pendingTasks = user.pendingTasks.filter(tid => tid !== id);
                    await user.save();
                }
            }

            await Task.findByIdAndDelete(id);
            res.status(200).json({ message: 'Task deleted successfully', data: task });
        } catch {
            res.status(500).json({ message: 'Error deleting task', data: {} });
        }
    });

    return router;
};
