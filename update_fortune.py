import os
import requests
import json
import re
import datetime

# フォールバックデータ生成関数
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

# AI占いデータ取得関数
def get_ai_fortune():
    # 正しいHuggingFace推論APIエンドポイント
    API_URL = "https://router.huggingface.co/models/google/gemma-2-9b-it"
    
    hf_token = os.getenv("HF_TOKEN")
    if not hf_token:
        print("Error: HF_TOKEN environment variable not set.")
        return None 

    headers = {
        "Authorization": f"Bearer {hf_token}",
        "Content-Type": "application/json"
    }
    
    today = datetime.date.today().strftime("%Y年%m%d日")
    
    user_prompt = f"""
あなたは、世界で一番美しく、かつ鋭い的中率を誇る占星術師です。
**{today}**の12星座占いを生成してください。

【出力ルール】
1. 形式は必ずJSONのみ：{{"星座名": {{"rank": 順位, "text": "占い文", "lucky": "アイテム"}}}}
2. 順位（rank）が下位（10位〜12位）の星座ほど、決して突き放さず、寄り添うような優しい口調にすること。
3. 専門用語を混ぜて本格的な文章にすること。

星座：牡羊座、金牛座、双子座、蟹座、獅子座、乙女座、天秤座、蠍座、射手座、山羊座、水瓶座、魚座
"""

    payload = {
        "inputs": user_prompt,
        "parameters": {
            "temperature": 0.8,
            "max_new_tokens": 1000
        }
    }
    
    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        response.raise_for_status() 
        response_json = response.json()
        
        # レスポンスから生成テキストを抽出
        if isinstance(response_json, list) and len(response_json) > 0:
            generated_text = response_json[0].get("generated_text", "")
        else:
            generated_text = response_json.get("generated_text", "")
        
        # JSONブロックを抽出（```json ... ```形式の場合）
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', generated_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            json_str = generated_text
        
        # JSON文字列をパースして検証
        parsed = json.loads(json_str)
        return json.dumps(parsed, ensure_ascii=False, indent=2)
        
    except requests.exceptions.HTTPError as e:
        print(f"API HTTP Error: {response.status_code} - {response.text}")
        return None
    except json.JSONDecodeError as e:
        print(f"JSON Parse Error: {e}")
        print(f"Response content: {generated_text[:200]}")
        return None
    except Exception as e:
        print(f"API Error: {e}")
        return None

# メイン処理
if __name__ == "__main__":
    print("占いデータを取得中...")
    fortune_json_string = get_ai_fortune()

    if fortune_json_string:
        print("APIから取得成功")
        # APIからはJSON文字列が返ってくるので、そのままファイルに書き込む
        with open("fortune.json", "w", encoding="utf-8") as f:
            f.write(fortune_json_string)
    else:
        print("APIから取得できませんでした。フォールバックデータを使用します。")
        fallback_data_string = get_fallback_fortune()
        with open("fortune.json", "w", encoding="utf-8") as f:
            f.write(fallback_data_string)

    print("fortune.jsonを更新しました")
