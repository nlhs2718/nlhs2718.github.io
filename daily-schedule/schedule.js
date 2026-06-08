document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('timetable-body');

    // 🛠️ 1. 計算本週日期與星期幾的組合
    function getWeekDates() {
        const today = new Date();
        const currentDay = today.getDay();
        const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
        
        const monday = new Date(today);
        monday.setDate(today.getDate() + distanceToMonday);

        const dayNames = ['一 (Mon)', '二 (Tue)', '三 (Wed)', '四 (Thu)', '五 (Fri)'];
        const weekDates = [];

        for (let i = 0; i < 5; i++) {
            const nextDay = new Date(monday);
            nextDay.setDate(monday.getDate() + i);

            const yyyy = nextDay.getFullYear();
            const mm = String(nextDay.getMonth() + 1).padStart(2, '0');
            const dd = String(nextDay.getDate()).padStart(2, '0');
            
            weekDates.push({
                dateString: `${yyyy}-${mm}-${dd}`,
                // 💡 完美的表頭格式：{日期}{星期幾} -> 例："06/08 一 (Mon)"
                headerDisplay: `${mm}/${dd} ${dayNames[i]}`
            });
        }
        return weekDates;
    }

    const thisWeekDates = getWeekDates();

    // 將產生的 {日期}{星期幾} 填入表頭 <th>
    const thDays = document.querySelectorAll('.th-day');
    thDays.forEach((th, index) => {
        th.textContent = thisWeekDates[index].headerDisplay;
    });

    // 💡 2. 讀取並融合課表資料
    Promise.all([
        fetch('base-schedule.json').then(res => res.json()),
        fetch('adjustments.json').then(res => res.json())
    ])
    .then(([baseData, adjData]) => {
        baseData.forEach((row) => {
            const tr = document.createElement('tr');

            // 欄位一：{節次}\n{時間}
            const periodTd = document.createElement('td');
            periodTd.innerHTML = `${row.period}<br><span class="time-text">${row.time}</span>`;
            tr.appendChild(periodTd);

            // 欄位二至六：週一到週五的課程
            row.days.forEach((baseSubject, index) => {
                const td = document.createElement('td');
                const targetDate = thisWeekDates[index].dateString; 

                const adjustment = adjData.find(adj => adj.period === row.period && adj.date === targetDate);

                if (adjustment) {
                    // 【調代課狀況】：{課堂名稱}\n{備註} (黃字)
                    td.innerHTML = `${adjustment.name}<br><span class="note">${adjustment.note}</span>`;
                    td.classList.add('special-class');
                } else {
                    // 【正常狀況】：{課堂名稱} (灰底白字)
                    td.textContent = baseSubject;
                }
                tr.appendChild(td);
            });

            tbody.appendChild(tr);

            // 💡 3. 關鍵插入：在第四節下方插入午休欄位
            if (row.period === "第四節") {
                const lunchTr = document.createElement('tr');
                lunchTr.classList.add('lunch-break-row'); // 加上特有類別供 CSS 調整樣式
                
                const lunchTd = document.createElement('td');
                lunchTd.colSpan = 6; // 橫跨全部 6 個欄位
                lunchTd.innerHTML = `午休<br><span class="time-text">12:00~13:05</span>`;
                
                lunchTr.appendChild(lunchTd);
                tbody.appendChild(lunchTr);
            }
        });
    })
    .catch(error => console.error('讀取功課表時發生錯誤:', error));
});