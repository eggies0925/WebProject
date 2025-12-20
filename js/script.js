/**
 * Pasta World 核心邏輯檔
 * 包含：Fetch API 載入資料、DOM 動態渲染、表單事件處理與 localStorage 運用
 */

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const page = path.split("/").pop();

    if (page === 'noodles.html' || page === 'sauces.html') {
        loadData(page);
    } else if (page === 'customize.html') {
        initCustomizePage();
    } else if (page === 'ingredients.html') {
        loadIngredientsTable();
    }
});

// 1. AJAX / Fetch 運用：從外部 JSON 取得資料 
async function loadData(page) {
    const targetId = page === 'noodles.html' ? 'noodle-container' : 'sauce-list';
    const jsonFile = page === 'noodles.html' ? './data/noodles.json' : './data/sauces.json';
    const container = document.getElementById(targetId);

    if (!container) return;

    try {
        const response = await fetch(jsonFile);
        const data = await response.json();

        container.innerHTML = ''; 
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';
            
            // 如果 JSON 裡有 img 欄位就顯示圖片，否則顯示預設圖或空字串
            const imgHtml = item.img ? `<img src="${item.img}" alt="${item.name}" class="card-img">` : '';

            const description = item.description || item.features;
            const pairingInfo = item.pairing ? `<p><strong>建議搭配：</strong>${item.pairing}</p>` : '';
            
            card.innerHTML = `
                ${imgHtml}
                <div class="card-content" style="padding: 15px;">
                    <h3>${item.name}</h3>
                    <p>${description}</p>
                    ${pairingInfo}
                </div>
            `;

            card.addEventListener('click', () => showDetail(item));
            container.appendChild(card);
        });
    } catch (error) {
        console.error('資料載入失敗:', error);
        container.innerHTML = '<p>資料加載失敗，請檢查路徑或檔案。</p>';
    }
}

async function loadIngredientsTable() {
    const container = document.getElementById('ingredient-table-container');
    if (!container) return;

    try {
        const response = await fetch('./data/ingredients.json');
        const data = await response.json();

        // 依照 type 分類排序 (肉類在前，蔬菜在後)
        data.sort((a, b) => (a.type === "肉類" ? -1 : 1));

        let tableHtml = `
            <table class="ing-table">
                <thead>
                    <tr>
                        <th>類別</th>
                        <th>名稱</th>
                        <th>描述</th>
                        <th>卡路里</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach(item => {
            tableHtml += `
                <tr>
                    <td class="type-cell">${item.type}</td>
                    <td class="name-cell">${item.name}</td>
                    <td>${item.description}</td>
                    <td class="cal-cell">${item.calories}</td>
                </tr>
            `;
        });

        tableHtml += `</tbody></table>`;
        container.innerHTML = tableHtml;

    } catch (error) {
        console.error('配料資料載入失敗:', error);
        container.innerHTML = '<p>目前無法載入配料表格，請檢查資料夾路徑。</p>';
    }
}

// 4. 自選組合頁面邏輯 (表單驗證與動態清單) 
async function initCustomizePage() {
    const orderForm = document.getElementById('order-form');
    const noodleSelect = document.getElementById('noodle-select');
    const sauceSelect = document.getElementById('sauce-select');
    const randomBtn = document.getElementById('random-btn');
    const resultText = document.getElementById('result-text');

    try {
        // 同時 fetch 三份 JSON [cite: 19]
        const [nRes, sRes, iRes] = await Promise.all([
            fetch('./data/noodles.json'),
            fetch('./data/sauces.json'),
            fetch('./data/ingredients.json')
        ]);

        const noodles = await nRes.json();
        const sauces = await sRes.json();
        const ingredients = await iRes.json();

        // 填充下拉選單 [cite: 18]
        noodles.forEach(n => noodleSelect.innerHTML += `<option value="${n.name}">${n.name}</option>`);
        sauces.forEach(s => sauceSelect.innerHTML += `<option value="${s.name}">${s.name}</option>`);

        orderForm.addEventListener('submit', (event) => {
        // 1. 阻止頁面重新整理 (非常重要)
        event.preventDefault(); 

        // 2. 獲取當前選取的數值
        const selectedNoodle = noodleSelect.value;
        const selectedSauce = sauceSelect.value;

        // 3. 更新 DOM 顯示結果
        if (selectedNoodle && selectedSauce) {
            resultText.innerText = `您選擇了：${selectedNoodle} 搭配 ${selectedSauce}。`;
            resultText.style.color = "green"; // 可加入顏色提示
        }
    });

        // 今日組合：隨機邏輯 [cite: 52]
        randomBtn.addEventListener('click', () => {
            event.preventDefault(); 
            const randomNoodle = noodles[Math.floor(Math.random() * noodles.length)].name;
            const randomSauce = sauces[Math.floor(Math.random() * sauces.length)].name;

            // 隨機取出 1-2 種配料
            const shuffledIng = [...ingredients].sort(() => 0.5 - Math.random());
            const selectedIng = shuffledIng.slice(0, Math.floor(Math.random() * 2) + 1).map(i => i.name);

            // 更新 DOM [cite: 50]
            resultText.innerText = `今日推薦：${randomNoodle} 搭配 ${randomSauce}，加點 [${selectedIng.join(" & ")}]。`;

            // 同步更新選單狀態 (UX 優化)
            noodleSelect.value = randomNoodle;
            sauceSelect.value = randomSauce;
        });

    } catch (err) {
        console.error("資料加載失敗", err);
    }
}

function showDetail(item) {
    // 簡單的彈窗互動，可提升至自訂 Modal
    alert(`【${item.name}】\n詳細介紹：${item.description || item.pairing}`);
}






