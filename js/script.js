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
            
            const imgHtml = item.img ? `<img src="${item.img}" alt="${item.name}" class="card-img">` : '';
            const description = item.description || item.features; // 自動切換 description 或 features
            const pairingInfo = item.pairing ? `<p><strong>建議搭配：</strong>${item.pairing}</p>` : '';
            
            card.innerHTML = `
                ${imgHtml}
                <div class="card-content" style="padding: 15px;">
                    <h3>${item.name}</h3>
                    <p>${description}</p>
                    ${pairingInfo}
                </div>
            `;

            if (page === 'sauces.html') {
                card.style.cursor = 'pointer'; 
                card.addEventListener('click', () => {
                    // 顯示 JSON 中的 extra 欄位 [cite: 50]
                    if (item.extra) {
                        alert(`【${item.name} 深度探索】\n\n${item.extra}`);
                    } else {
                        alert(`【${item.name}】\n目前尚無更多歷史介紹。`);
                    }
                });
            } else {
                card.style.cursor = 'default';
            }

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

        orderForm.addEventListener('submit', (event) => {
            event.preventDefault(); 
            
            const checkedIngs = Array.from(document.querySelectorAll('input[name="ing"]:checked')).map(el => el.value);
            
            if (checkedIngs.length === 0) {
                alert("建議至少選擇一項配料喔！");
            }

            const ingText = checkedIngs.length > 0 ? `，加點 [${checkedIngs.join(" & ")}]` : "";
            resultText.innerText = `您選擇了：${noodleSelect.value} 搭配 ${sauceSelect.value}${ingText}。`;
            resultText.style.color = "green";
        });

        randomBtn.addEventListener('click', (event) => {
            event.preventDefault(); 
            
            const randomNoodle = noodles[Math.floor(Math.random() * noodles.length)].name;
            const randomSauce = sauces[Math.floor(Math.random() * sauces.length)].name;

            noodleSelect.value = randomNoodle;
            sauceSelect.value = randomSauce;

            const checkboxes = document.querySelectorAll('input[name="ing"]');
            checkboxes.forEach(cb => cb.checked = false); 
            
            const shuffledIndices = [...Array(checkboxes.length).keys()].sort(() => 0.5 - Math.random());
            const count = Math.floor(Math.random() * 2) + 1; 
            const selectedNames = [];

            for(let i = 0; i < count; i++) {
                const idx = shuffledIndices[i];
                checkboxes[idx].checked = true;
                selectedNames.push(checkboxes[idx].value);
            }

            resultText.innerText = `今日推薦：${randomNoodle} 搭配 ${randomSauce}，加點 [${selectedNames.join(" & ")}]。`;
            resultText.style.color = "var(--primary-red)";
        });

    } catch (err) {
        console.error("資料加載失敗", err);
    }
}

function showDetail(item) {
    alert(`【${item.name}】\n詳細介紹：${item.description || item.pairing}`);
}








