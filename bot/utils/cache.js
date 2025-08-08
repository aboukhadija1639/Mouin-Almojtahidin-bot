import NodeCache from 'node-cache';

// Configure cache instances for different types of data
const userCache = new NodeCache({
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 60, // Check for expired keys every minute
  useClones: false // Better performance, but be careful with object mutations
});

const courseCache = new NodeCache({
  stdTTL: 600, // 10 minutes for course data
  checkperiod: 120,
  useClones: false
});

const assignmentCache = new NodeCache({
  stdTTL: 300, // 5 minutes for assignments
  checkperiod: 60,
  useClones: false
});

const statsCache = new NodeCache({
  stdTTL: 900, // 15 minutes for stats (less frequently updated)
  checkperiod: 180,
  useClones: false
});

// Cache key generators
const generateKey = {
  user: (userId) => `user:${userId}`,
  userCourses: (userId) => `user_courses:${userId}`,
  courseUsers: (courseId) => `course_users:${courseId}`,
  userAssignments: (userId) => `user_assignments:${userId}`,
  courseAssignments: (courseId) => `course_assignments:${courseId}`,
  userStats: (userId) => `user_stats:${userId}`,
  globalStats: () => 'global_stats',
  userSettings: (userId) => `user_settings:${userId}`,
  userReminders: (userId) => `user_reminders:${userId}`
};

// User data caching
export const userCacheUtil = {
  get: (userId) => userCache.get(generateKey.user(userId)),
  set: (userId, userData, ttl) => userCache.set(generateKey.user(userId), userData, ttl),
  del: (userId) => userCache.del(generateKey.user(userId)),
  
  getCourses: (userId) => userCache.get(generateKey.userCourses(userId)),
  setCourses: (userId, courses, ttl) => userCache.set(generateKey.userCourses(userId), courses, ttl),
  delCourses: (userId) => userCache.del(generateKey.userCourses(userId)),
  
  getAssignments: (userId) => userCache.get(generateKey.userAssignments(userId)),
  setAssignments: (userId, assignments, ttl) => userCache.set(generateKey.userAssignments(userId), assignments, ttl),
  delAssignments: (userId) => userCache.del(generateKey.userAssignments(userId)),
  
  getSettings: (userId) => userCache.get(generateKey.userSettings(userId)),
  setSettings: (userId, settings, ttl = 1800) => userCache.set(generateKey.userSettings(userId), settings, ttl), // 30 min for settings
  delSettings: (userId) => userCache.del(generateKey.userSettings(userId)),
  
  getReminders: (userId) => userCache.get(generateKey.userReminders(userId)),
  setReminders: (userId, reminders, ttl) => userCache.set(generateKey.userReminders(userId), reminders, ttl),
  delReminders: (userId) => userCache.del(generateKey.userReminders(userId)),
  
  // Invalidate all user-related cache
  invalidateUser: (userId) => {
    userCache.del([
      generateKey.user(userId),
      generateKey.userCourses(userId),
      generateKey.userAssignments(userId),
      generateKey.userSettings(userId),
      generateKey.userReminders(userId)
    ]);
  }
};

// Course data caching
export const courseCacheUtil = {
  get: (courseId) => courseCache.get(`course:${courseId}`),
  set: (courseId, courseData, ttl) => courseCache.set(`course:${courseId}`, courseData, ttl),
  del: (courseId) => courseCache.del(`course:${courseId}`),
  
  getAll: () => courseCache.get('all_courses'),
  setAll: (courses, ttl) => courseCache.set('all_courses', courses, ttl),
  delAll: () => courseCache.del('all_courses'),
  
  getUsers: (courseId) => courseCache.get(generateKey.courseUsers(courseId)),
  setUsers: (courseId, users, ttl) => courseCache.set(generateKey.courseUsers(courseId), users, ttl),
  delUsers: (courseId) => courseCache.del(generateKey.courseUsers(courseId)),
  
  getAssignments: (courseId) => courseCache.get(generateKey.courseAssignments(courseId)),
  setAssignments: (courseId, assignments, ttl) => courseCache.set(generateKey.courseAssignments(courseId), assignments, ttl),
  delAssignments: (courseId) => courseCache.del(generateKey.courseAssignments(courseId)),
  
  // Invalidate all cache when course data changes
  invalidateAll: () => {
    courseCache.flushAll();
  }
};

