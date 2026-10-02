import express from 'express';
import { getDb, saveDatabase, getNextQueryNumber } from '../db.js';
import { requireAuth, requireAdminOrStaff, type AuthenticatedRequest } from '../middleware.js';
import { broadcastQueryEvent, broadcastNotificationEvent } from '../websocket.js';
import type {
  CustomerQuery,
  QueryMessage,
  QueryInternalNote,
  QueryAuditLog,
  CustomerQueryStats,
  QueryCategory,
  QueryStatus,
  QueryPriority,
  NotificationRecord,
} from '../../src/types.js';

const router = express.Router();

export function calculateQueryStats(queries: CustomerQuery[]): CustomerQueryStats {
  const activeQueries = queries.filter((q) => !q.isDeleted);
  const unarchived = activeQueries.filter((q) => !q.isArchived);

  return {
    total: unarchived.length,
    new: unarchived.filter((q) => q.status === 'new').length,
    inProgress: unarchived.filter((q) => q.status === 'in_progress').length,
    waitingCustomer: unarchived.filter((q) => q.status === 'waiting_customer').length,
    replied: unarchived.filter((q) => q.status === 'replied').length,
    resolved: unarchived.filter((q) => q.status === 'resolved').length,
    closed: unarchived.filter((q) => q.status === 'closed').length,
    unread: unarchived.filter((q) => !q.isReadByAdmin).length,
    archived: activeQueries.filter((q) => q.isArchived).length,
  };
}

