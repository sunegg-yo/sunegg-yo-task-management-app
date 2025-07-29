// Firebaseの設定 (Firebaseコンソールからコピーしたものをここに貼り付ける)
// 例:
const firebaseConfig = {
    apiKey: "AIzaSyAYwlHSctrgE0tGg3RM1cwOXZfq6XwtRi0",
    authDomain: "task-management-app-32432.firebaseapp.com",
    projectId: "task-management-app-32432",
    storageBucket: "task-management-app-32432.firebasestorage.app",
    messagingSenderId: "1048413736807",
    appId: "1:1048413736807:web:402e483312b515dd9129c2",
    measurementId: "G-W0THE0EZPG"
};

// Firebaseの初期化
firebase.initializeApp(firebaseConfig);

// Firestoreのインスタンスを取得
const db = firebase.firestore();

// 認証機能のインスタンスを取得 (まだ使いませんが、今後のために)
const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', () => {
    // ... 既存のコード ...
});



document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('task-form');
    const taskTitleInput = document.getElementById('task-title');
    const taskDescriptionInput = document.getElementById('task-description');
    const taskListDiv = document.getElementById('task-list');
    const loginButton = document.getElementById('login-button');
    const authStatusParagraph = document.getElementById('auth-status').querySelector('p');
    const taskInputSection = document.getElementById('task-input'); // 新しく追加
    const taskListSection = document.getElementById('task-list-section'); // 新しく追加

    // アプリ初期化時のUI状態設定
    function updateUIForAuthStatus(isLoggedIn) {
        if (isLoggedIn) {
            authStatusParagraph.textContent = 'ログイン済み (仮)';
            loginButton.style.display = 'none';
            taskInputSection.style.display = 'block'; // ログインしたら表示
            taskListSection.style.display = 'block'; // ログインしたら表示
            loadTasks(); // ログイン後にタスクを読み込む
        } else {
            authStatusParagraph.textContent = '未ログイン';
            loginButton.style.display = 'block';
            taskInputSection.style.display = 'none'; // 未ログイン時は非表示
            taskListSection.style.display = 'none'; // 未ログイン時は非表示
        }
    }

    // --- 認証関連の処理 (Cloud Run API連携) ---
    loginButton.addEventListener('click', async () => {
        const username = prompt('ユーザー名を入力してください (例: user):', 'user');
        const password = prompt('パスワードを入力してください (例: password):', 'password');

        if (!username || !password) {
            alert('ユーザー名とパスワードは必須です。');
            return;
        }

        authStatusParagraph.textContent = 'ログイン中...';
        loginButton.disabled = true; // ボタンを無効化

        try {
            const CLOUD_RUN_API_URL = 'https://auth-api-1048413736807.asia-northeast1.run.app/api/auth/login';

            const response = await fetch(CLOUD_RUN_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 将来的に認証トークンなどを送る場合はここに追加
                },
                body: JSON.stringify({ username: username, password: password })
            });

            if (response.ok) { // HTTPステータスコードが200番台の場合
                const data = await response.json();
                console.log('ログイン成功:', data);
                updateUIForAuthStatus(true); // UIを更新してログイン状態にする
                alert('ログインに成功しました！');
            } else {
                const errorData = await response.json();
                console.error('ログイン失敗:', errorData);
                alert(`ログインに失敗しました: ${errorData.message || response.statusText}`);
                updateUIForAuthStatus(false); // ログイン失敗なので未ログイン状態に戻す
            }
        } catch (error) {
            console.error('API呼び出し中にエラーが発生しました:', error);
            alert('API呼び出し中にエラーが発生しました。ネットワーク接続を確認してください。');
            updateUIForAuthStatus(false);
        } finally {
            loginButton.disabled = false; // ボタンを再度有効化
        }
    });

    // --- タスク追加フォームの送信処理 (既存のFirebase連携コード) ---
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = taskTitleInput.value.trim();
        const description = taskDescriptionInput.value.trim();

        if (title) {
            try {
                await db.collection('tasks').add({
                    title: title,
                    description: description,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                taskTitleInput.value = '';
                taskDescriptionInput.value = '';

            } catch (error) {
                console.error("Error adding document: ", error);
                alert("タスクの追加中にエラーが発生しました。");
            }
        } else {
            alert('タスクのタイトルは必須です！');
        }
    });

    // --- DOMにタスクを追加する関数 (既存のFirebase連携コード) ---
    function addTaskToDOM(task) {
        const taskItem = document.createElement('div');
        taskItem.classList.add('task-item');
        taskItem.setAttribute('data-id', task.id);

        taskItem.innerHTML = `
            <h3>${task.title}</h3>
            <p>${task.description || '詳細なし'}</p>
            <p style="font-size: 0.8em; color: #888;">作成日時: ${task.createdAt ? new Date(task.createdAt.toDate()).toLocaleString() : '不明'}</p>
            <div class="task-actions">
                <button class="edit-button">編集</button>
                <button class="delete-button">削除</button>
            </div>
        `;

        //編集ボタン
        taskItem.querySelector('.edit-button').addEventListener('click', async () => {
            const newTitle = prompt('新しいタスクのタイトルを入力してください:', task.title);
            if (newTitle !== null && newTitle.trim() !== '') {
                try {
                    await db.collection('tasks').doc(task.id).update({
                        title: newTitle.trim()
                    });
                } catch (error) {
                    console.error("Error updating document: ", error);
                    alert("タスクの更新中にエラーが発生しました。");
                }
            } else if (newTitle !== null) {
                alert('タイトルは空にできません。');
            }
        });

        //削除ボタン
        taskItem.querySelector('.delete-button').addEventListener('click', async () => {
            if (confirm(`タスク「${task.title}」を削除してもよろしいですか？`)) {
                try {
                    await db.collection('tasks').doc(task.id).delete();
                } catch (error) {
                    console.error("Error removing document: ", error);
                    alert("タスクの削除中にエラーが発生しました。");
                }
            }
        });

        taskListDiv.prepend(taskItem);
    }

    // --- アプリの初期化時にタスクをロードする処理 (既存のFirebase連携コード) ---
    async function loadTasks() {
        taskListDiv.innerHTML = '';

        try {
            db.collection('tasks').orderBy('createdAt', 'desc')
                .onSnapshot((snapshot) => {
                    taskListDiv.innerHTML = '';
                    if (snapshot.empty) {
                        taskListDiv.innerHTML = '<p>タスクがありません。</p>';
                        return;
                    }

                    snapshot.forEach(doc => {
                        const task = doc.data();
                        task.id = doc.id;
                        addTaskToDOM(task);
                    });
                }, (error) => {
                    console.error("Error fetching tasks: ", error);
                    alert("タスクの読み込み中にエラーが発生しました。");
                });

        } catch (error) {
            console.error("Error setting up task listener: ", error);
            alert("タスクの読み込み設定中にエラーが発生しました。");
        }
    }

    // アプリ起動時に認証状態に応じてUIを更新
    updateUIForAuthStatus(false); // 初期状態は未ログイン
});