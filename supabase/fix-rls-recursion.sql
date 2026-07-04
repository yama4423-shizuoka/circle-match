-- 再帰を起こしているポリシーを全て削除
DROP POLICY IF EXISTS "gm_same_group_read" ON group_members;
DROP POLICY IF EXISTS "gm_admin" ON group_members;
DROP POLICY IF EXISTS "groups_member_read" ON groups;
DROP POLICY IF EXISTS "profiles_same_group_read" ON profiles;
DROP POLICY IF EXISTS "matches_admin_read" ON matches;

-- SECURITY DEFINER 関数（RLSをバイパスするため再帰しない）
CREATE OR REPLACE FUNCTION get_my_group_ids()
RETURNS SETOF UUID LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT group_id FROM group_members WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_group_admin(gid UUID)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM groups WHERE id = gid AND admin_id = auth.uid());
$$;

-- ポリシーを関数ベースで再作成
CREATE POLICY "groups_member_read" ON groups
  FOR SELECT USING (id IN (SELECT get_my_group_ids()));

CREATE POLICY "gm_admin" ON group_members
  FOR ALL USING (is_group_admin(group_id));

CREATE POLICY "gm_same_group_read" ON group_members
  FOR SELECT USING (group_id IN (SELECT get_my_group_ids()));

CREATE POLICY "profiles_same_group_read" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT user_id FROM group_members
      WHERE group_id IN (SELECT get_my_group_ids())
    )
  );

CREATE POLICY "matches_admin_read" ON matches
  FOR SELECT USING (is_group_admin(group_id));
