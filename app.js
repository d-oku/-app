// DOM要素の取得
const ui = {
    // ボタン
    btnOpenSettings: document.getElementById('open-settings-btn'),
    btnCloseSettings: document.getElementById('close-settings-btn'),
    btnSaveSettings: document.getElementById('save-settings-btn'),
    btnProcess: document.getElementById('process-btn'),
    btnRemoveFile: document.getElementById('remove-file-btn'),
    btnCopy: document.getElementById('copy-btn'),
    btnReset: document.getElementById('reset-btn'),

    // モーダル・セクション
    modalSettings: document.getElementById('settings-modal'),
    sectionUpload: document.getElementById('upload-section'),
    sectionResult: document.getElementById('result-section'),

    // 入力・表示要素
    inputApiKey: document.getElementById('api-key'),
    inputAudioFile: document.getElementById('audio-file'),
    dropZone: document.getElementById('drop-zone'),
    fileInfo: document.getElementById('file-info'),
    fileName: document.getElementById('file-name'),
    fileSize: document.getElementById('file-size'),
    errorMessage: document.getElementById('error-message'),
    errorText: document.getElementById('error-text'),

    // タブ関連
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    textareaTranscript: document.querySelector('#transcript textarea'),
    textareaSummary: document.querySelector('#summary textarea'),
    textareaKeypoints: document.querySelector('#keypoints textarea'),

    // ローディング
    btnText: document.querySelector('#process-btn .btn-text'),
    loader: document.querySelector('#process-btn .loader')
};

// 状態管理
let currentFile = null;
const MAX_FILE_SIZE_MB = 15;

// 初期化処理
function init() {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
        ui.inputApiKey.value = savedKey;
    } else {
        ui.modalSettings.classList.remove('hidden');
    }
}

// --- UIイベントリスナー ---
ui.btnOpenSettings.addEventListener('click', () => {
    ui.modalSettings.classList.remove('hidden');
});
ui.btnCloseSettings.addEventListener('click', () => {
    ui.modalSettings.classList.add('hidden');
});
ui.btnSaveSettings.addEventListener('click', () => {
    const key = ui.inputApiKey.value.trim();
    if (key) {
        localStorage.setItem('gemini_api_key', key);
        ui.modalSettings.classList.add('hidden');
        hideError();
    } else {
        alert("APIキーを入力してください。");
    }
});

ui.dropZone.addEventListener('click', () => {
    ui.inputAudioFile.click();
});

ui.dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    ui.dropZone.classList.add('dragover');
});
ui.dropZone.addEventListener('dragleave', () => {
    ui.dropZone.classList.remove('dragover');
});
ui.dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    ui.dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
    }
});

ui.inputAudioFile.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
});

function handleFileSelect(file) {
    hideError();
    const validTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/aiff', 'audio/aac', 'audio/ogg', 'audio/flac', 'audio/x-m4a'];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(wav|mp3|aiff|aac|ogg|flac|m4a)$/i)) {
        showError("サポートされていないファイル形式です。");
        return;
    }

    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > MAX_FILE_SIZE_MB) {
        showError(`ファイルサイズが大きすぎます（上限: ${MAX_FILE_SIZE_MB}MB）。現在: ${sizeMB.toFixed(1)}MB`);
        return;
    }

    currentFile = file;
    ui.dropZone.style.display = 'none';
    ui.fileInfo.classList.remove('hidden');
    ui.fileName.textContent = file.name;
    ui.fileSize.textContent = sizeMB.toFixed(2) + " MB";
    ui.btnProcess.disabled = false;
}

ui.btnRemoveFile.addEventListener('click', () => {
    ui.inputAudioFile.value = '';
    currentFile = null;
    ui.fileInfo.classList.add('hidden');
    ui.dropZone.style.display = 'flex';
    ui.btnProcess.disabled = true;
    hideError();
});