// Assignment data caching
export const assignmentCacheUtil = {
  get: (assignmentId) => assignmentCache.get(`assignment:${assignmentId}`),
  set: (assignmentId, assignmentData, ttl) => assignmentCache.set(`assignment:${assignmentId}`, assignmentData, ttl),
  del: (assignmentId) => assignmentCache.del(`assignment:${assignmentId}`),
  
  getAll: () => assignmentCache.get('all_assignments'),
  setAll: (assignments, ttl) => assignmentCache.set('all_assignments', assignments, ttl),
  delAll: () => assignmentCache.del('all_assignments'),
  
  // Invalidate assignment-related cache
  invalidate: (assignmentId, courseId) => {
    assignmentCache.del([
      `assignment:${assignmentId}`,
      'all_assignments'
    ]);
    // Also invalidate course assignments
    if (courseId) {
      courseCacheUtil.delAssignments(courseId);
    }
  }
};

// Stats caching
export const statsCacheUtil = {
  getUser: (userId) => statsCache.get(generateKey.userStats(userId)),
  setUser: (userId, stats, ttl) => statsCache.set(generateKey.userStats(userId), stats, ttl),
  delUser: (userId) => statsCache.del(generateKey.userStats(userId)),
  
  getGlobal: () => statsCache.get(generateKey.globalStats()),
  setGlobal: (stats, ttl) => statsCache.set(generateKey.globalStats(), stats, ttl),
  delGlobal: () => statsCache.del(generateKey.globalStats()),
  
  // Invalidate all stats
  invalidateAll: () => {
    statsCache.flushAll();
  }
};

// Batch operations for better performance
export const batchCacheUtil = {
  // Get multiple user data at once
  getUsers: (userIds) => {
    const keys = userIds.map(generateKey.user);
    return userCache.mget(keys);
  },
  
  // Set multiple user data at once
  setUsers: (userData, ttl) => {
    const keyValuePairs = userData.map(user => ({
      key: generateKey.user(user.id),
      val: user,
      ttl
    }));
    userCache.mset(keyValuePairs);
  },
  
  // Get multiple courses at once
  getCourses: (courseIds) => {
    const keys = courseIds.map(id => `course:${id}`);
    return courseCache.mget(keys);
  }
};

// Cache statistics and monitoring
export const cacheStats = {
  getStats: () => ({
    user: userCache.getStats(),
    course: courseCache.getStats(),
    assignment: assignmentCache.getStats(),
    stats: statsCache.getStats()
  }),
  
  getKeys: () => ({
    user: userCache.keys(),
    course: courseCache.keys(),
    assignment: assignmentCache.keys(),
    stats: statsCache.keys()
  }),
  
  // Clear all caches (use carefully)
  flushAll: () => {
    userCache.flushAll();
    courseCache.flushAll();
    assignmentCache.flushAll();
    statsCache.flushAll();
  }
};

// Cache warming - preload frequently accessed data
export const warmCache = {
  async preloadUserData(userId, dbFunctions) {
    try {
      // Only warm cache if data doesn't exist
      if (!userCacheUtil.get(userId)) {
        const userData = await dbFunctions.getUserInfo(userId);
        if (userData.success) {
          userCacheUtil.set(userId, userData.data, 300);
        }
      }
    } catch (error) {
      console.error('Cache warming failed for user:', userId, error);
    }
  },
  
  async preloadCourseData(dbFunctions) {
    try {
      if (!courseCacheUtil.getAll()) {
        const courses = await dbFunctions.getCourses();
        if (courses.success) {
          courseCacheUtil.setAll(courses.data, 600);
        }
      }
    } catch (error) {
      console.error('Cache warming failed for courses:', error);
    }
  }
};

// Export cache instances for direct access if needed
export { userCache, courseCache, assignmentCache, statsCache };