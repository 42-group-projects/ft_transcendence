CREATE OR REPLACE FUNCTION prevent_mutation_on_match_records()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'match_records is append-only: % is not allowed', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_update
BEFORE UPDATE ON match_records
FOR EACH ROW EXECUTE FUNCTION prevent_mutation_on_match_records();

CREATE TRIGGER prevent_delete
BEFORE DELETE ON match_records
FOR EACH ROW EXECUTE FUNCTION prevent_mutation_on_match_records();

CREATE INDEX idx_user_stats_rating_desc
ON user_stats (rating DESC, user_id ASC);

CREATE INDEX idx_match_records_player1_played_at_desc
ON match_records (player1_id, played_at DESC, id DESC);

CREATE INDEX idx_match_records_player2_played_at_desc
ON match_records (player2_id, played_at DESC, id DESC);