-- 체크리스트 테이블 생성
CREATE TABLE IF NOT EXISTS checklist (
  id BIGSERIAL PRIMARY KEY,
  person VARCHAR(50) NOT NULL CHECK (person IN ('성진', '지열', '성동')),
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 업데이트 시간 자동 갱신을 위한 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS update_checklist_updated_at ON checklist;
CREATE TRIGGER update_checklist_updated_at
  BEFORE UPDATE ON checklist
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_checklist_person ON checklist(person);
CREATE INDEX IF NOT EXISTS idx_checklist_created_at ON checklist(created_at DESC);

-- RLS (Row Level Security) 활성화
ALTER TABLE checklist ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기, 쓰기, 수정, 삭제 가능하도록 정책 설정
CREATE POLICY "Enable read access for all users" ON checklist
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON checklist
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON checklist
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON checklist
  FOR DELETE USING (true);
