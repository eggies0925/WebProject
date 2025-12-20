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
    const ingredientContainer = document.getElementById('ingredients-checkboxes');
    const randomBtn = document.getElementById('random-btn');
    const resultText = document.getElementById('result-text');

    try {
        const [nRes, sRes, iRes] = await Promise.all([
            fetch('./data/noodles.json'),
            fetch('./data/sauces.json'),
            fetch('./data/ingredients.json')
        ]);

        const noodles = await nRes.json();
        const sauces = await sRes.json();
        const ingredients = await iRes.json();

        // 填充選單
        noodles.forEach(n => noodleSelect.innerHTML += `<option value="${n.name}">${n.name}</option>`);
        sauces.forEach(s => sauceSelect.innerHTML += `<option value="${s.name}">${s.name}</option>`);

        // 動態生成配料核取方塊 
        ingredients.forEach(i => {
            const label = document.createElement('label');
            label.innerHTML = `<input type="checkbox" name="ing" value="${i.name}"> ${i.name}`;
            ingredientContainer.appendChild(label);
        });

        // 處理手動提交 [cite: 18]
        orderForm.addEventListener('submit', (event) => {
            event.preventDefault(); 
            
            // 抓取選中的配料
            const checkedIngs = Array.from(document.querySelectorAll('input[name="ing"]:checked')).map(el => el.value);
            
            if (checkedIngs.length === 0) {
                alert("建議至少選擇一項配料喔！");
            }

            const ingText = checkedIngs.length > 0 ? `，加點 [${checkedIngs.join(" & ")}]` : "";
            resultText.innerText = `您選擇了：${noodleSelect.value} 搭配 ${sauceSelect.value}${ingText}。`;
            resultText.style.color = "green";
        });

        // 今日組合：隨機邏輯 
        randomBtn.addEventListener('click', (event) => {
            event.preventDefault(); 
            
            const randomNoodle = noodles[Math.floor(Math.random() * noodles.length)].name;
            const randomSauce = sauces[Math.floor(Math.random() * sauces.length)].name;

            // 1. 更新選單值
            noodleSelect.value = randomNoodle;
            sauceSelect.value = randomSauce;

            // 2. 清除所有配料選取並隨機勾選 1-2 種 [cite: 18]
            const checkboxes = document.querySelectorAll('input[name="ing"]');
            checkboxes.forEach(cb => cb.checked = false); // 先全部取消勾選
            
            const shuffledIndices = [...Array(checkboxes.length).keys()].sort(() => 0.5 - Math.random());
            const count = Math.floor(Math.random() * 2) + 1; // 隨機 1 或 2
            const selectedNames = [];

            for(let i = 0; i < count; i++) {
                const idx = shuffledIndices[i];
                checkboxes[idx].checked = true;
                selectedNames.push(checkboxes[idx].value);
            }

            // 3. 更新結果文字 [cite: 50]
            resultText.innerText = `今日推薦：${randomNoodle} 搭配 ${randomSauce}，加點 [${selectedNames.join(" & ")}]。`;
            resultText.style.color = "var(--primary-red)";
        });

    } catch (err) {
        console.error("資料加載失敗", err);
    }
}

function showDetail(item) {
    // 簡單的彈窗互動，可提升至自訂 Modal
    alert(`【${item.name}】\n詳細介紹：${item.description || item.pairing}`);
}







