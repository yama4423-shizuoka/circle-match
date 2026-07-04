-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Tables ──────────────────────────────────────────────────────────────

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  grade       TEXT NOT NULL,
  affiliation TEXT NOT NULL,
  hobbies     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE groups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  admin_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_members (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id  UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);
CREATE INDEX ON group_members (group_id);
CREATE INDEX ON group_members (user_id);

CREATE TABLE matches (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id   UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user1_id   UUID NOT NULL REFERENCES auth.users(id),
  user2_id   UUID NOT NULL REFERENCES auth.users(id),
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX ON matches (user1_id, expires_at);
CREATE INDEX ON matches (user2_id, expires_at);
CREATE INDEX ON matches (group_id, matched_at);

CREATE TABLE messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id   UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES auth.users(id),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON messages (match_id, created_at);

-- ─── RLS ─────────────────────────────────────────────────────────────────

ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups       ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches      ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages     ENABLE ROW LEVEL SECURITY;

-- profiles: own CRUD
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (id = auth.uid());

-- profiles: same-group members can read each other
CREATE POLICY "profiles_same_group_read" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid() AND gm2.user_id = profiles.id
    )
  );

-- groups: admin full access
CREATE POLICY "groups_admin" ON groups
  FOR ALL USING (admin_id = auth.uid());

-- groups: members can read
CREATE POLICY "groups_member_read" ON groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = groups.id AND user_id = auth.uid()
    )
  );

-- groups: anyone can read by invite_code (for join page)
CREATE POLICY "groups_invite_read" ON groups
  FOR SELECT USING (true);

-- group_members: admin can manage their group
CREATE POLICY "gm_admin" ON group_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE id = group_members.group_id AND admin_id = auth.uid()
    )
  );

-- group_members: users can see their own memberships
CREATE POLICY "gm_own_read" ON group_members
  FOR SELECT USING (user_id = auth.uid());

-- group_members: users can read members of same group
CREATE POLICY "gm_same_group_read" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members gm2
      WHERE gm2.group_id = group_members.group_id AND gm2.user_id = auth.uid()
    )
  );

-- group_members: users can join (insert themselves)
CREATE POLICY "gm_join" ON group_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- matches: participants can read
CREATE POLICY "matches_participant_read" ON matches
  FOR SELECT USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- matches: admin can read their group's matches
CREATE POLICY "matches_admin_read" ON matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE id = matches.group_id AND admin_id = auth.uid()
    )
  );

-- messages: participants can read (including expired chats)
CREATE POLICY "messages_read" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE id = messages.match_id
        AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

-- messages: participants can write only while chat is active
CREATE POLICY "messages_write" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM matches
      WHERE id = messages.match_id
        AND (user1_id = auth.uid() OR user2_id = auth.uid())
        AND expires_at > NOW()
    )
  );

-- ─── Realtime ─────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
