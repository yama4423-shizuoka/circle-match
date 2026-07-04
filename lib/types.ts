export interface Profile {
  id: string
  name: string
  grade: string
  affiliation: string
  hobbies: string | null
  created_at: string
}

export interface Group {
  id: string
  name: string
  invite_code: string
  admin_id: string
  created_at: string
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  joined_at: string
}

export interface Match {
  id: string
  group_id: string
  user1_id: string
  user2_id: string
  matched_at: string
  expires_at: string
}

export interface Message {
  id: string
  match_id: string
  sender_id: string
  content: string
  created_at: string
}

export const GRADES = [
  '中1', '中2', '中3',
  '高1', '高2', '高3',
  '大1', '大2', '大3', '大4',
  '大学院', 'その他',
]