// =========================================================================
// PUBLIC / CUSTOMER SUBMISSION (Contact Us Form)
// =========================================================================
export function handleContactQuerySubmission(req: AuthenticatedRequest, res: express.Response) {
  const authUserId = req.user?.id;
  const db = getDb();
  if (!db.queries) db.queries = [];

  const customerAccount = authUserId ? (db.users || []).find((u) => u.id === authUserId) : null;
  const { name, email, phone, subject, message, category, orderNumber } = req.body;

  if (!message || !message.trim()) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  let customerId = '';
  let customerName = '';
  let customerEmail = '';
  let customerPhone = '';

  if (customerAccount) {
    customerId = customerAccount.id;
    customerName = customerAccount.name;
    customerEmail = customerAccount.email.trim().toLowerCase();
    customerPhone = phone ? phone.trim() : (customerAccount.phone || '');
  } else {
    // Guest submission
    if (!name || !name.trim() || !email || !email.trim()) {
      res.status(400).json({ error: 'Full name and a valid email address are required.' });
      return;
    }
    customerId = `guest_${Date.now()}`;
    customerName = name.trim();
    customerEmail = email.trim().toLowerCase();
    customerPhone = phone ? phone.trim() : '';
  }

  const now = new Date().toISOString();
  const queryNumber = getNextQueryNumber();
  const queryId = `qry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const validCategory: QueryCategory = (category && [
    'General Question',
    'Order',
    'Product',
    'Shipping',
    'Payment',
    'Return / Exchange',
    'Complaint',
    'Wholesale',
    'Other',
  ].includes(category))
    ? category
    : 'General Question';

  const initialMessage: QueryMessage = {
    id: `qmsg_${Date.now()}_1`,
    queryId,
    senderId: customerId,
    senderName: customerName,
    senderRole: 'customer',
    message: message.trim(),
    createdAt: now,
    isRead: false,
  };

  const initialTimeline: QueryAuditLog = {
    id: `qaud_${Date.now()}_1`,
    queryId,
    action: 'Query submitted via Contact Us',
    actorName: customerName,
    actorRole: 'customer',
    timestamp: now,
    details: `Category: ${validCategory}`,
  };

  const newQuery: CustomerQuery = {
    id: queryId,
    queryNumber,
    customerId,
    customerName,
    customerEmail,
    customerPhone,
    subject: subject?.trim() || 'General Customer Inquiry',
    category: validCategory,
    orderNumber: orderNumber ? String(orderNumber).trim() : undefined,
    message: message.trim(),
    status: 'new',
    priority: 'normal',
    isReadByAdmin: false,
    isReadByCustomer: true,
    isArchived: false,
    isDeleted: false,
    messages: [initialMessage],
    internalNotes: [],
    auditTimeline: [initialTimeline],
    createdAt: now,
    updatedAt: now,
  };

  db.queries.unshift(newQuery);

  // Keep legacy contactMessages synchronized
  if (!db.contactMessages) db.contactMessages = [];
  db.contactMessages.unshift({
    id: queryId,
    name: newQuery.customerName,
    email: newQuery.customerEmail,
    phone: newQuery.customerPhone,
    subject: newQuery.subject,
    message: newQuery.message,
    status: 'unread',
    createdAt: now,
  });

  // Calculate live stats
  const stats = calculateQueryStats(db.queries);

  // Create real-time Admin Notification (AUDIENCE: 'admin' - NEVER 'all')
  const notifId = `notif_${Date.now()}_qry`;
  const adminNotif: NotificationRecord = {
    id: notifId,
    title: `New Customer Query: ${newQuery.queryNumber}`,
    message: `${newQuery.customerName} submitted inquiry: "${newQuery.subject}"`,
    type: 'Customer Service',
    audience: 'admin',
    status: 'published',
    buttonText: 'View Query',
    link: '/aliadmin?tab=queries',
    createdAt: now,
    updatedAt: now,
  };
  if (!db.notifications) db.notifications = [];
  db.notifications.unshift(adminNotif);

  saveDatabase();

  // 1. Broadcast real-time query event to all connected admin panels
  broadcastQueryEvent({
    action: 'created',
    query: newQuery,
    targetCustomerId: newQuery.customerId,
    stats,
  });

  // 2. Broadcast notification strictly to admin notification bell
  broadcastNotificationEvent({
    action: 'created',
    notification: adminNotif,
  });

  res.status(201).json({
    success: true,
    queryNumber: newQuery.queryNumber,
    queryId: newQuery.id,
    query: {
      ...newQuery,
      internalNotes: undefined,
    },
    message: `Thank you for contacting FAWNIC. Your query has been received successfully. Query ID: ${newQuery.queryNumber}. Our team will review your message and get back to you shortly.`,
  });
}

// Public / Contact router
router.post('/contact', handleContactQuerySubmission);
router.post('/submit', handleContactQuerySubmission);

// =========================================================================
// CUSTOMER PORTAL ENDPOINTS (/api/customer/queries)
// =========================================================================
export const customerQueryRouter = express.Router();
customerQueryRouter.use(requireAuth);

// Get current customer's queries - STRICT OWNERSHIP ENFORCEMENT
customerQueryRouter.get('/', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Customer authentication required' });
    return;
  }

  // Security: Customer can ONLY see their own queries (where customerId === authenticatedUser.id)
  const userQueries = (db.queries || []).filter((q) => {
    if (q.isDeleted) return false;
    return q.customerId === userId;
  });

  // Sanitize internal notes so customers NEVER see internal admin/staff notes
  const sanitized = userQueries.map((q) => {
    const { internalNotes, ...rest } = q;
    return rest;
  });

  res.json(sanitized);
});

// Get single query for current customer
customerQueryRouter.get('/:id', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Customer authentication required' });
    return;
  }

  const query = (db.queries || []).find(
    (q) => (q.id === req.params.id || q.queryNumber === req.params.id) && !q.isDeleted
  );

  // Security check: Return 404 if not found OR not owned by the authenticated customer
  // Do NOT reveal that the query exists for another customer!
  if (!query || query.customerId !== userId) {
    res.status(404).json({ error: 'Query not found' });
    return;
  }

  // Mark as read by customer
  if (!query.isReadByCustomer) {
    query.isReadByCustomer = true;
    saveDatabase();
  }

  // Sanitize internal notes
  const { internalNotes, ...sanitized } = query;
  res.json(sanitized);
});

// Customer replies to their query
customerQueryRouter.post('/:id/reply', (req: AuthenticatedRequest, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    res.status(400).json({ error: 'Reply message cannot be empty' });
    return;
  }

  const db = getDb();
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Customer authentication required' });
    return;
  }

  const query = (db.queries || []).find(
    (q) => (q.id === req.params.id || q.queryNumber === req.params.id) && !q.isDeleted
  );

  // Security check: Customer can only reply to their own query
  if (!query || query.customerId !== userId) {
    res.status(404).json({ error: 'Query not found' });
    return;
  }

  if (query.status === 'closed') {
    res.status(400).json({ error: 'This inquiry is closed. Please submit a new inquiry.' });
    return;
  }

  const now = new Date().toISOString();
  const newMsg: QueryMessage = {
    id: `qmsg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    queryId: query.id,
    senderId: userId,
    senderName: req.user?.name || query.customerName,
    senderRole: 'customer',
    message: message.trim(),
    createdAt: now,
    isRead: false,
  };

  query.messages.push(newMsg);
  // Transition query status to in_progress
  query.status = 'in_progress';
  query.isReadByAdmin = false;
  query.updatedAt = now;

  query.auditTimeline.push({
    id: `qaud_${Date.now()}`,
    queryId: query.id,
    action: 'Customer replied to conversation',
    actorName: req.user?.name || query.customerName,
    actorRole: 'customer',
    timestamp: now,
  });

  // Calculate live stats
  const stats = calculateQueryStats(db.queries);

  // Create admin notification with audience: 'admin' (NEVER 'all')
  const adminNotif: NotificationRecord = {
    id: `notif_${Date.now()}_creply`,
    title: `Customer Reply: ${query.queryNumber}`,
    message: `${req.user?.name || query.customerName} replied: "${message.trim().substring(0, 100)}..."`,
    type: 'Customer Service',
    audience: 'admin',
    status: 'published',
    buttonText: 'View Query',
    link: '/aliadmin?tab=queries',
    createdAt: now,
    updatedAt: now,
  };
  if (!db.notifications) db.notifications = [];
  db.notifications.unshift(adminNotif);

  saveDatabase();

  // Real-time broadcast to Admin & Customer
  broadcastQueryEvent({
    action: 'message',
    query,
    message: newMsg,
    targetCustomerId: query.customerId,
    stats,
  });

  broadcastNotificationEvent({
    action: 'created',
    notification: adminNotif,
  });

  // Sanitize for response
  const { internalNotes, ...sanitized } = query;

  res.json({
    success: true,
    query: sanitized,
    message: newMsg,
  });
});

