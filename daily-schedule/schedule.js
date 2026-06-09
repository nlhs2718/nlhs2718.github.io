document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('timetable-body');
    const weekDisplay = document.getElementById('week-display');
    const prevBtn = document.getElementById('prev-week');
    const nextBtn = document.getElementById('next-week');
    
    // 💡 配合 HTML，精準抓取這兩個元件
    const loadingOverlay = document.getElementById('loading-overlay');
    const scheduleTable = document.getElementById('schedule-table');

    let weekOffset = 0; 

    function getWeekDates(offset) {
        const today = new Date();
        const currentDay = today.getDay();
        const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
        const monday = new Date(today);
        monday.setDate(today.getDate() + distanceToMonday + (offset * 7));

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
                dayNumber: i + 1,
                headerDisplay: `${mm}/${dd} ${dayNames[i]}`
            });
        }
        return weekDates;
    }

    function renderTimetable() {
        // 💡 點擊瞬間：觸發假載入，隱藏 table，秀出 loading
        loadingOverlay.classList.remove('hidden');
        scheduleTable.classList.add('hidden');

        tbody.innerHTML = '';
        const thisWeekDates = getWeekDates(weekOffset);

        const firstDay = thisWeekDates[0].dateString.substring(5).replace('-', '/');
        const lastDay = thisWeekDates[4].dateString.substring(5).replace('-', '/');
        
        if (weekOffset === 0) {
            weekDisplay.textContent = `本週 (${firstDay} ~ ${lastDay})`;
        } else if (weekOffset === 1) {
            weekDisplay.textContent = `下週 (${firstDay} ~ ${lastDay})`;
        } else if (weekOffset === -1) {
            weekDisplay.textContent = `上週 (${firstDay} ~ ${lastDay})`;
        } else {
            weekDisplay.textContent = `${weekOffset > 0 ? '未來' : '過去'}第 ${Math.abs(weekOffset)} 週 (${firstDay} ~ ${lastDay})`;
        }

        const thDays = document.querySelectorAll('.th-day');
        thDays.forEach((th, index) => {
            th.textContent = thisWeekDates[index].headerDisplay;
        });

        Promise.all([
            fetch('base-schedule.json').then(res => res.json()),
            fetch('adjustments.json').then(res => res.json())
        ])
        .then(([baseData, adjData]) => {
            baseData.forEach((row) => {
                const tr = document.createElement('tr');
                const periodTd = document.createElement('td');
                periodTd.innerHTML = `${row.period}<br><span class="time-text">${row.time}</span>`;
                tr.appendChild(periodTd);

                row.days.forEach((baseSubject, index) => {
                    const td = document.createElement('td');
                    const targetDate = thisWeekDates[index].dateString; 
                    const targetDay = thisWeekDates[index].dayNumber; 

                    let adjustment = adjData.find(adj => adj.period === row.period && adj.date === targetDate);
                    if (!adjustment) {
                        adjustment = adjData.find(adj => adj.period === row.period && !adj.date && adj.day === targetDay);
                    }

                    if (adjustment) {
                        td.innerHTML = `${adjustment.name}<br><span class="note">${adjustment.note}</span>`;
                        td.classList.add('special-class');
                    } else {
                        td.textContent = baseSubject;
                    }
                    tr.appendChild(td);
                });

                tbody.appendChild(tr);

                if (row.period === "第四節") {
                    const lunchTr = document.createElement('tr');
                    lunchTr.classList.add('lunch-break-row');
                    const lunchTd = document.createElement('td');
                    lunchTd.colSpan = 6;
                    lunchTd.innerHTML = `午休<br><span class="time-text">12:00-12:55</span>`;
                    lunchTr.appendChild(lunchTd);
                    tbody.appendChild(lunchTr);
                }
            });

            // 💡 關鍵：強制延遲 0.25+i (i \in [0, 249]) 秒後切換顯示狀態
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
                scheduleTable.classList.remove('hidden');
            }, 250 + Math.floor(Math.random() * 250));

        })
        .catch(error => {
            console.error('讀取功課表時發生錯誤:', error);
            loadingOverlay.innerHTML = `<p style="color: #e74c3c;">⚠️ 課表載入失敗</p>`;
        });
    }

    prevBtn.addEventListener('click', () => {
        weekOffset--;
        renderTimetable();
    });

    nextBtn.addEventListener('click', () => {
        weekOffset++;
        renderTimetable();
    });

    renderTimetable();
});