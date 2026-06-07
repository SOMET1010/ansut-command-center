ALTER TABLE public.live_poll_votes RENAME COLUMN voter_id TO participant_id;
ALTER TABLE public.live_poll_votes
  ADD CONSTRAINT live_poll_votes_poll_participant_uniq UNIQUE (poll_id, participant_id);
