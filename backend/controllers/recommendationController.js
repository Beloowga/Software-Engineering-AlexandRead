import { supabase } from '../db.js';

export async function getRecommendations(req, res) {
  const userId = Number(req.auth?.userId);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const LIMIT = 5;
  
  try {
    const { data: userProfile, error: userError } = await supabase
      .from('account')
      .select('favourite_genres, favourite_author')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    const { data: readHistory } = await supabase
      .from('acc_reading')
      .select('book_id')
      .eq('user_id', userId);
    
    const readBookIds = new Set(readHistory?.map(r => r.book_id) || []);
    const recommendedIds = new Set();

    const { data: collabData, error: collabError } = await supabase
      .rpc('get_collab_recs', { 
        target_user_id: userId, 
        limit_count: LIMIT 
      });

    if (!collabError && collabData) {
      collabData.forEach(row => {
        if (!readBookIds.has(row.book_id)) recommendedIds.add(row.book_id);
      });
    }

    const genres = Array.isArray(userProfile?.favourite_genres) ? userProfile.favourite_genres : [];
    const favouriteAuthor = (userProfile?.favourite_author || '').trim();

    if (favouriteAuthor) {
      const { data: authorMatches, error: authorError } = await supabase
        .from('books')
        .select('id')
        .eq('author', favouriteAuthor)
        .limit(LIMIT);

      if (!authorError && authorMatches) {
        authorMatches.forEach(row => {
          if (!readBookIds.has(row.id)) recommendedIds.add(row.id);
        });
      }
    }

    if (genres.length > 0) {
      const { data: genreMatches, error: genreError } = await supabase
        .from('books')
        .select('id')
        .in('genre', genres)
        .limit(LIMIT);

      if (!genreError && genreMatches) {
        genreMatches.forEach(row => {
          if (!readBookIds.has(row.id)) recommendedIds.add(row.id);
        });
      }
    }

    if (recommendedIds.size < 5) {
      const { data: trendingData } = await supabase
        .rpc('get_trending_books', { limit_count: LIMIT });
      
      if (trendingData) {
        trendingData.forEach(row => {
          if (!readBookIds.has(row.book_id)) recommendedIds.add(row.book_id);
        });
      }
    }

    if (recommendedIds.size === 0) return res.json([]);

    const { data: finalBooks, error: finalError } = await supabase
      .from('books')
      .select('id, title, author, genre, cover_image, summary, year')
      .in('id', Array.from(recommendedIds));

    if (finalError) throw finalError;

    const shuffled = finalBooks.sort(() => 0.5 - Math.random());

    return res.json(shuffled);

  } catch (error) {
    console.error('Recommendation Error:', error);
    return res.status(500).json({ error: 'Failed to generate recommendations' });
  }
}
