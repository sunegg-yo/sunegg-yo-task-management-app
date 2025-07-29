// Firebaseの設定
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
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('task-form');
    const taskTitleInput = document.getElementById('task-title');
    const taskDescriptionInput = document.getElementById('task-description');
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

    const CLOUD_RUN_API_BASE_URL = 'https://auth-api-1048413736807.asia-northeast1.run.app/api/auth';

    // UIの状態を更新する関数
    function updateUIForAuthStatus(isLoggedIn) {
        if (isLoggedIn) {
            authStatusParagraph.textContent = 'ログイン済み';
            loginFormContainer.style.display = 'none';
            authSection.style.display = 'block';
            taskInputSection.style.display = 'block';
            taskListSection.style.display = 'block';
            loadTasks();
        } else {
            authStatusParagraph.textContent = '未ログイン';
            loginFormContainer.style.display = 'block';
            authSection.style.display = 'block';
            taskInputSection.style.display = 'none';
            taskListSection.style.display = 'none';
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
            const response = await fetch(`${CLOUD_RUN_API_BASE_URL}/login`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: username, password: password })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('ログイン成功:', data);
                updateUIForAuthStatus(true);
                alert('ログインに成功しました！');
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
            const response = await fetch(`${CLOUD_RUN_API_BASE_URL}/register`, { 
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


    // タスク追加フォームの送信処理
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

    // DOMにタスクを追加する関数
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

    // アプリの初期化時にタスクをロードする処理
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
    updateUIForAuthStatus(false);
});