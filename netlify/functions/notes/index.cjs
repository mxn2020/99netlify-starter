const { generateNoteId } = require('../secure-id-utils.cjs');
const { getCorsHeaders } = require('../platform-utils.cjs');
const { 
  authenticateUser, 
  getCurrentAccountContext,
  validateContentAccess,
  hasContentAccess,
  getAuthErrorResponse,
  getPermissionErrorResponse,
  handleAuthError,
  redis
} = require('../account-utils.cjs');

// Use centralized CORS headers
const corsHeaders = getCorsHeaders();

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    const { httpMethod, path, queryStringParameters } = event;
    const pathParts = path.split('/').filter(Boolean);
    const noteId = pathParts[pathParts.length - 1];

    // Authenticate user for all requests
    const userId = await authenticateUser(event);
    
    // Get account context (from query param or use default personal account)
    const requestedAccountId = queryStringParameters?.accountId;
    const accountContext = await getCurrentAccountContext(userId, requestedAccountId);

    switch (httpMethod) {
      case 'GET':
        if (noteId && noteId !== 'notes') {
          return await handleGetNote(noteId, accountContext);
        } else {
          return await handleGetNotes(accountContext, queryStringParameters);
        }
      case 'POST':
        return await handleCreateNote(event, accountContext);
      case 'PUT':
        if (noteId) {
          return await handleUpdateNote(event, noteId, accountContext);
        }
        break;
      case 'DELETE':
        if (noteId) {
          return await handleDeleteNote(noteId, accountContext);
        }
        break;
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: 'Endpoint not found' }),
    };
  } catch (error) {
    console.error('Notes function error:', error);
    return handleAuthError(error, corsHeaders);
  }
};

async function handleGetNotes(accountContext, queryParams) {
  try {
    const { search, category, tags, sortBy = 'updatedAt', sortOrder = 'desc', page = 1, limit = 20 } = queryParams || {};
    const { accountId, userId } = accountContext;

    // Get account's note IDs - check both new account-based structure and legacy user-based structure
    let noteIds = [];
    
    // Try account-based notes first
    const accountNoteIds = await redis.lrange(`account:${accountId}:notes`, 0, -1);
    if (accountNoteIds.length > 0) {
      noteIds = accountNoteIds;
    } else {
      // Fallback to user-based notes for backwards compatibility
      const userNoteIds = await redis.lrange(`user:${userId}:notes`, 0, -1);
      noteIds = userNoteIds;
    }

    if (noteIds.length === 0) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, notes: [], total: 0, page: parseInt(page), totalPages: 0 }),
      };
    }

    // Get all notes
    const notesData = await redis.mget(noteIds.map(id => `note:${id}`));
    let notes = notesData
      .filter(data => data !== null)
      .map(data => {
        try {
          return typeof data === 'string' ? JSON.parse(data) : data;
        } catch (parseError) {
          console.error('Failed to parse note data:', parseError);
          return null;
        }
      })
      .filter(note => note !== null)
      .filter(note => {
        // Filter by account access - check both accountId and legacy userId
        return note.accountId === accountId || (note.userId === userId && !note.accountId);
      });

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      notes = notes.filter(note =>
        note.title.toLowerCase().includes(searchLower) ||
        note.content.toLowerCase().includes(searchLower)
      );
    }

    if (category) {
      notes = notes.filter(note => note.category === category);
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      notes = notes.filter(note =>
        note.tags.some(tag => tagArray.includes(tag))
      );
    }

    // Sort notes
    notes.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Paginate
    const total = notes.length;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    const paginatedNotes = notes.slice(offset, offset + limitNum);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        notes: paginatedNotes,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        accountContext: { accountId, role: accountContext.role }
      }),
    };
  } catch (error) {
    console.error('Get notes error:', error);
    throw error;
  }
}

async function handleGetNote(noteId, accountContext) {
  try {
    const { accountId, userId } = accountContext;
    const noteData = await redis.get(`note:${noteId}`);

    if (!noteData) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Note not found' }),
      };
    }

    const note = typeof noteData === 'string' ? JSON.parse(noteData) : noteData;

    // Verify account access - check both new account-based and legacy user-based ownership
    const hasAccess = note.accountId === accountId || (note.userId === userId && !note.accountId);
    if (!hasAccess) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Access denied' }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        success: true,
        note,
        accountContext: { accountId, role: accountContext.role }
      }),
    };
  } catch (error) {
    console.error('Get note error:', error);
    throw error;
  }
}

