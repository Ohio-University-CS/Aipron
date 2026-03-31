-- Conversations table (chat sessions)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) DEFAULT 'New Chat',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation messages
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON conversation_messages(created_at);

-- Auto-update updated_at
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON conversations FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own conversation messages" ON conversation_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversations WHERE conversations.id = conversation_messages.conversation_id AND conversations.user_id = auth.uid())
  );
CREATE POLICY "Users can create conversation messages" ON conversation_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM conversations WHERE conversations.id = conversation_messages.conversation_id AND conversations.user_id = auth.uid())
  );
CREATE POLICY "Users can delete own conversation messages" ON conversation_messages
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM conversations WHERE conversations.id = conversation_messages.conversation_id AND conversations.user_id = auth.uid())
  );