// =========================================================================
// ADMIN ENDPOINTS (/api/admin/queries)
// =========================================================================
export const adminQueryRouter = express.Router();
adminQueryRouter.use(requireAuth);
adminQueryRouter.use(requireAdminOrStaff);

// Staff permission helper
function canStaffManageQueries(req: AuthenticatedRequest, action: 'view' | 'reply' | 'change_status' | 'change_priority' | 'internal_notes' | 'archive' | 'delete'): boolean {
  if (!req.user) return false;
  if (req.user.role === 'admin') return true;
  if (req.user.role === 'staff') {
    const perms = req.user.permissions;
    if (!perms) return false;
    const pages = perms.pages || [];
    if (!pages.includes('queries') && !pages.includes('*') && !pages.includes('crm')) {
      return false;
    }
    const queryActions = perms.actions?.queries;
    if (queryActions && queryActions[action] === false) {
      return false;
    }
    return true;
  }
  return false;
}

// 1. Get queries with search, filters, date range, pagination
adminQueryRouter.get('/', (req: AuthenticatedRequest, res) => {
  if (!canStaffManageQueries(req, 'view')) {
    res.status(403).json({ error: 'Access denied: You do not have permission to view customer queries.' });
    return;
  }

  const db = getDb();
  let list = (db.queries || []).filter((q) => !q.isDeleted);

  const stats = calculateQueryStats(db.queries || []);

  const { search, status, priority, category, dateRange, archived } = req.query;

  // Filter archived
  if (archived === 'true') {
    list = list.filter((q) => q.isArchived);
  } else {
    list = list.filter((q) => !q.isArchived);
  }

  // Status filter
  if (status && status !== 'all') {
    list = list.filter((q) => q.status === status);
  }

  // Priority filter
  if (priority && priority !== 'all') {
    list = list.filter((q) => q.priority === priority);
  }

  // Category filter
  if (category && category !== 'all') {
    list = list.filter((q) => q.category === category);
  }

  // Date range filter
  if (dateRange && dateRange !== 'all') {
    const now = new Date().getTime();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    if (dateRange === 'today') {
      list = list.filter((q) => new Date(q.createdAt).getTime() >= startOfToday.getTime());
    } else if (dateRange === 'yesterday') {
      const yesterdayStart = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
      list = list.filter((q) => {
        const t = new Date(q.createdAt).getTime();
        return t >= yesterdayStart.getTime() && t < startOfToday.getTime();
      });
    } else if (dateRange === '7days') {
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      list = list.filter((q) => new Date(q.createdAt).getTime() >= sevenDaysAgo);
    } else if (dateRange === '30days') {
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      list = list.filter((q) => new Date(q.createdAt).getTime() >= thirtyDaysAgo);
    }
  }

  // Search filter
  if (search && typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter((item) => {
      return (
        item.queryNumber.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q) ||
        item.customerEmail.toLowerCase().includes(q) ||
        (item.customerPhone && item.customerPhone.toLowerCase().includes(q)) ||
        item.subject.toLowerCase().includes(q) ||
        (item.orderNumber && item.orderNumber.toLowerCase().includes(q))
      );
    });
  }

  // Sort by newest first
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    queries: list,
    stats,
  });
});

