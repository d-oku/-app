# API連携ノート (API_NOTES.md)

## 1. 使用モデルとエンドポイント
開発初期は `gemini-1.5-flash` を想定していましたが、APIバージョン（v1beta）での非推奨・アクセスエラーを回避するため、最新かつ最速のモデルに変更しました。
- **採用モデル**: `gemini-3.5-flash`
- **エンドポイントURL**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent`

## 2. APIの制約とアプリ側の制限
- **通信方式**: Inline Data（Base64エンコード）による直接送信を採用。
- **ファイルサイズ上限**: API側のInline Data上限は100MBですが、ブラウザ上でのBase64変換処理の負荷やメモリクラッシュを防ぐため、アプリ側で **15MB** を上限として安全マージンを設けています。
- **対応フォーマット**: 公式サポートされているWAV, MP3, AIFF, AAC, OGG, FLACに加え、iOS（iPhone）の標準ボイスメモ等で録音される **M4A（`audio/mp4`）** も許可し、MIMEタイプを補完してAPIへ送信するよう実装しました。

## 3. JSON出力モードの活用（工夫点）
1回のリクエストで「全文文字起こし」「3行要約」「要点抽出」の3つの異なるタスクを確実に実行・分離するため、以下の設定を行っています。
- `responseMimeType: "application/json"` を指定。
- プロンプト内でJSONのキー名（`transcript`, `summary`, `keypoints`）を明示的に指示し、フロントエンド側で安全にパース（`JSON.parse()`）して各タブへ振り分けるロジックを構築しました。