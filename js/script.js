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

            if (page === 'sauces.html') {
    card.style.cursor = 'pointer'; 
    card.addEventListener('click', () => {
        if (item.extra) {
            Swal.fire({
                title: `<strong>${item.name}</strong>`, 
                html: `<div style="text-align: left; line-height: 1.6;">${item.extra.replace(/\n/g, '<br>')}</div>`, 
                icon: 'info',
                confirmButtonText: '長知識了！',
                confirmButtonColor: '#C0392B', 
                background: '#FBFAF5', 
                backdrop: `rgba(0,0,0,0.4)` 
            });
        } else {
            Swal.fire({
                title: item.name,
                text: '目前尚無更多歷史介紹。',
                icon: 'question',
                confirmButtonText: '好的',
                confirmButtonColor: '#27AE60' 
            });
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
    const displayArea = document.getElementById('display-area');

    try {
        const [nRes, sRes, iRes] = await Promise.all([
            fetch('./data/noodles.json'),
            fetch('./data/sauces.json'),
            fetch('./data/ingredients.json')
        ]);

        const noodles = await nRes.json();
        const sauces = await sRes.json();
        const ingredients = await iRes.json();

        noodles.forEach(n => noodleSelect.innerHTML += `<option value="${n.name}">${n.name}</option>`);
        sauces.forEach(s => sauceSelect.innerHTML += `<option value="${s.name}">${s.name}</option>`);

        ingredients.forEach(i => {
            const label = document.createElement('label');
            label.style.display = "flex";
            label.style.alignItems = "center";
            label.style.gap = "5px";
            label.innerHTML = `<input type="checkbox" name="ing" value="${i.name}"> ${i.name}`;
            ingredientContainer.appendChild(label);
        });

        function renderResultCard(noodleName, sauceName, selectedIngredients) {
            const noodleObj = noodles.find(n => n.name === noodleName);
            const sauceObj = sauces.find(s => s.name === sauceName);

            const imgSrc = noodleObj ? noodleObj.img : 'assets/default.jpg';
            const sauceDesc = sauceObj ? sauceObj.features : '美味的醬汁';

            let ingTagsHtml = '';
            if (selectedIngredients.length > 0) {
                ingTagsHtml = selectedIngredients.map(ing => `<span class="ing-tag">#${ing}</span>`).join('');
            } else {
                ingTagsHtml = `<span class="ing-tag" style="background:#eee; color:#888;">原味品嚐 (無配料)</span>`;
            }

            // 3. 組合卡片 HTML
            const cardHtml = `
                <div class="result-card">
                    <div class="result-img-box">
                        <img src="${imgSrc}" alt="${noodleName}">
                    </div>
                    <div class="result-info">
                        <h3>🍽️ 您的專屬義大利麵</h3>
                        <div class="result-detail">
                            <p><span>麵條：</span>${noodleName}</p>
                            <p style="font-size:0.9em; color:#666;">${noodleObj.description}</p>
                        </div>
                        <div class="result-detail">
                            <p><span>醬汁：</span>${sauceName}</p>
                            <p style="font-size:0.9em; color:#666;">${sauceDesc}</p>
                        </div>
                        <div class="result-detail">
                            <p><span>配料：</span></p>
                            <div class="ing-tags">
                                ${ingTagsHtml}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            displayArea.innerHTML = cardHtml;
        }

        orderForm.addEventListener('submit', (event) => {
            event.preventDefault();
            
            const selectedNoodle = noodleSelect.value;
            const selectedSauce = sauceSelect.value;
            const checkedIngs = Array.from(document.querySelectorAll('input[name="ing"]:checked')).map(el => el.value);
            
            if (!selectedNoodle || !selectedSauce) {
                alert("請完整選擇麵條與醬汁喔！");
                return;
            }

            renderResultCard(selectedNoodle, selectedSauce, checkedIngs);
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

            renderResultCard(randomNoodle, randomSauce, selectedNames);
        });

    } catch (err) {
        console.error("資料加載失敗", err);
        displayArea.innerHTML = "<p>系統發生錯誤，無法載入選項。</p>";
    }
}
function showDetail(item) {
    alert(`【${item.name}】\n詳細介紹：${item.description || item.pairing}`);
}