// 2. Get real-time stats only
adminQueryRouter.get('/stats', (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const stats = calculateQueryStats(db.queries || []);
  res.json(stats);
});

// 3. Get single query details with customer account information
adminQueryRouter.get('/:id', (req: AuthenticatedRequest, res) => {
  if (!canStaffManageQueries(req, 'view')) {
    res.status(403).json({ error: 'Access denied: You do not have permission to view this query.' });
    return;
  }

  const db = getDb();
  const query = (db.queries || []).find((q) => q.id === req.params.id && !q.isDeleted);

  if (!query) {
    res.status(404).json({ error: 'Query not found' });
    return;
  }

  // Mark as read by admin automatically
  if (!query.isReadByAdmin) {
    query.isReadByAdmin = true;
    saveDatabase();

    const stats = calculateQueryStats(db.queries || []);
    broadcastQueryEvent({
      action: 'updated',
      query,
      stats,
    });
  }

  // Provide connected customer insights if available
  let customerInfo = null;
  const customerUser = query.customerId
    ? db.users.find((u) => u.id === query.customerId)
    : db.users.find((u) => u.email.toLowerCase() === query.customerEmail.toLowerCase());

  if (customerUser) {
    const customerOrders = (db.orders || []).filter(
      (o) => o.customerId === customerUser.id || o.customerEmail.toLowerCase() === customerUser.email.toLowerCase()
    );
    const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const latestOrder = customerOrders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    customerInfo = {
      id: customerUser.id,
      name: customerUser.name,
      email: customerUser.email,
      phone: customerUser.phone,
      joinedDate: customerUser.createdAt,
      ordersCount: customerOrders.length,
      totalSpent,
      latestOrder: latestOrder
        ? {
            id: latestOrder.id,
            orderNumber: latestOrder.orderNumber,
            total: latestOrder.total,
            status: latestOrder.status,
            createdAt: latestOrder.createdAt,
          }
        : null,
    };
  }

  res.json({
    query,
    customerInfo,
  });
});

// 4. Update status
adminQueryRouter.put('/:id/status', (req: AuthenticatedRequest, res) => {
  if (!canStaffManageQueries(req, 'change_status')) {
    res.status(403).json({ error: 'Access denied: You do not have permission to change query status.' });
    return;
  }

  const { status } = req.body;
  const validStatuses: QueryStatus[] = ['new', 'in_progress', 'waiting_customer', 'replied', 'resolved', 'closed'];

  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid query status' });
    return;
  }

  const db = getDb();
  const query = (db.queries || []).find((q) => q.id === req.params.id && !q.isDeleted);
  if (!query) {
    res.status(404).json({ error: 'Query not found' });
    return;
  }

  const prevStatus = query.status;
  query.status = status;
  query.updatedAt = new Date().toISOString();

  if (status === 'resolved' || status === 'closed') {
    query.resolvedAt = new Date().toISOString();
  }

  const adminName = req.user?.name || 'Admin';
  query.auditTimeline.push({
    id: `qaud_${Date.now()}`,
    queryId: query.id,
    action: `Status changed from ${prevStatus.toUpperCase()} to ${status.toUpperCase()}`,
    actorName: adminName,
    actorRole: req.user?.role || 'admin',
    timestamp: new Date().toISOString(),
  });

  saveDatabase();

  const stats = calculateQueryStats(db.queries || []);
  broadcastQueryEvent({
    action: 'updated',
    query,
    targetCustomerId: query.customerId,
    stats,
  });

  res.json({ success: true, query, stats });
});

