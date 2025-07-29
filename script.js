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

    // --- 認証関連の仮の処理 ---
    loginButton.addEventListener('click', () => {
        // ここに将来的にGoogle Cloud Runの認証APIを呼び出す処理を記述します
        alert('ログインボタンがクリックされました！ (まだ認証機能は実装されていません)');
        authStatusParagraph.textContent = 'ログイン済み (仮)';
        loginButton.style.display = 'none'; // ログインしたらボタンを非表示にする (仮)
    });

    // --- タスク追加フォームの送信処理 ---
    taskForm.addEventListener('submit', async (e) => { // asyncを追加
        e.preventDefault();

        const title = taskTitleInput.value.trim();
        const description = taskDescriptionInput.value.trim();

        if (title) {
            try {
                // Firestoreに新しいタスクを追加
                await db.collection('tasks').add({
                    title: title,
                    description: description,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp() // サーバータイムスタンプを使用
                });

                // フォームをクリア
                taskTitleInput.value = '';
                taskDescriptionInput.value = '';
                // 'addTaskToDOM'はonSnapshotで自動的に呼び出されるため、ここでは不要

            } catch (error) {
                console.error("Error adding document: ", error);
                alert("タスクの追加中にエラーが発生しました。");
            }
        } else {
            alert('タスクのタイトルは必須です！');
        }
    });

    // --- DOMにタスクを追加する関数 (仮) ---
    function addTaskToDOM(task) {
        const taskItem = document.createElement('div');
        taskItem.classList.add('task-item');
        taskItem.setAttribute('data-id', task.id); // タスクのIDを保持

        taskItem.innerHTML = `
            <h3>${task.title}</h3>
            <p>${task.description || '詳細なし'}</p>
            <p style="font-size: 0.8em; color: #888;">作成日時: ${task.createdAt}</p>
            <div class="task-actions">
                <button class="edit-button">編集</button>
                <button class="delete-button">削除</button>
            </div>
        `;

        // 編集ボタンのイベントリスナー (まだ機能は実装されていません)
        taskItem.querySelector('.edit-button').addEventListener('click', async () => { // asyncを追加
            const newTitle = prompt('新しいタスクのタイトルを入力してください:', task.title);
            if (newTitle !== null && newTitle.trim() !== '') {
                try {
                    await db.collection('tasks').doc(task.id).update({
                        title: newTitle.trim()
                        // descriptionなどの他のフィールドも同様に追加可能
                    });
                    // DOMの更新はonSnapshotで自動的に行われる
                } catch (error) {
                    console.error("Error updating document: ", error);
                    alert("タスクの更新中にエラーが発生しました。");
                }
            } else if (newTitle !== null) { // 空文字列でOKを押した場合
                alert('タイトルは空にできません。');
            }
        });

        // 削除ボタンのイベントリスナー
        taskItem.querySelector('.delete-button').addEventListener('click', async () => { // asyncを追加
            if (confirm(`タスク「${task.title}」を削除してもよろしいですか？`)) {
                try {
                    await db.collection('tasks').doc(task.id).delete();
                    // DOMからの削除はonSnapshotで自動的に行われる
                } catch (error) {
                    console.error("Error removing document: ", error);
                    alert("タスクの削除中にエラーが発生しました。");
                }
            }
        });

        taskListDiv.prepend(taskItem); // 新しいタスクを一番上に追加
    }

    // --- アプリの初期化時にタスクをロードする処理 (今は何もしません) ---
    async function loadTasks() {
        taskListDiv.innerHTML = ''; // 既存のタスク表示をクリア

        try {
            // Firestoreからタスクをリアルタイムで購読する (変更があるたびに更新)
            // 'tasks'コレクションの'createdAt'フィールドで降順にソート
            db.collection('tasks').orderBy('createdAt', 'desc')
                .onSnapshot((snapshot) => {
                    taskListDiv.innerHTML = ''; // 変更があるたびに一度クリア
                    if (snapshot.empty) {
                        taskListDiv.innerHTML = '<p>タスクがありません。</p>';
                        return;
                    }

                    snapshot.forEach(doc => {
                        const task = doc.data();
                        task.id = doc.id; // ドキュメントIDをタスクオブジェクトに追加
                        addTaskToDOM(task); // DOMに追加
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

    loadTasks(); // アプリ起動時にタスクを読み込む
});