# 開発プロンプト集 (PROMPTS.md)

本プロジェクトの開発において、AIエージェントに指示を出した主要なプロンプトの記録です。

### 1. 仕様の策定 (Plan)
> 「ブラウザのHTML/CSS/JSのみを使って、音声ファイルから文字起こし・要約・要点抽出を行うスマホ対応のWebアプリを作ります。APIはGemini APIを使い、キーはlocalStorageに保存します。この要件をもとに、最新のGemini APIの公式ドキュメントを検索し、画面の流れやエラー処理を含めた `SPEC.md` を作成してください。」

### 2. セキュアな認証ロジックの実装
> 「APIキーを安全に管理するための認証ロジックとUIを実装してください。アプリ起動時に `localStorage.getItem('geminiApiKey')` を確認し、ない場合は入力モーダルを表示、ある場合はメイン画面を表示するようにしてください。」

### 3. 要約と要点の同時抽出ロジック（JSONモード）
> 「提供された音声ファイルから『transcript（文字起こし）』『summary（3行要約）』『keypoints（3〜5個の要点）』を抽出し、必ず指定されたJSON形式で出力するようにプロンプトと設定（`responseMimeType: "application/json"`）を更新してください。」

### 4. 最新モデルへの移行（トラブルシューティング）
> 「現状、ファイルをアップロードすると『models/gemini-1.5-flash is not found for API version v1beta...』というエラーが起きます。使われているgemini-1.5-flashではなく、最新のgemini-3.5-flashに変更してください。」
> **採用した解決策:** APIのエンドポイント指定を `gemini-1.5-flash` から `gemini-3.5-flash` へ修正し、正常な動作を確認。