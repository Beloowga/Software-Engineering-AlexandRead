import { supabase } from '../db.js';

export async function getCommentStats(req, res) {
  const { bookId } = req.params;

  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select('rating')
      .eq('book_id', bookId);

    if (error) {
      console.error('Error fetching comment stats:', error);
      return res.status(400).json({ error: 'Failed to fetch comment stats' });
    }

    if (!comments || comments.length === 0) {
      return res.json({ averageRating: null, totalComments: 0 });
    }

    const average = comments.reduce((sum, c) => sum + c.rating, 0) / comments.length;
    res.json({ 
      averageRating: Math.round(average * 10) / 10,
      totalComments: comments.length 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getCommentsByBookId(req, res) {
  const { bookId } = req.params;
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  try {
    const { data: comments, error: commentError, count } = await supabase
      .from('comments')
      .select('*', { count: 'exact' })
      .eq('book_id', bookId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (commentError) {
      console.error('Error fetching comments:', commentError);
      return res.status(400).json({ error: 'Failed to fetch comments' });
    }

    const commentsWithUsers = await Promise.all(
      (comments || []).map(async (comment) => {
        const { data: userData } = await supabase
          .from('account')
          .select('id, name, email, avatar_url')
          .eq('id', comment.user_id)
          .single();

        return {
          ...comment,
          account: userData || { id: comment.user_id },
        };
      })
    );

    res.json({ comments: commentsWithUsers, total: count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function createComment(req, res) {
  const userId = req.auth?.userId;
  const { bookId, rating, comment } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  if (!bookId || !rating) {
    return res.status(400).json({ error: 'Book ID and rating are required' });
  }

  if (rating < 1 || rating > 10 || !Number.isInteger(rating)) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 10' });
  }

  if (comment && comment.length > 500) {
    return res.status(400).json({ error: 'Comment must not exceed 500 characters' });
  }

  try {
    const { data: bookData, error: bookError } = await supabase
      .from('books')
      .select('id, premium')
      .eq('id', bookId)
      .single();

    if (bookError || !bookData) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const { data: existingComment } = await supabase
      .from('comments')
      .select('id')
      .eq('book_id', bookId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingComment) {
      return res.status(409).json({ error: 'You already have a comment on this book. Delete it first to add a new one.' });
    }

    if (bookData.premium) {
      const { data: userData, error: userError } = await supabase
        .from('account')
        .select('end_sub_date')
        .eq('id', userId)
        .maybeSingle();

      const isSubscriptionActive = userData?.end_sub_date 
        ? new Date(userData.end_sub_date) >= new Date()
        : false;

      if (!isSubscriptionActive) {
        return res.status(403).json({ 
          error: 'You must have an active subscription to comment on premium books' 
        });
      }
    }

    const { data, error } = await supabase
      .from('comments')
      .insert([{
        book_id: bookId,
        user_id: userId,
        rating,
        comment: comment || null,
      }])
      .select('*')
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return res.status(400).json({ error: 'Failed to create comment' });
    }

    const { data: userData } = await supabase
      .from('account')
      .select('id, name, email, avatar_url')
      .eq('id', userId)
      .single();

    const responseData = {
      ...data,
      account: userData || { id: userId },
    };

    res.status(201).json(responseData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteComment(req, res) {
  const userId = req.auth?.userId;
  const { commentId } = req.params;

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id, user_id')
      .eq('id', commentId)
      .single();

    if (commentError || !comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.user_id !== userId) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      return res.status(400).json({ error: 'Failed to delete comment' });
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateComment(req, res) {
  const userId = req.auth?.userId;
  const { commentId } = req.params;
  const { rating, comment } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  if (rating !== undefined) {
    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 10) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 10' });
    }
  }

  if (comment && comment.length > 500) {
    return res.status(400).json({ error: 'Comment must not exceed 500 characters' });
  }

  try {
    const { data: existingComment, error: fetchError } = await supabase
      .from('comments')
      .select('id, user_id, book_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (existingComment.user_id !== userId) {
      return res.status(403).json({ error: 'You can only edit your own comments' });
    }

    const updates = {};
    if (rating !== undefined) updates.rating = rating;
    if (comment !== undefined) updates.comment = comment || null;

    const { data: updated, error: updateError } = await supabase
      .from('comments')
      .update(updates)
      .eq('id', commentId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating comment:', updateError);
      return res.status(400).json({ error: 'Failed to update comment' });
    }

    const { data: userData } = await supabase
      .from('account')
      .select('id, name, email, avatar_url')
      .eq('id', userId)
      .single();

    res.json({
      ...updated,
      account: userData || { id: userId },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function adminListComments(req, res) {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = Number(req.query.offset) || 0;
  const bookId = req.query.bookId ? Number(req.query.bookId) : null;

  try {
    let query = supabase
      .from('comments')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (bookId) {
      query = query.eq('book_id', bookId);
    }

    const { data: comments, error, count } = await query;

    if (error) {
      console.error('[adminListComments] fetch error:', error);
      return res.status(500).json({ error: 'Unable to load comments.' });
    }

    const userIds = Array.from(new Set((comments || []).map((c) => c.user_id).filter(Boolean)));
    const bookIds = Array.from(new Set((comments || []).map((c) => c.book_id).filter(Boolean)));

    const [userRes, bookRes] = await Promise.all([
      userIds.length
        ? supabase
          .from('account')
          .select('id, email, pseudo, name, avatar_url')
          .in('id', userIds)
        : { data: [] },
      bookIds.length
        ? supabase
          .from('books')
          .select('id, title, author')
          .in('id', bookIds)
        : { data: [] },
    ]);

    const userMap = new Map((userRes.data || []).map((u) => [u.id, u]));
    const bookMap = new Map((bookRes.data || []).map((b) => [b.id, b]));

    const enriched = (comments || []).map((c) => ({
      ...c,
      account: userMap.get(c.user_id) || null,
      book: bookMap.get(c.book_id) || null,
    }));

    return res.json({ comments: enriched, total: count ?? enriched.length });
  } catch (err) {
    console.error('[adminListComments] unexpected error:', err);
    return res.status(500).json({ error: 'Server error while listing comments.' });
  }
}

export async function adminUpdateComment(req, res) {
  const commentId = Number(req.params.id);
  if (!commentId) {
    return res.status(400).json({ error: 'Invalid comment id.' });
  }

  const { rating, comment } = req.body || {};
  const updates = {};

  if (typeof rating !== 'undefined') {
    const parsed = Number(rating);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 10.' });
    }
    updates.rating = parsed;
  }

  if (typeof comment !== 'undefined') {
    if (comment && comment.length > 500) {
      return res.status(400).json({ error: 'Comment must not exceed 500 characters.' });
    }
    updates.comment = comment ? comment : null;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields provided for update.' });
  }

  try {
    const { data, error } = await supabase
      .from('comments')
      .update(updates)
      .eq('id', commentId)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[adminUpdateComment] update error:', error);
      return res.status(500).json({ error: 'Failed to update comment.' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    const [userRes, bookRes] = await Promise.all([
      supabase.from('account').select('id, email, pseudo, name, avatar_url').eq('id', data.user_id).maybeSingle(),
      supabase.from('books').select('id, title, author').eq('id', data.book_id).maybeSingle(),
    ]);

    return res.json({
      ...data,
      account: userRes?.data || null,
      book: bookRes?.data || null,
    });
  } catch (err) {
    console.error('[adminUpdateComment] unexpected error:', err);
    return res.status(500).json({ error: 'Server error while updating comment.' });
  }
}

export async function adminDeleteComment(req, res) {
  const commentId = Number(req.params.id);
  if (!commentId) {
    return res.status(400).json({ error: 'Invalid comment id.' });
  }

  try {
    const { data, error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[adminDeleteComment] delete error:', error);
      return res.status(500).json({ error: 'Failed to delete comment.' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    return res.status(204).send();
  } catch (err) {
    console.error('[adminDeleteComment] unexpected error:', err);
    return res.status(500).json({ error: 'Server error while deleting comment.' });
  }
}
