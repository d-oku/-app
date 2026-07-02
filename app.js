// 解析開始ボタン (app.js の該当部分をこれに上書きしてください)
ui.btnProcess.addEventListener('click', async () => {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
        showError("APIキーが設定されていません。右上の設定ボタンから入力してください。");
        ui.modalSettings.classList.remove('hidden');
        return;
    }

    if (!currentFile) return;

    setLoadingState(true);
    hideError();

    try {
        const base64Audio = await fileToBase64(currentFile);
        const mimeType = currentFile.type || getMimeTypeFromName(currentFile.name);

        // APIを呼び出してJSON結果を取得
        const resultData = await callGeminiAPI(apiKey, base64Audio, mimeType);

        // 各テキストエリアに結果を代入
        ui.textareaTranscript.value = resultData.transcript || "文字起こしを取得できませんでした。";
        ui.textareaSummary.value = resultData.summary || "要約を取得できませんでした。";
        ui.textareaKeypoints.value = resultData.keypoints || "要点を取得できませんでした。";

        // 結果画面へ遷移
        ui.sectionUpload.classList.remove('active');
        ui.sectionResult.classList.add('active');

        // 📱 スマホ向け改善：結果セクションへスムーズに自動スクロール
        setTimeout(() => {
            ui.sectionResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

    } catch (err) {
        showError(err.message);
    } finally {
        setLoadingState(false);
    }
});