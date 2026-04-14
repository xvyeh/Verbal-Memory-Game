const fetchLeaderboard = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, elo, best_score')
    .order('elo', { ascending: false })
    .limit(10);
  
  setEntries(data);
};
