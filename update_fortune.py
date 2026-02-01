import requests
import os
import json
import re
import datetime

def get_ai_fortune():
    # 日本語性能が高いモデルを指定
    MODEL_ID = "google/gemma-2-9b-it" # モデルIDを定義
    API_URL = f"https://api-inference.huggingface.co/models/{MODEL_ID}" # 新しいURLに変更
    hf_token = os.getenv("HF_TOKEN")
    if not hf_token:
        print("Error: HF_TOKEN environment variable not set.")
        # トークンがない場合はNoneを返し、後続処理でフォールバックさせる
        return None 

    headers = {"Authorization": f"Bearer {hf_token}"} # ★このように変更！
    
    #今日の日付を指定してプロンプトに含める
    today = datetime.date.today().strftime("%Y年%m月%d日")

    payload = {
        "model": "google/gemma-2-9b-it",
        "inputs": f"""
あなたは、世界で一番美しく、かつ鋭い的中率を誇る占星術師です。
**{today}**の12星座占いを生成してください。
※テスト用にこの文章を追加しました

【出力ルール】
1. 形式は必ずJSONのみ：{{"星座名": {{"rank": 順位, "text": "占い文", "lucky": "アイテム"}}}}
2. 順位（rank）が下位（10位〜12位）の星座ほど、以下のことを徹底してください：
   - 決して突き放さず、寄り添うような優しい口調にすること。
   - 「今日はデトックスに最適」「今は力を蓄える時期」など、ポジティブな言い換えをすること。
   - 最後に必ず「大丈夫、明日はもっと良くなるよ」というニュアンスの励ましを入れること。
3. 専門用語（例：ハウス、逆行、アスペクトなど）を1つ混ぜて、バーナム効果を活かした「本格的」な文章にすること。

星座：牡羊座、金牛座、双子座、蟹座、獅子座、乙女座、天秤座、蠍座、射手座、山羊座、水瓶座、魚座
""",
        "parameters": {
            "max_new_tokens": 1000,
            "temperature": 0.8,
            "return_full_text": False
        }
    }
    
    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        
        if response.status_code == 200:
            result = response.json()
            if isinstance(result, list) and len(result) > 0:
                generated_text = result[0].get('generated_text', '')
                
                # JSON部分を抽出
                json_match = re.search(r'\{.*\}', generated_text, re.DOTALL)
                if json_match:
                    json_str = json_match.group()
                    # バリデーション
                    parsed = json.loads(json_str)
                    return json.dumps(parsed, ensure_ascii=False, indent=2)
                    
        print(f"API Error: {response.status_code} - {response.text}")
        return None
        
    except Exception as e:
        print(f"Error: {e}")
        return None

# フォールバックデータ
def get_fallback_fortune():
    return json.dumps({
        "牡羊座": {"rank": 1, "text": "太陽が第1ハウスに入り、新しい始まりに最適な日です。行動力が高まり、目標達成への近道になります。", "lucky": "赤いアクセサリー"},
        "金牛座": {"rank": 2, "text": "金星の恩恵を受け、安定感と調和がもたらされます。財運も上向きで、投資のチャンスです。", "lucky": "緑の植物"},
        "双子座": {"rank": 3, "text": "水星の影響でコミュニケーション能力が向上。新しい出会いや学びの機会に恵まれます。", "lucky": "青いペン"},
        "蟹座": {"rank": 4, "text": "月の守護により、感情の機微が鋭くなります。家族との時間が大切になる一日です。", "lucky": "白い石"},
        "獅子座": {"rank": 5, "text": "太陽が輝き、自信と魅力が最大限に発揮されます。リーダーシップが求められる場面で活躍できます。", "lucky": "金色のアイテム"},
        "乙女座": {"rank": 6, "text": "水星の分析力が冴え、細部まで気配りできる日です。仕事の効率が上がり、評価も高まります。", "lucky": "銀のアクセサリー"},
        "天秤座": {"rank": 7, "text": "金星のバランス感覚が働き、人間関係の調整役として活躍できます。美しいものに惹かれます。", "lucky": "ピンクの花"},
        "蠍座": {"rank": 8, "text": "冥王星の変革エネルギーにより、深い洞察力が得られます。隠された真実に気づくかもしれません。", "lucky": "黒いクリスタル"},
        "射手座": {"rank": 9, "text": "木星の拡大エネルギーで、冒険心が刺激されます。新しい知識や経験が人生を豊かにします。", "lucky": "紫色の本"},
        "山羊座": {"rank": 10, "text": "土星の試練の時期ですが、これは成長のための大切な期間です。今は力を蓄えるのに最適です。大丈夫、明日はもっと良くなるよ。", "lucky": "茶色の財布"},
        "水瓶座": {"rank": 11, "text": "天王星の革新エネルギーが、新しいアイデアをもたらします。周囲を驚かせるような発見があるかもしれません。大丈夫、明日はもっと良くなるよ。", "lucky": "水色のガジェット"},
        "魚座": {"rank": 12, "text": "海王星の影響で感受性が豊かになります。今日はデトックスに最適な日です。芸術や音楽に触れることで心が癒されます。大丈夫、明日はもっと良くなるよ。", "lucky": "水色のアクセサリー"}
    }, ensure_ascii=False, indent=2)

# メイン処理
print("占いデータを取得中...")
fortune_json = get_ai_fortune()

if fortune_json:
    print("APIから取得成功")
    with open("fortune.json", "w", encoding="utf-8") as f:
        f.write(fortune_json)
else:
    print("APIから取得できませんでした。フォールバックデータを使用します。")
    fallback_data = get_fallback_fortune()
    with open("fortune.json", "w", encoding="utf-8") as f:
        f.write(fallback_data)

print("fortune.jsonを更新しました")
