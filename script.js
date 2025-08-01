const CLOUD_RUN_API_BASE_URL = 'https://auth-api-1048413736807.asia-northeast1.run.app';

// Firebaseの設定と初期化を関数化
async function initializeFirebase() {
    try {
        // APIからAPIキーを取得
        const response = await fetch(`${CLOUD_RUN_API_BASE_URL}/api/config/firebase`);
        if (!response.ok) {
            throw new Error('Failed to fetch Firebase API key from backend.');
        }
        const config = await response.json();

        const firebaseConfig = {
            apiKey: config.apiKey, // APIから取得したキーを使用
            authDomain: "task-management-app-32432.firebaseapp.com",
            projectId: "task-management-app-32432",
            storageBucket: "task-management-app-32432.firebasestorage.app",
            messagingSenderId: "1048413736807",
            appId: "1:1048413736807:web:402e483312b515dd9129c2",
            measurementId: "G-W0THE0EZPG"
        };

        // Firebaseの初期化
        firebase.initializeApp(firebaseConfig);
        return firebase.firestore();

    } catch (error) {
        console.error("Error initializing Firebase: ", error);
        alert("Firebaseの初期化に失敗しました。");
        return null;
    }
}

// アプリケーションのエントリーポイント
document.addEventListener('DOMContentLoaded', async () => {
    // Firebaseを初期化し、dbインスタンスを取得
    const db = await initializeFirebase();
    if (!db) return; // 初期化失敗の場合は処理を中断

    const taskForm = document.getElementById('task-form');
    const taskTitleInput = document.getElementById('task-title');
    const taskDescriptionInput = document.getElementById('task-description');
    const taskDueDateInput = document.getElementById('task-due-date'); // ★追加
    const taskCategoryInput = document.getElementById('task-category'); // ★追加
    const taskListDiv = document.getElementById('task-list');

    const usernameInput = document.getElementById('username-input');
    const passwordInput = document.getElementById('password-input');
    const loginButton = document.getElementById('login-button');
    const registerButton = document.getElementById('register-button');
    const authStatusParagraph = document.getElementById('auth-status').querySelector('p');
    const authSection = document.getElementById('auth-section');
    const loginFormContainer = document.getElementById('login-form-container');

    const taskInputSection = document.getElementById('task-input');
    const taskListSection = document.getElementById('task-list-section');

    // ★ログインしているユーザーのIDを保持する変数★
    let currentUserId = null;

    // UIの状態を更新する関数
    function updateUIForAuthStatus(isLoggedIn, username = '') {
        if (isLoggedIn) {
            authStatusParagraph.textContent = `ログイン済み: ${username}`; // ユーザー名を表示
            loginFormContainer.style.display = 'none';
            authSection.style.display = 'block';
            taskInputSection.style.display = 'block';
            taskListSection.style.display = 'block';
            loadTasks(); // ログインしたらタスクをロード
        } else {
            authStatusParagraph.textContent = '未ログイン';
            loginFormContainer.style.display = 'block';
            authSection.style.display = 'block';
            taskInputSection.style.display = 'none';
            taskListSection.style.display = 'none';
            currentUserId = null; // ログアウト時はユーザーIDをクリア
            taskListDiv.innerHTML = '<p>タスクがありません。</p>'; // タスクリストをクリア
        }
    }

    // --- 認証関連の処理 ---

    // ログイン処理
    loginButton.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            alert('ユーザー名とパスワードを入力してください。');
            return;
        }

        authStatusParagraph.textContent = 'ログイン中...';
        loginButton.disabled = true;
        registerButton.disabled = true;

        try {
            const response = await fetch(`${CLOUD_RUN_API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: username, password: password })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('ログイン成功:', data);
                currentUserId = username; // ログイン成功時にユーザーIDを設定
                updateUIForAuthStatus(true, username);
                alert('ログインに成功しました！');
                // 入力フィールドをクリア
                usernameInput.value = '';
                passwordInput.value = '';
            } else {
                const errorData = await response.json();
                console.error('ログイン失敗:', errorData);
                alert(`ログインに失敗しました: ${errorData.message || response.statusText}`);
                updateUIForAuthStatus(false);
            }
        } catch (error) {
            console.error('API呼び出し中にエラーが発生しました:', error);
            alert('API呼び出し中にエラーが発生しました。ネットワーク接続を確認してください。');
            updateUIForAuthStatus(false);
        } finally {
            loginButton.disabled = false;
            registerButton.disabled = false;
        }
    });

    // 新規登録処理
    registerButton.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            alert('ユーザー名とパスワードを入力してください。');
            return;
        }

        authStatusParagraph.textContent = '登録中...';
        loginButton.disabled = true;
        registerButton.disabled = true;

        try {
            const response = await fetch(`${CLOUD_RUN_API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: username, password: password })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('登録成功:', data);
                alert('新規登録に成功しました！ログインしてください。');
                authStatusParagraph.textContent = '未ログイン';
            } else {
                const errorData = await response.json();
                console.error('登録失敗:', errorData);
                alert(`登録に失敗しました: ${errorData.message || response.statusText}`);
            }
        } catch (error) {
            console.error('API呼び出し中にエラーが発生しました:', error);
            alert('API呼び出し中にエラーが発生しました。ネットワーク接続を確認してください。');
        } finally {
            loginButton.disabled = false;
            registerButton.disabled = false;
        }
    });

    // --- タスク追加フォームの送信処理 (既存のFirebase連携コードを更新) ---
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentUserId) { // ログインしていない場合はタスクを追加できない
            alert('タスクを追加するにはログインしてください。');
            return;
        }

        const title = taskTitleInput.value.trim();
        const description = taskDescriptionInput.value.trim();
        const dueDate = taskDueDateInput.value; // YYYY-MM-DD 形式の文字列
        const category = taskCategoryInput.value.trim();

        if (title) {
            try {
                await db.collection('tasks').add({
                    userId: currentUserId, // ★ユーザーIDを保存★
                    title: title,
                    description: description,
                    status: 'pending', // ★初期ステータスを追加★
                    dueDate: dueDate ? firebase.firestore.Timestamp.fromDate(new Date(dueDate)) : null, // ★期日を追加★
                    category: category || '', // ★カテゴリを追加★
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // 入力フィールドをクリア
                taskTitleInput.value = '';
                taskDescriptionInput.value = '';
                taskDueDateInput.value = ''; // クリア
                taskCategoryInput.value = ''; // クリア

            } catch (error) {
                console.error("Error adding document: ", error);
                alert("タスクの追加中にエラーが発生しました。");
            }
        } else {
            alert('タスクのタイトルは必須です！');
        }
    });

    // --- DOMにタスクを追加する関数 (更新) ---
    function addTaskToDOM(task) {
        const taskItem = document.createElement('div');
        taskItem.classList.add('task-item');
        // ★ステータスに基づいてクラスを追加★
        if (task.status === 'completed') {
            taskItem.classList.add('completed');
        }
        taskItem.setAttribute('data-id', task.id);

        // 期日のフォーマット
        const formattedDueDate = task.dueDate ? new Date(task.dueDate.toDate()).toLocaleDateString() : 'なし';

        taskItem.innerHTML = `
            <input type="checkbox" class="task-status-checkbox" ${task.status === 'completed' ? 'checked' : ''}>
            <h3>${task.title}</h3>
            <p>${task.description || '詳細なし'}</p>
            <p class="task-meta">
                <span>期日: ${formattedDueDate}</span><br>
                <span>カテゴリ: ${task.category || 'なし'}</span><br>
                <span>作成日時: ${task.createdAt ? new Date(task.createdAt.toDate()).toLocaleString() : '不明'}</span>
            </p>
            <div class="task-actions">
                <button class="edit-button">編集</button>
                <button class="delete-button">削除</button>
            </div>
        `;

        // ★ステータス変更のイベントリスナーを追加★
        taskItem.querySelector('.task-status-checkbox').addEventListener('change', async (e) => {
            const newStatus = e.target.checked ? 'completed' : 'pending';
            try {
                await db.collection('tasks').doc(task.id).update({
                    status: newStatus
                });
            } catch (error) {
                console.error("Error updating task status: ", error);
                alert("タスクステータスの更新中にエラーが発生しました。");
            }
        });

        taskItem.querySelector('.edit-button').addEventListener('click', async () => {
            // 編集フォームをより詳細にするか、プロンプトで複数のフィールドを編集するか検討
            const newTitle = prompt('新しいタスクのタイトルを入力してください:', task.title);
            if (newTitle !== null && newTitle.trim() !== '') {
                try {
                    await db.collection('tasks').doc(task.id).update({
                        title: newTitle.trim()
                        // ★★★ ここに他のフィールドの編集ロジックを追加可能 ★★★
                        // 例えば、期日やカテゴリも編集できるようにする
                    });
                } catch (error) {
                    console.error("Error updating document: ", error);
                    alert("タスクの更新中にエラーが発生しました。");
                }
            } else if (newTitle !== null) {
                alert('タイトルは空にできません。');
            }
        });

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

    // --- アプリの初期化時にタスクをロードする処理 (ユーザーIDでフィルタリング) ---
    async function loadTasks() {
        if (!currentUserId) {
            taskListDiv.innerHTML = '<p>ログインしてタスクを管理してください。</p>';
            return;
        }

        taskListDiv.innerHTML = ''; // 一度クリア

        try {
            // ★ログインしているユーザーのタスクのみをフィルタリング★
            db.collection('tasks')
                .where('userId', '==', currentUserId) // ★これ重要★
                .orderBy('createdAt', 'desc')
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