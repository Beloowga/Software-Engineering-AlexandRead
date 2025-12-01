import { supabase } from '../db.js';

// Get comment statistics (average rating and count) for a book
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

// Get all comments for a book with user info
export async function getCommentsByBookId(req, res) {
  const { bookId } = req.params;
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  try {
    // Get comments with related user data
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

    // Get user details for each comment
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

// Create a new comment
export async function createComment(req, res) {
  const userId = req.auth?.userId;
  const { bookId, rating, comment } = req.body;

  // Validation
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
    // Check if book exists
    const { data: bookData, error: bookError } = await supabase
      .from('books')
      .select('id, premium')
      .eq('id', bookId)
      .single();

    if (bookError || !bookData) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Check if user already has a comment on this book
    const { data: existingComment } = await supabase
      .from('comments')
      .select('id')
      .eq('book_id', bookId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingComment) {
      return res.status(409).json({ error: 'You already have a comment on this book. Delete it first to add a new one.' });
    }

    // Check if premium book and user is not premium
    if (bookData.premium) {
      const { data: userData, error: userError } = await supabase
        .from('account')
        .select('end_sub_date')
        .eq('id', userId)
        .maybeSingle();

      // Check if subscription is active (end_sub_date is in the future)
      const isSubscriptionActive = userData?.end_sub_date 
        ? new Date(userData.end_sub_date) >= new Date()
        : false;

      if (!isSubscriptionActive) {
        return res.status(403).json({ 
          error: 'You must have an active subscription to comment on premium books' 
        });
      }
    }

    // Insert the comment
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

    // Get user data for the response
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

// Delete a comment
export async function deleteComment(req, res) {
  const userId = req.auth?.userId;
  const { commentId } = req.params;

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    // Check if comment exists and belongs to user
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

    // Delete the comment
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