// 5. Update priority
adminQueryRouter.put('/:id/priority', (req: AuthenticatedRequest, res) => {
  if (!canStaffManageQueries(req, 'change_priority')) {
    res.status(403).json({ error: 'Access denied: You do not have permission to change priority.' });
    return;
  }

  const { priority } = req.body;
  const validPriorities: QueryPriority[] = ['low', 'normal', 'high', 'urgent'];

  if (!priority || !validPriorities.includes(priority)) {
    res.status(400).json({ error: 'Invalid priority level' });
    return;
  }

  const db = getDb();
  const query = (db.queries || []).find((q) => q.id === req.params.id && !q.isDeleted);
  if (!query) {
    res.status(404).json({ error: 'Query not found' });
    return;
  }

  const prevPriority = query.priority;
  query.priority = priority;
  query.updatedAt = new Date().toISOString();

  query.auditTimeline.push({
    id: `qaud_${Date.now()}`,
    queryId: query.id,
    action: `Priority changed from ${prevPriority.toUpperCase()} to ${priority.toUpperCase()}`,
    actorName: req.user?.name || 'Admin',
    actorRole: req.user?.role || 'admin',
    timestamp: new Date().toISOString(),
  });

  saveDatabase();

  broadcastQueryEvent({
    action: 'updated',
    query,
    targetCustomerId: query.customerId,
  });

  res.json({ success: true, query });
});

// 6. Mark Read / Unread
adminQueryRouter.put('/:id/read', (req: AuthenticatedRequest, res) => {
  const { isRead } = req.body;
  const db = getDb();
  const query = (db.queries || []).find((q) => q.id === req.params.id && !q.isDeleted);
  if (!query) {
    res.status(404).json({ error: 'Query not found' });
    return;
  }

  query.isReadByAdmin = isRead !== undefined ? Boolean(isRead) : !query.isReadByAdmin;
  query.updatedAt = new Date().toISOString();

  saveDatabase();

  const stats = calculateQueryStats(db.queries || []);
  broadcastQueryEvent({
    action: 'updated',
    query,
    stats,
  });

  res.json({ success: true, query, stats });
});

