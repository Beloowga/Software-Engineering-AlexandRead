import { supabase } from '../db.js';

export async function getRecommendations(req, res) {
  const userId = Number(req.params.userId);
  const LIMIT = 5; // How many books per category
  
  try {
    // 1. Fetch User Preferences for Content-Based Filtering
    const { data: userProfile, error: userError } = await supabase
      .from('account')
      .select('favourite_genres, favourite_author')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // 2. Fetch User's Read History (to exclude from recommendations)
    const { data: readHistory } = await supabase
      .from('acc_reading')
      .select('book_id')
      .eq('user_id', userId);
    
    const readBookIds = new Set(readHistory?.map(r => r.book_id) || []);
    const recommendedIds = new Set();

    // --- A. COLLABORATIVE FILTERING (RPC Call) ---
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

    // --- B. CONTENT-BASED FILTERING (Supabase Query) ---
    // Match favorite author OR favorite genres
    if (userProfile) {
      const { data: contentData } = await supabase
        .from('books')
        .select('id')
        .or(`author.eq.${userProfile.favourite_author},genre.in.(${userProfile.favourite_genres.join(',')})`)
        .limit(LIMIT);

      if (contentData) {
        contentData.forEach(row => {
          if (!readBookIds.has(row.id)) recommendedIds.add(row.id);
        });
      }
    }

    // --- C. TRENDING / FALLBACK (RPC Call) ---
    // If we don't have enough recs, fill with trending
    if (recommendedIds.size < 5) {
      const { data: trendingData } = await supabase
        .rpc('get_trending_books', { limit_count: LIMIT });
      
      if (trendingData) {
        trendingData.forEach(row => {
          if (!readBookIds.has(row.book_id)) recommendedIds.add(row.book_id);
        });
      }
    }

    // --- D. FINAL FETCH ---
    // We now have a list of IDs. Fetch the actual book details.
    if (recommendedIds.size === 0) return res.json([]);

    const { data: finalBooks, error: finalError } = await supabase
      .from('books')
      .select('id, title, author, genre, cover_image, summary, year')
      .in('id', Array.from(recommendedIds));

    if (finalError) throw finalError;

    // Optional: Shuffle the results
    const shuffled = finalBooks.sort(() => 0.5 - Math.random());

    return res.json(shuffled);

  } catch (error) {
    console.error('Recommendation Error:', error);
    return res.status(500).json({ error: 'Failed to generate recommendations' });
  }
}