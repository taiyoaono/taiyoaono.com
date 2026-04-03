import Anthropic from "@anthropic-ai/sdk";
import { RawCalendarEvent } from "./google-calendar";
import { USER_RULES } from "./calendar-rules";

export interface Outing {
  departure: string; // "HH:MM"
  return: string; // "HH:MM"
  destinations: string[];
}

export interface DayData {
  date: string; // "YYYY-MM-DD"
  outings: Outing[];
}

const SYSTEM_PROMPT = `あなたは、ユーザーのGoogleカレンダーの生イベントデータを受け取り、「親が見てわかる外出予定」に変換するアシスタントです。

## 目的
同居している親（特に母親）が「今日は何時に家を出て、何時に帰ってきて、どこに行くのか」を一目で把握できるようにする。

## カレンダーの読み方（ユーザー固有のルール）
- "mv" = 移動時間。家→目的地、目的地→目的地、目的地→家の移動を表す
- "睡眠" = 就寝時間。無視する
- "【朝タスク】" "【夜タスク】" = 家での日課。無視する
- "退出" = 家を出るタイミングのマーカー
- "解散" "作業開始" = その場でのマーカー。行き先名としては使わない
- eventType が "focusTime" のイベント = Google Tasksから来た個人タスク。無視する
- transparency が "transparent" のイベント = 背景リマインダー。無視する
- 終日イベント = 無視する
- "ジム1" "ジム2" "ジム3" 等のジム系 = 外出先に含めない（移動の途中で寄るだけ）
- アルファベット1〜2文字だけのイベント（"l", "p", "m" 等）= 個人メモ。無視する
- "job" で始まるイベント = バイト。行き先は「バイト」と表記
- Zoomリンクだけが場所のイベント = オンライン。物理的外出ではないので無視

## 外出の判定ロジック
1. "mv"イベントが外出の境界を示す。最初のmvの開始時刻 = 家を出る時刻、最後のmvの終了時刻 = 家に帰る時刻
2. 複数のmvに挟まれた一連のイベントは「1回の外出」としてまとめる（途中で別の場所に移動しても、家に帰らない限り1つの外出）
3. mvがない活動は家にいる（オンライン参加等）と判断し、外出として扱わない
4. 退出イベントがある場合、それが出発時刻になることがある（mvより前に退出がある場合）

## 行き先の要約ルール
- 10文字以内に収める
- 最大2つまで。一番重要な予定を優先
- 具体的な場所名か、活動の種類で表現（例: "本郷", "DeNA説明会", "歯科", "バイト"）
- 「説明会」「面接」「面談」「座談会」等は会社名+種類で短く（例: "DeNA説明会"）
- 「〇〇with誰々」→「〇〇」だけ（例: "夕飯"）
- フライト → 区間で表現（例: "奄美→成田"）
- @は付けない

## 出力形式
JSON配列で返す。各要素は1日分:
\`\`\`json
[
  {
    "date": "YYYY-MM-DD",
    "outings": [
      {
        "departure": "HH:MM",
        "return": "HH:MM",
        "destinations": ["場所1", "場所2"]
      }
    ]
  }
]
\`\`\`
- 外出がない日はoutingsを空配列にする
- 必ず指定された月の全日分を含める
- JSONのみを返し、他のテキストは含めない`;

// Simplify raw events to reduce token usage
function simplifyEvents(events: RawCalendarEvent[]): object[] {
  return events.map((e) => ({
    s: e.summary,
    loc: e.location || undefined,
    start: e.start.dateTime || e.start.date,
    end: e.end.dateTime || e.end.date,
    type: e.eventType || undefined,
    tr: e.transparency || undefined,
  }));
}

export async function parseEventsWithAI(
  rawEvents: RawCalendarEvent[],
  year: number,
  month: number
): Promise<DayData[]> {
  const client = new Anthropic();

  const simplified = simplifyEvents(rawEvents);

  const daysInMonth = new Date(year, month, 0).getDate();
  const userMessage = `以下は${year}年${month}月のGoogleカレンダーイベントです。このデータから、各日の外出予定を抽出してください。

${month}月は${daysInMonth}日まであります。全日分のデータを返してください。

イベントデータ:
${JSON.stringify(simplified, null, 0)}`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    system: SYSTEM_PROMPT + "\n\n" + USER_RULES,
    messages: [{ role: "user", content: userMessage }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("AI response did not contain valid JSON");
  }

  const parsed: DayData[] = JSON.parse(jsonMatch[0]);

  // Ensure all days are present
  const dayMap = new Map(parsed.map((d) => [d.date, d]));
  const result: DayData[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    result.push(dayMap.get(dateKey) || { date: dateKey, outings: [] });
  }

  return result;
}
