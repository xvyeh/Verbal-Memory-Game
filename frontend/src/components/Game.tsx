const fetchNewWord = async () => {
  setLoading(true);
  try {
    // This trick gets 1 random word from the table
    const { data, error } = await supabase
      .from('words')
      .select('word')
      .limit(1)
      .single(); // You can add logic for 'order by random()' via an RPC if needed

    if (data) setCurrentWord(data.word);
  } catch (error) {
    console.error('Failed to fetch word', error);
  } finally {
    setLoading(false);
  }
};
