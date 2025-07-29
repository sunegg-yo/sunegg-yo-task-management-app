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

    // --- タスク追加フォームの送信処理 (まだデータ保存はしません) ---
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault(); // フォームのデフォルトの送信動作をキャンセル

        const title = taskTitleInput.value.trim();
        const description = taskDescriptionInput.value.trim();

        if (title) {
            // 仮のタスクオブジェクトを作成
            const newTask = {
                id: Date.now(), // 一時的なID
                title: title,
                description: description,
                createdAt: new Date().toLocaleString()
            };

            // 仮にタスクリストに追加して表示 (Firebase連携後はこの部分は変わります)
            addTaskToDOM(newTask);

            // フォームをクリア
            taskTitleInput.value = '';
            taskDescriptionInput.value = '';
            taskListDiv.querySelector('p').style.display = 'none'; // "タスクがありません" を非表示に
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

        // 編集・削除ボタンのイベントリスナー (まだ機能は実装されていません)
        taskItem.querySelector('.edit-button').addEventListener('click', () => {
            alert(`タスク「${task.title}」を編集します (まだ機能は実装されていません)`);
            // ここに編集モーダル表示などのロジックを追加
        });

        taskItem.querySelector('.delete-button').addEventListener('click', () => {
            if (confirm(`タスク「${task.title}」を削除してもよろしいですか？`)) {
                alert(`タスク「${task.title}」を削除します (まだ機能は実装されていません)`);
                taskItem.remove(); // DOMから削除
                // Firebase連携後はこの部分でFirebaseからも削除
            }
        });

        taskListDiv.prepend(taskItem); // 新しいタスクを一番上に追加
    }

    // --- アプリの初期化時にタスクをロードする処理 (今は何もしません) ---
    function loadTasks() {
        // 将来的にFirebaseからタスクを読み込む処理をここに記述します
        // 現状は "タスクがありません" のメッセージが表示されます
    }

    loadTasks(); // アプリ起動時にタスクを読み込む
});