// 7. Admin Reply to Customer
adminQueryRouter.post('/:id/reply', (req: AuthenticatedRequest, res) => {
  if (!canStaffManageQueries(req, 'reply')) {
    res.status(403).json({ error: 'Access denied: You do not have permission to reply to queries.' });
    return;
  }

  const { message } = req.body;
  if (!message || !message.trim()) {
    res.status(400).json({ error: 'Reply text cannot be empty' });
    return;
  }

  const db = getDb();
  const query = (db.queries || []).find((q) => q.id === req.params.id && !q.isDeleted);
  if (!query) {
    res.status(404).json({ error: 'Query not found' });
    return;
  }

  const now = new Date().toISOString();
  const adminName = req.user?.name || 'FAWNIC Atelier Team';

  const replyMessage: QueryMessage = {
    id: `qmsg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    queryId: query.id,
    senderId: req.user?.id,
    senderName: adminName,
    senderRole: req.user?.role === 'staff' ? 'staff' : 'admin',
    message: message.trim(),
    createdAt: now,
    isRead: false,
  };

  query.messages.push(replyMessage);
  query.status = 'replied';
  query.isReadByCustomer = false;
  query.updatedAt = now;

  query.auditTimeline.push({
    id: `qaud_${Date.now()}`,
    queryId: query.id,
    action: `Staff reply sent by ${adminName}`,
    actorName: adminName,
    actorRole: req.user?.role || 'admin',
    timestamp: now,
  });

  // Contact Query replies strictly belong to the private support thread (Profile -> My Queries).
  // Query replies are NEVER inserted into db.notifications or broadcast as header marketing notifications.
  saveDatabase();

  const stats = calculateQueryStats(db.queries || []);

  // Broadcast to Admin consoles and Customer portal in real-time!
  broadcastQueryEvent({
    action: 'message',
    query,
    message: replyMessage,
    targetCustomerId: query.customerId,
    stats,
  });

  res.json({
    success: true,
    query,
    message: replyMessage,
    stats,
  });
});

// 8. Add Internal Admin Note
adminQueryRouter.post('/:id/notes', (req: AuthenticatedRequest, res) => {
  if (!canStaffManageQueries(req, 'internal_notes')) {
    res.status(403).json({ error: 'Access denied: You do not have permission to add internal notes.' });
    return;
  }

  const { note } = req.body;
  if (!note || !note.trim()) {
    res.status(400).json({ error: 'Internal note cannot be empty' });
    return;
  }

  const db = getDb();
  const query = (db.queries || []).find((q) => q.id === req.params.id && !q.isDeleted);
  if (!query) {
    res.status(404).json({ error: 'Query not found' });
    return;
  }

  const now = new Date().toISOString();
  const adminName = req.user?.name || 'Staff Member';

  const internalNote: QueryInternalNote = {
    id: `qnote_${Date.now()}`,
    queryId: query.id,
    adminId: req.user?.id || 'admin',
    adminName,
    note: note.trim(),
    createdAt: now,
  };

  if (!query.internalNotes) query.internalNotes = [];
  query.internalNotes.unshift(internalNote);
  query.updatedAt = now;

  query.auditTimeline.push({
    id: `qaud_${Date.now()}`,
    queryId: query.id,
    action: `Internal note added by ${adminName}`,
    actorName: adminName,
    actorRole: req.user?.role || 'admin',
    timestamp: now,
  });

  saveDatabase();

  // Broadcast to admin consoles ONLY (customers never receive internal notes)
  broadcastQueryEvent({
    action: 'updated',
    query,
  });

  res.json({
    success: true,
    query,
    note: internalNote,
  });
});

// 9. Archive / Unarchive
adminQueryRouter.put('/:id/archive', (req: AuthenticatedRequest, res) => {
  if (!canStaffManageQueries(req, 'archive')) {
    res.status(403).json({ error: 'Access denied: You do not have permission to archive queries.' });
    return;
  }

  const { isArchived } = req.body;
  const db = getDb();
  const query = (db.queries || []).find((q) => q.id === req.params.id && !q.isDeleted);
  if (!query) {
    res.status(404).json({ error: 'Query not found' });
    return;
  }

  query.isArchived = isArchived !== undefined ? Boolean(isArchived) : !query.isArchived;
  query.updatedAt = new Date().toISOString();

  query.auditTimeline.push({
    id: `qaud_${Date.now()}`,
    queryId: query.id,
    action: query.isArchived ? 'Query archived' : 'Query unarchived',
    actorName: req.user?.name || 'Admin',
    actorRole: req.user?.role || 'admin',
    timestamp: new Date().toISOString(),
  });

  saveDatabase();

  const stats = calculateQueryStats(db.queries || []);
  broadcastQueryEvent({
    action: 'updated',
    query,
    stats,
  });

  res.json({ success: true, query, stats });
});

// 10. Soft Delete query (with confirmation)
adminQueryRouter.delete('/:id', (req: AuthenticatedRequest, res) => {
  if (!canStaffManageQueries(req, 'delete')) {
    res.status(403).json({ error: 'Access denied: You do not have permission to delete queries.' });
    return;
  }

  const db = getDb();
  const query = (db.queries || []).find((q) => q.id === req.params.id && !q.isDeleted);
  if (!query) {
    res.status(404).json({ error: 'Query not found' });
    return;
  }

  // Soft deletion preserves audit history while removing from active views
  query.isDeleted = true;
  query.updatedAt = new Date().toISOString();

  query.auditTimeline.push({
    id: `qaud_${Date.now()}`,
    queryId: query.id,
    action: 'Query deleted by administrator',
    actorName: req.user?.name || 'Admin',
    actorRole: req.user?.role || 'admin',
    timestamp: new Date().toISOString(),
  });

  saveDatabase();

  const stats = calculateQueryStats(db.queries || []);
  broadcastQueryEvent({
    action: 'deleted',
    queryId: query.id,
    stats,
  });

  res.json({
    success: true,
    deletedQueryId: query.id,
    stats,
    message: 'Customer query has been safely deleted.',
  });
});

export default router;