// 解析開始ボタン (スマホスクロール対応版)
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

        const resultData = await callGeminiAPI(apiKey, base64Audio, mimeType);

        ui.textareaTranscript.value = resultData.transcript || "文字起こしを取得できませんでした。";
        ui.textareaSummary.value = resultData.summary || "要約を取得できませんでした。";
        ui.textareaKeypoints.value = resultData.keypoints || "要点を取得できませんでした。";

        ui.sectionUpload.classList.remove('active');
        ui.sectionResult.classList.add('active');

        setTimeout(() => {
            ui.sectionResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

    } catch (err) {
        showError(err.message);
    } finally {
        setLoadingState(false);
    }
});

ui.btnReset.addEventListener('click', () => {
    ui.sectionResult.classList.remove('active');
    ui.sectionUpload.classList.add('active');
    ui.btnRemoveFile.click();
    ui.textareaTranscript.value = "";
    ui.textareaSummary.value = "";
    ui.textareaKeypoints.value = "";
});

ui.btnCopy.addEventListener('click', () => {
    const activeTextarea = document.querySelector('.tab-content.active textarea');
    if (activeTextarea && activeTextarea.value) {
        navigator.clipboard.writeText(activeTextarea.value).then(() => {
            const originalText = ui.btnCopy.innerHTML;
            ui.btnCopy.innerHTML = '<span class="material-symbols-outlined">check</span> コピー完了';
            setTimeout(() => {
                ui.btnCopy.innerHTML = originalText;
            }, 2000);
        });
    }
});

ui.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        ui.tabBtns.forEach(b => b.classList.remove('active'));
        ui.tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
    });
});

function showError(msg) {
    ui.errorText.textContent = msg;
    ui.errorMessage.classList.remove('hidden');
}

function hideError() {
    ui.errorMessage.classList.add('hidden');
}

function setLoadingState(isLoading) {
    if (isLoading) {
        ui.btnText.textContent = "解析中...";
        ui.loader.classList.remove('hidden');
        ui.btnProcess.disabled = true;
    } else {
        ui.btnText.textContent = "解析を開始する";
        ui.loader.classList.add('hidden');
        ui.btnProcess.disabled = false;
    }
}

function getMimeTypeFromName(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const map = {
        'mp3': 'audio/mp3', 'wav': 'audio/wav', 'aac': 'audio/aac',
        'ogg': 'audio/ogg', 'flac': 'audio/flac', 'aiff': 'audio/aiff', 'm4a': 'audio/mp4'
    };
    return map[ext] || 'audio/mp3';
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            const base64Data = result.split(',')[1];
            resolve(base64Data);
        };
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

async function callGeminiAPI(apiKey, base64Audio, mimeType) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

    const requestBody = {
        contents: [{
            parts: [
                {
                    text: `提供された音声ファイルから以下の3つを抽出し、必ず指定されたJSON形式で出力してください。
1. transcript: 音声の一言一句正確な文字起こし（全文）
2. summary: 内容の3行要約
3. keypoints: 重要なポイント（3〜5個の箇条書き。配列ではなく改行を含む1つのテキストとして出力）

JSONキー名: "transcript", "summary", "keypoints"`
                },
                {
                    inlineData: { mimeType: mimeType, data: base64Audio }
                }
            ]
        }],
        generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json"
        }
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
        let errorMsg = "API呼び出しに失敗しました。";
        if (data.error && data.error.message) {
            errorMsg = `APIエラー: ${data.error.message}`;
            if (data.error.code === 400 && data.error.message.includes("API key not valid")) {
                errorMsg = "APIキーが無効です。設定を確認してください。";
            }
        }
        throw new Error(errorMsg);
    }

    if (data.candidates && data.candidates.length > 0) {
        const textResponse = data.candidates[0].content.parts[0].text;
        try {
            return JSON.parse(textResponse);
        } catch (e) {
            console.error("JSONパースエラー:", textResponse);
            throw new Error("APIからの応答データの解析に失敗しました。");
        }
    } else {
        throw new Error("APIから有効な結果が返されませんでした。");
    }
}

// 初期化実行
init();