async function handleCreateNote(event, accountContext) {
  try {
    const { accountId, userId, role } = accountContext;
    const requestBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { title, content, category = 'general', tags = [], isPublic = false } = requestBody;

    if (!title || !content) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Title and content are required' }),
      };
    }

    // Check if user has permission to create content in this account
    if (role === 'viewer') {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Insufficient permissions to create content' }),
      };
    }

    const noteId = generateNoteId();
    const now = new Date().toISOString();

    const note = {
      id: noteId,
      accountId, // Link to account instead of just user
      userId, // Keep user for attribution
      createdBy: userId,
      title,
      content,
      category,
      tags: Array.isArray(tags) ? tags : [],
      isPublic,
      createdAt: now,
      updatedAt: now,
    };

    // Store note
    await redis.set(`note:${noteId}`, JSON.stringify(note));

    // Add to account's notes list (new structure)
    await redis.lpush(`account:${accountId}:notes`, noteId);

    // Also add to user's notes list for backwards compatibility
    await redis.lpush(`user:${userId}:notes`, noteId);

    // Add to category index if not general
    if (category !== 'general') {
      await redis.sadd(`category:${category}:notes`, noteId);
      await redis.sadd(`account:${accountId}:category:${category}:notes`, noteId);
    }

    // Add to tag indices
    for (const tag of note.tags) {
      await redis.sadd(`tag:${tag}:notes`, noteId);
      await redis.sadd(`account:${accountId}:tag:${tag}:notes`, noteId);
    }

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({ 
        success: true,
        note,
        accountContext: { accountId, role }
      }),
    };
  } catch (error) {
    console.error('Create note error:', error);
    throw error;
  }
}

async function handleUpdateNote(event, noteId, accountContext) {
  try {
    const { accountId, userId, role } = accountContext;
    const noteData = await redis.get(`note:${noteId}`);

    if (!noteData) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Note not found' }),
      };
    }

    const existingNote = typeof noteData === 'string' ? JSON.parse(noteData) : noteData;

    // Verify account access - check both new account-based and legacy user-based ownership
    const hasAccess = existingNote.accountId === accountId || (existingNote.userId === userId && !existingNote.accountId);
    if (!hasAccess) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Access denied' }),
      };
    }

    // Check if user has permission to edit content in this account
    if (role === 'viewer') {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Insufficient permissions to edit content' }),
      };
    }

    const updates = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const updatedNote = {
      ...existingNote,
      ...updates,
      id: noteId, // Ensure ID doesn't change
      accountId: existingNote.accountId || accountId, // Preserve or set accountId
      userId: existingNote.userId, // Preserve original creator
      createdBy: existingNote.createdBy || existingNote.userId, // Preserve original creator
      updatedBy: userId, // Track who updated it
      updatedAt: new Date().toISOString(),
    };

    // Handle category changes
    if (updates.category && updates.category !== existingNote.category) {
      // Remove from old category indices
      if (existingNote.category !== 'general') {
        await redis.srem(`category:${existingNote.category}:notes`, noteId);
        await redis.srem(`account:${accountId}:category:${existingNote.category}:notes`, noteId);
      }
      // Add to new category indices
      if (updates.category !== 'general') {
        await redis.sadd(`category:${updates.category}:notes`, noteId);
        await redis.sadd(`account:${accountId}:category:${updates.category}:notes`, noteId);
      }
    }

    // Handle tag changes
    if (updates.tags) {
      // Remove from old tag indices
      for (const tag of existingNote.tags) {
        await redis.srem(`tag:${tag}:notes`, noteId);
        await redis.srem(`account:${accountId}:tag:${tag}:notes`, noteId);
      }
      // Add to new tag indices
      for (const tag of updatedNote.tags) {
        await redis.sadd(`tag:${tag}:notes`, noteId);
        await redis.sadd(`account:${accountId}:tag:${tag}:notes`, noteId);
      }
    }

    // Store updated note
    await redis.set(`note:${noteId}`, JSON.stringify(updatedNote));

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        success: true,
        note: updatedNote,
        accountContext: { accountId, role }
      }),
    };
  } catch (error) {
    console.error('Update note error:', error);
    throw error;
  }
}

async function handleDeleteNote(noteId, accountContext) {
  try {
    const { accountId, userId, role } = accountContext;
    const noteData = await redis.get(`note:${noteId}`);

    if (!noteData) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Note not found' }),
      };
    }

    const note = typeof noteData === 'string' ? JSON.parse(noteData) : noteData;

    // Verify account access - check both new account-based and legacy user-based ownership
    const hasAccess = note.accountId === accountId || (note.userId === userId && !note.accountId);
    if (!hasAccess) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Access denied' }),
      };
    }

    // Check if user has delete permissions
    if (role === 'viewer' || (role === 'editor' && note.createdBy !== userId && note.userId !== userId)) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Insufficient permissions to delete content' }),
      };
    }

    // Remove from all indices
    await redis.del(`note:${noteId}`);
    
    // Remove from account notes list
    await redis.lrem(`account:${accountId}:notes`, 0, noteId);
    
    // Remove from user notes list (backwards compatibility)
    await redis.lrem(`user:${note.userId || userId}:notes`, 0, noteId);

    // Remove from category indices
    if (note.category !== 'general') {
      await redis.srem(`category:${note.category}:notes`, noteId);
      await redis.srem(`account:${accountId}:category:${note.category}:notes`, noteId);
    }

    // Remove from tag indices
    for (const tag of note.tags) {
      await redis.srem(`tag:${tag}:notes`, noteId);
      await redis.srem(`account:${accountId}:tag:${tag}:notes`, noteId);
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        success: true,
        message: 'Note deleted successfully',
        accountContext: { accountId, role }
      }),
    };
  } catch (error) {
    console.error('Delete note error:', error);
    throw error;
  }
}
