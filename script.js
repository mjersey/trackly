
        window.state = {
            logs: [], 
            currentShift: null,
            targetHours: 486,
            targetDate: "",
            username: "Intern"
        };

        const phHolidays = [
            { name: "New Year's Day", month: 1, day: 1 },
            { name: "EDSA People Power Anniversary", month: 2, day: 25 },
            { name: "Araw ng Kagitingan", month: 4, day: 9 },
            { name: "Labor Day", month: 5, day: 1 },
            { name: "Independence Day", month: 6, day: 12 },
            { name: "Ninoy Aquino Day", month: 8, day: 21 },
            { name: "National Heroes Day", month: 8, day: 26 },
            { name: "All Saints' Day", month: 11, day: 1 },
            { name: "All Souls' Day", month: 11, day: 2 },
            { name: "Bonifacio Day", month: 11, day: 30 },
            { name: "Feast of the Immaculate Conception", month: 12, day: 8 },
            { name: "Christmas Eve", month: 12, day: 24 },
            { name: "Christmas Day", month: 12, day: 25 },
            { name: "Rizal Day", month: 12, day: 30 },
            { name: "New Year's Eve", month: 12, day: 31 }
        ];

        window.filterKeyword = "";
        window.filterTag = "All";
        window.analyticsChart = null;
        window.logToDelete = null;
        
        window.currentStreakDate = new Date();

        document.addEventListener('DOMContentLoaded', () => {
            window.initTheme();
            window.renderHeaderDate();
            document.getElementById('logs-container').innerHTML = window.renderSkeletonLoaders(4);
            setInterval(window.updateLiveClock, 1000);
            window.updateLiveClock();
        });

        // --- Auth UI Toggles ---
        window.showLandingView = function() {
            document.getElementById('landing-page').classList.remove('hidden');
            document.getElementById('auth-page').classList.add('hidden');
            document.getElementById('app-dashboard').classList.add('hidden');
            document.getElementById('app-dashboard').classList.remove('flex');
        };

        window.showAuthView = function() {
            document.getElementById('landing-page').classList.add('hidden');
            document.getElementById('auth-page').classList.remove('hidden');
            document.getElementById('app-dashboard').classList.add('hidden');
            document.getElementById('app-dashboard').classList.remove('flex');
        };

        window.toggleAuthMode = function() {
            window.isSignUpMode = !window.isSignUpMode;
            document.getElementById('auth-title').innerText = window.isSignUpMode ? 'Create an Account' : 'Sign In';
            document.getElementById('auth-subtitle').innerText = window.isSignUpMode ? 'Start tracking your DTR.' : 'Access your Trackly account.';
            document.getElementById('btn-auth-submit').innerText = window.isSignUpMode ? 'Sign Up' : 'Sign In';
            document.getElementById('auth-toggle-btn').innerText = window.isSignUpMode ? 'Already have an account? Sign In' : "Don't have an account? Sign Up";
            
            const forgotPasswordContainer = document.getElementById('forgot-password-container');

            if(window.isSignUpMode) {
                document.getElementById('auth-name-group').classList.remove('hidden');
                document.getElementById('auth-name').required = true;
                if(forgotPasswordContainer) forgotPasswordContainer.classList.add('hidden');
            } else {
                document.getElementById('auth-name-group').classList.add('hidden');
                document.getElementById('auth-name').required = false;
                if(forgotPasswordContainer) forgotPasswordContainer.classList.remove('hidden');
            }
        };

        window.togglePasswordVisibility = function() {
            const pwdInput = document.getElementById('auth-password');
            const icon = document.getElementById('toggle-password-icon');
            if (pwdInput.type === 'password') {
                pwdInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                pwdInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        };

        // --- Theme / Dark Mode ---
        window.initTheme = function() {
            if (localStorage.getItem('ojtTheme') === 'dark' || (!('ojtTheme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
                document.getElementById('theme-toggle').checked = true;
            } else {
                document.documentElement.classList.remove('dark');
                document.getElementById('theme-toggle').checked = false;
            }
        };

        window.toggleDarkMode = function(e) {
            if (e.target.checked) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('ojtTheme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('ojtTheme', 'light');
            }
            if(window.analyticsChart) window.renderAnalyticsChart(); 
        };

        window.renderHeaderDate = function() {
            const now = new Date();
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            document.getElementById('desktop-date').textContent = `${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
        };

        window.updateLiveClock = function() {
            const now = new Date();
            let hours = now.getHours();
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12; hours = hours ? hours : 12; 
            
            const clockEl = document.getElementById('live-clock');
            if(clockEl) {
                clockEl.textContent = `${String(hours).padStart(2,'0')}:${minutes}`;
                document.getElementById('live-ampm').textContent = ampm;
            }

            if (window.state.currentShift) {
                const elapsedSec = Math.floor((Date.now() - window.state.currentShift.startTime) / 1000);
                const eh = String(Math.floor(elapsedSec / 3600)).padStart(2, '0');
                const em = String(Math.floor((elapsedSec % 3600) / 60)).padStart(2, '0');
                const es = String(elapsedSec % 60).padStart(2, '0');
                const timerDisplay = document.getElementById('running-timer-display');
                const timerContainer = document.getElementById('running-timer-container');
                if(timerDisplay) {
                    timerDisplay.textContent = `${eh}:${em}:${es}`;
                    timerContainer.classList.remove('hidden');
                }
            } else {
                const timerContainer = document.getElementById('running-timer-container');
                if(timerContainer) timerContainer.classList.add('hidden');
            }
        };

        // --- Modal States ---
        window.openSettings = function() {
            document.getElementById('setting-username').value = window.state.username;
            document.getElementById('setting-hours').value = window.state.targetHours;
            document.getElementById('setting-date').value = window.state.targetDate;
            
            if(window.auth && window.auth.currentUser) {
                document.getElementById('setting-email').value = window.auth.currentUser.email || "";
            }

            document.getElementById('settingsModal').classList.add('active');
            document.body.style.overflow = 'hidden';
        };
        
        window.closeSettings = function() {
            document.getElementById('settingsModal').classList.remove('active');
            document.body.style.overflow = '';
        };

        window.openStreakModal = function() {
            window.currentStreakDate = new Date();
            window.renderStreakCalendar();
            document.getElementById('streakModal').classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        window.closeStreakModal = function() {
            document.getElementById('streakModal').classList.remove('active');
            document.body.style.overflow = '';
        };

        window.changeStreakMonth = function(dir) {
            window.currentStreakDate.setMonth(window.currentStreakDate.getMonth() + dir);
            window.renderStreakCalendar();
        };

        window.renderStreakCalendar = function() {
            const grid = document.getElementById('streak-calendar-grid');
            const header = document.getElementById('streak-month-year');
            grid.innerHTML = '';
            
            const year = window.currentStreakDate.getFullYear();
            const month = window.currentStreakDate.getMonth();
            
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            header.textContent = `${monthNames[month]} ${year}`;
            
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            const loggedDates = new Set(window.state.logs.map(l => new Date(l.dateObj || l.timeIn).toDateString()));
            
            for(let i=0; i<firstDay; i++) {
                grid.innerHTML += `<div></div>`;
            }
            
            for(let d=1; d<=daysInMonth; d++) {
                const currentDate = new Date(year, month, d);
                const isLogged = loggedDates.has(currentDate.toDateString());
                
                let classes = "w-8 h-8 mx-auto rounded-full flex items-center justify-center text-[11px] font-bold transition-colors";
                
                if(isLogged) {
                    classes += " bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.4)]";
                } else {
                    classes += " bg-bgLight dark:bg-slate-700 text-textMuted dark:text-slate-400";
                }
                
                grid.innerHTML += `<div class="${classes}">${d}</div>`;
            }
        };

        window.openVerificationModal = function() {
            document.getElementById('verificationModal').classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        window.closeVerificationModal = function() {
            document.getElementById('verificationModal').classList.remove('active');
            document.body.style.overflow = '';
            if(window.isSignUpMode) {
                window.toggleAuthMode();
            }
        };

        window.openForgotPasswordModal = function() {
            document.getElementById('forgotPasswordModal').classList.add('active');
            document.body.style.overflow = 'hidden';
            const currentEmail = document.getElementById('auth-email').value;
            if(currentEmail) {
                document.getElementById('reset-email').value = currentEmail;
            }
        };

        window.closeForgotPasswordModal = function() {
            document.getElementById('forgotPasswordModal').classList.remove('active');
            document.body.style.overflow = '';
        };

        window.openLogEntryModal = function(logId = null) {
            const modal = document.getElementById('logEntryModal');
            document.getElementById('log-modal-title').textContent = logId ? "Edit Log Entry" : "Add Manual Entry";
            document.getElementById('entry-id').value = logId || "";

            if(logId) {
                const log = window.state.logs.find(l => l.id === logId);
                if(!log) return;
                
                const d = new Date(log.dateObj || log.timeIn);
                const tzOffset = d.getTimezoneOffset() * 60000;
                const localISOTime = (new Date(d - tzOffset)).toISOString().slice(0, -1);
                document.getElementById('entry-date').value = localISOTime.split('T')[0];
                
                const tIn = new Date(log.timeIn);
                document.getElementById('entry-time-in').value = tIn.toTimeString().substring(0,5);
                
                const tOut = new Date(log.timeOut);
                document.getElementById('entry-time-out').value = tOut.toTimeString().substring(0,5);
                
                document.getElementById('entry-task').value = log.tasks;
                document.getElementById('entry-break').checked = log.breakDeducted;
                document.querySelector(`input[name="entry-tag"][value="${log.tag}"]`).checked = true;
            } else {
                const now = new Date();
                const tzOffset = now.getTimezoneOffset() * 60000;
                const localISOTime = (new Date(now - tzOffset)).toISOString().slice(0, -1);
                document.getElementById('entry-date').value = localISOTime.split('T')[0];
                
                document.getElementById('entry-time-in').value = "";
                document.getElementById('entry-time-out').value = "";
                document.getElementById('entry-task').value = "";
                document.getElementById('entry-break').checked = true;
                document.querySelector('input[name="entry-tag"][value="Development"]').checked = true;
            }
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        window.closeLogEntryModal = function() {
            document.getElementById('logEntryModal').classList.remove('active');
            document.body.style.overflow = '';
        };

        window.openEndShiftScreen = function() {
            if (!window.state.currentShift) return;
            const m = document.getElementById('endShiftModal');
            
            const startD = new Date(window.state.currentShift.startTime);
            const endD = new Date();
            
            document.getElementById('modal-date').textContent = endD.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            
            const startFmt = window.formatTimeSplit(startD.getTime());
            document.getElementById('modal-time-in').textContent = startFmt.time;
            document.getElementById('modal-time-in-ampm').textContent = startFmt.ampm;
            
            const endFmt = window.formatTimeSplit(endD.getTime());
            document.getElementById('modal-time-out').textContent = endFmt.time;
            document.getElementById('modal-time-out-ampm').textContent = endFmt.ampm;
            
            m.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        window.formatTimeSplit = function(timestamp) {
            const d = new Date(timestamp);
            let h = d.getHours(); const m = String(d.getMinutes()).padStart(2, '0');
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12; h = h ? h : 12; 
            return { time: `${h}:${m}`, ampm: ampm };
        };

        window.openDeleteModal = function(id) {
            window.logToDelete = id;
            document.getElementById('deleteModal').classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        window.closeDeleteModal = function() {
            window.logToDelete = null;
            document.getElementById('deleteModal').classList.remove('active');
            document.body.style.overflow = '';
        };

        window.applyFilters = function() {
            window.filterKeyword = document.getElementById('search-logs').value.toLowerCase();
            window.filterTag = document.getElementById('filter-tag').value;
            window.renderLogsList();
        };

        window.calculateProductivity = function() {
            if(window.state.logs.length === 0) return { streak: 0, avg: 0.0, badge: { text: 'Newbie', class: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700', icon: 'fa-seedling' } };
            
            const uniqueDates = [...new Set(window.state.logs.map(l => new Date(l.dateObj || l.timeIn).toDateString()))]
                .map(d => new Date(d))
                .sort((a,b) => b-a);
                
            let streak = 0;
            const today = new Date(); today.setHours(0,0,0,0);
            const latestLog = uniqueDates[0];
            const diffFromToday = Math.floor((today - latestLog) / (1000*60*60*24));
            
            if (diffFromToday <= 3) {
                streak = 1;
                let check = latestLog;
                for(let i=1; i<uniqueDates.length; i++) {
                    const prev = uniqueDates[i];
                    const diff = Math.floor((check - prev)/(1000*60*60*24));
                    if(diff >= 1 && diff <= 3) {
                        streak++;
                        check = prev;
                    } else { break; }
                }
            }
            
            const totalHours = window.state.logs.reduce((acc, l) => acc + (l.durationSec/3600), 0);
            const avg = (totalHours / uniqueDates.length).toFixed(1);
            
            let badge = { text: 'Needs Improvement', class: 'bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-900', icon: 'fa-arrow-trend-down' };
            if (streak >= 3 && avg >= 4) {
                badge = { text: 'Consistent Intern', class: 'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900', icon: 'fa-medal' };
            } else if (avg > 0) {
                badge = { text: 'On Track', class: 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900', icon: 'fa-thumbs-up' };
            }

            return { streak, avg, badge };
        };

        window.requestNotificationPermission = function() {
            if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
                Notification.requestPermission();
            }
        };

        window.triggerSystemNotification = function(title, bodyMsg) {
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification(title, {
                    body: bodyMsg,
                    icon: 'trackly-logo.png'
                });
            }
            window.showToast(bodyMsg, 'info'); 
        };

        window.checkNotifications = function(manualClick = false) {
            const now = new Date();
            const todayStr = now.toDateString();
            
            const loggedToday = window.state.logs.some(l => new Date(l.dateObj || l.timeIn).toDateString() === todayStr) || window.state.currentShift;
            
            let hasAlert = false;
            let manualMsgs = [];

            if (!loggedToday && now.getHours() >= 9 && now.getDay() !== 0 && now.getDay() !== 6) {
                hasAlert = true;
                const msg = "It's past 9 AM. Have you clocked in yet?";
                manualMsgs.push(msg);
                if(!sessionStorage.getItem('notif_9am') && !manualClick) {
                    window.triggerSystemNotification("OJT Reminder!", msg);
                    sessionStorage.setItem('notif_9am', '1');
                }
            }
            
            if (window.state.targetDate) {
                const target = new Date(window.state.targetDate);
                const diffDays = Math.ceil((target - now) / (1000*60*60*24));
                const totalSec = window.state.logs.reduce((acc, log) => acc + log.durationSec, 0);
                const remaining = Math.max(0, window.state.targetHours - (totalSec/3600));
                
                if (diffDays <= 5 && diffDays > 0 && remaining > 0) {
                    hasAlert = true;
                    const msg = `Only ${diffDays} days left to finish ${remaining.toFixed(1)} hours!`;
                    manualMsgs.push(msg);
                    if(!sessionStorage.getItem('notif_target') && !manualClick) {
                        window.triggerSystemNotification("Target Date Approaching!", msg);
                        sessionStorage.setItem('notif_target', '1');
                    }
                }
            }

            if(manualClick) {
                if(manualMsgs.length > 0) {
                    manualMsgs.forEach(m => window.showToast(m, 'info'));
                } else {
                    window.showToast("No new notifications right now.", 'success');
                }
                
                if(document.getElementById('notif-dot-desktop')) document.getElementById('notif-dot-desktop').classList.add('hidden');
                if(document.getElementById('notif-dot-mobile-header')) document.getElementById('notif-dot-mobile-header').classList.add('hidden');
            } else if (hasAlert) {
                if(document.getElementById('notif-dot-desktop')) document.getElementById('notif-dot-desktop').classList.remove('hidden');
                if(document.getElementById('notif-dot-mobile-header')) document.getElementById('notif-dot-mobile-header').classList.remove('hidden');
            }
        };
        
        window.showToast = function(msg, type = 'info') {
            if(sessionStorage.getItem('toast_' + msg)) return; 
            sessionStorage.setItem('toast_' + msg, '1');
            
            let iconHtml = '<i class="fa-solid fa-bell text-primaryBrand animate-bounce"></i>';
            if (type === 'error') {
                iconHtml = '<i class="fa-solid fa-circle-exclamation text-indRed animate-bounce"></i>';
            } else if (type === 'success') {
                iconHtml = '<i class="fa-solid fa-circle-check text-indGreen animate-bounce"></i>';
            }

            const t = document.createElement('div');
            t.className = "bg-cardWhite dark:bg-slate-800 shadow-floating border border-borderLight dark:border-slate-700 px-4 py-3 rounded-2xl transform transition-all duration-500 -translate-y-10 opacity-0 flex items-center gap-3 w-full pointer-events-auto";
            t.innerHTML = `${iconHtml} <span class="text-[11px] font-bold text-darkPurple dark:text-white flex-1">${msg}</span>`;
            document.getElementById('toast-container').appendChild(t);
            
            setTimeout(() => { t.classList.remove('-translate-y-10', 'opacity-0'); t.classList.add('translate-y-0', 'opacity-100'); }, 100);
            
            setTimeout(() => { 
                t.classList.remove('translate-y-0', 'opacity-100');
                t.classList.add('-translate-y-10', 'opacity-0');
                setTimeout(() => t.remove(), 500);
            }, 6000);

            setTimeout(() => { sessionStorage.removeItem('toast_' + msg); }, 6500);
        };

        window.renderHolidays = function() {
            const container = document.getElementById('holidays-container');
            if(!window.state.targetDate) {
                container.innerHTML = '<p class="text-[10px] text-textMuted dark:text-slate-500">No Target Date set yet.</p>';
                return;
            }

            const now = new Date();
            const target = new Date(window.state.targetDate);
            
            let upcoming = [];
            phHolidays.forEach(h => {
                for(let year = now.getFullYear(); year <= target.getFullYear(); year++) {
                    const d = new Date(year, h.month - 1, h.day);
                    if (d >= now && d <= target) {
                        upcoming.push({ name: h.name, date: d });
                    }
                }
            });
            
            upcoming.sort((a,b) => a.date - b.date);
            
            if(upcoming.length === 0) {
                 container.innerHTML = '<p class="text-[10px] text-textMuted dark:text-slate-500">No holidays before the target date.</p>';
                 return;
            }
            
            container.innerHTML = upcoming.map(u => `
                <div class="flex justify-between items-center bg-bgLight dark:bg-slate-900 p-2 rounded-lg border border-borderLight dark:border-slate-700">
                    <span class="text-[10px] font-bold text-darkPurple dark:text-white truncate pr-2">${u.name}</span>
                    <span class="text-[9px] text-primaryBrand font-bold shrink-0 bg-primaryBrand/10 px-2 py-0.5 rounded">${u.date.toLocaleDateString('en-US', {month:'short', day:'numeric'})}</span>
                </div>
            `).join('');
        };

        window.updateUI = function() {
            let totalReg = 0; let totalOT = 0;
            const todayStr = new Date().toDateString();
            let todaySec = 0;

            window.state.logs.forEach(log => {
                let hrs = log.durationSec / 3600;
                if(hrs > 8) { totalReg += 8; totalOT += (hrs - 8); } 
                else { totalReg += hrs; }

                if (new Date(log.dateObj || log.timeIn).toDateString() === todayStr) {
                    todaySec += log.durationSec;
                }
            });
            const totalHours = totalReg + totalOT;

            document.getElementById('total-hours-display').textContent = totalHours.toFixed(2);
            document.getElementById('target-hours-display').textContent = window.state.targetHours;
            document.getElementById('stat-reg-hours').textContent = totalReg.toFixed(2) + ' h';
            document.getElementById('stat-ot-hours').textContent = totalOT.toFixed(2) + ' h';
            document.getElementById('today-total-display').textContent = `${(todaySec/3600).toFixed(1)}h Today`;

            let progress = (totalHours / window.state.targetHours) * 100;
            document.getElementById('progress-bar-fill').style.width = `${Math.min(progress, 100)}%`;
            document.getElementById('progress-percentage').textContent = `${progress.toFixed(1)}%`;

            const prod = window.calculateProductivity();
            document.getElementById('streak-days').textContent = prod.streak;
            document.getElementById('avg-hours').textContent = prod.avg;
            const badgeEl = document.getElementById('badge-container');
            badgeEl.className = `px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border flex items-center gap-2 ${prod.badge.class}`;
            document.getElementById('badge-icon').className = `fa-solid ${prod.badge.icon}`;
            document.getElementById('badge-text').textContent = prod.badge.text;

            const rem = Math.max(0, window.state.targetHours - totalHours);
            let estFinishMsg = "Est. Finish: --";
            
            if (prod.avg > 0 && rem > 0) {
                const daysNeeded = Math.ceil(rem / prod.avg);
                let estDate = new Date();
                let added = 0;
                while(added < daysNeeded) {
                    estDate.setDate(estDate.getDate() + 1);
                    if(estDate.getDay() !== 0 && estDate.getDay() !== 6) added++;
                }
                estFinishMsg = `Est. Finish: ${estDate.toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})}`;
            } else if (rem === 0) {
                estFinishMsg = "Completed!";
            }
            document.getElementById('est-finish-display').textContent = estFinishMsg;

            if(window.state.targetDate) {
                document.getElementById('target-date-display').textContent = new Date(window.state.targetDate).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});
                let t = new Date(window.state.targetDate); t.setHours(0,0,0,0);
                let c = new Date(); c.setHours(0,0,0,0);
                let w = 0;
                while(c < t) { let d = c.getDay(); if(d!==0 && d!==6) w++; c.setDate(c.getDate()+1); }
                
                if(rem <= 0) {
                    document.getElementById('days-remaining-display').textContent = 'Done!';
                    document.getElementById('pacing-badge').innerHTML = "Goal Reached";
                    document.getElementById('req-day').textContent = "0"; document.getElementById('req-week').textContent = "0";
                    document.getElementById('pacing-badge').className = "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900";
                } else if(w > 0) {
                    let rD = rem/w; let rW = rD*5;
                    document.getElementById('days-remaining-display').textContent = w + " days";
                    document.getElementById('req-day').textContent = rD.toFixed(1);
                    document.getElementById('req-week').textContent = rW.toFixed(1);
                    document.getElementById('pacing-badge').innerHTML = rD > 8 ? '<i class="fa-solid fa-triangle-exclamation mr-1"></i>Behind' : 'On Track';
                    document.getElementById('pacing-badge').className = rD > 8 ? "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-900" : "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900";
                } else {
                    document.getElementById('days-remaining-display').textContent = 'Overdue';
                }
            }

            if (window.state.currentShift) {
                document.getElementById('btn-clock-in').classList.add('hidden');
                document.getElementById('btn-clock-out').classList.remove('hidden');
                document.getElementById('btn-clock-out').classList.add('flex');
                document.getElementById('status-display').textContent = "On Shift";
                document.getElementById('status-display').className = "text-[12px] font-black text-[#00bcd4] uppercase tracking-wider";
                document.getElementById('status-icon').className = "w-8 h-8 rounded-full bg-[#00bcd4]/20 text-[#00bcd4] flex items-center justify-center mb-3 z-10 animate-pulse";
                document.getElementById('status-icon').innerHTML = '<i class="fa-solid fa-laptop-code text-[11px]"></i>';
            } else {
                document.getElementById('btn-clock-in').classList.remove('hidden');
                document.getElementById('btn-clock-in').classList.add('flex');
                document.getElementById('btn-clock-out').classList.add('hidden');
                document.getElementById('btn-clock-out').classList.remove('flex');
                document.getElementById('status-display').textContent = "Clocked Out";
                document.getElementById('status-display').className = "text-[12px] font-black text-white uppercase tracking-wider";
                document.getElementById('status-icon').className = "w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center mb-3 z-10";
                document.getElementById('status-icon').innerHTML = '<i class="fa-solid fa-mug-hot text-[11px]"></i>';
            }

            window.renderLogsList();
            window.renderAnalyticsChart();
            window.renderHolidays(); 
        };

        window.renderSkeletonLoaders = function(count) {
            let html = '';
            for(let i=0; i<count; i++){
                html += `
                <div class="bg-cardWhite dark:bg-slate-800 p-3.5 rounded-2xl border border-borderLight dark:border-slate-700 flex items-stretch gap-4 shadow-sm relative overflow-hidden">
                    <div class="w-12 h-12 skeleton rounded-xl shrink-0"></div>
                    <div class="flex-1 flex flex-col justify-center gap-2">
                        <div class="h-3 w-1/3 skeleton rounded"></div>
                        <div class="h-2 w-full skeleton rounded"></div>
                    </div>
                    <div class="w-10 flex flex-col justify-center gap-1 shrink-0 pl-3">
                        <div class="h-4 w-full skeleton rounded"></div>
                    </div>
                </div>`;
            }
            return html;
        };

        window.renderLogsList = function() {
            const container = document.getElementById('logs-container');
            container.innerHTML = '';

            const filteredLogs = window.state.logs.filter(log => {
                const matchesKey = log.tasks.toLowerCase().includes(window.filterKeyword);
                const matchesTag = window.filterTag === "All" || log.tag === window.filterTag;
                return matchesKey && matchesTag;
            });

            document.getElementById('total-logs-count').textContent = filteredLogs.length + " Entries";

            if(filteredLogs.length === 0) {
                container.innerHTML = `
                    <div class="flex flex-col items-center justify-center py-12 opacity-80">
                        <div class="w-20 h-20 bg-bgLight dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 shadow-inner">
                            <i class="fa-solid fa-inbox text-3xl text-textMuted dark:text-slate-500"></i>
                        </div>
                        <p class="text-[11px] font-bold text-darkPurple dark:text-white uppercase tracking-widest">No Records Found</p>
                        <p class="text-[10px] text-textMuted dark:text-slate-400 mt-1">Clock in or add a manual entry to start tracking.</p>
                    </div>`;
                return;
            }

            filteredLogs.forEach(log => {
                const durH = Math.floor(log.durationSec / 3600);
                const durM = Math.floor((log.durationSec % 3600) / 60);
                const floatDur = log.durationSec / 3600;
                
                const timeInFmt = window.formatTimeSplit(log.timeIn);
                const timeOutFmt = window.formatTimeSplit(log.timeOut);
                const logDate = log.dateObj ? new Date(log.dateObj) : new Date(log.timeIn);
                
                let tagColorStyle = "bg-bgLight dark:bg-slate-900 text-textMuted dark:text-slate-400"; 
                let dotColor = "bg-textMuted dark:bg-slate-500";
                
                if(log.tag === "Development") { tagColorStyle = "bg-[#e0f7fa] text-[#00bcd4] dark:bg-[#00bcd4]/10 dark:text-[#00bcd4]"; dotColor = "bg-[#00bcd4]"; }
                if(log.tag === "Meeting") { tagColorStyle = "bg-[#f3e8ff] text-[#9333ea] dark:bg-[#9333ea]/10 dark:text-[#9333ea]"; dotColor = "bg-[#9333ea]"; }
                if(log.tag === "UI Design") { tagColorStyle = "bg-[#fce7f3] text-[#ec4899] dark:bg-[#ec4899]/10 dark:text-[#ec4899]"; dotColor = "bg-[#ec4899]"; }
                if(log.tag === "Documentation") { tagColorStyle = "bg-[#ffedd5] text-[#f97316] dark:bg-[#f97316]/10 dark:text-[#f97316]"; dotColor = "bg-[#f97316]"; }

                const otBadge = floatDur > 8 ? `<span class="bg-[#fef3c7] dark:bg-amber-900/30 text-[#d97706] dark:text-amber-500 border border-[#fde68a] dark:border-amber-900 px-1.5 py-[1px] rounded-[4px] text-[7px] font-black uppercase tracking-widest">OT</span>` : '';

                const el = document.createElement('div');
                el.className = "bg-cardWhite dark:bg-slate-800 p-2.5 md:p-3 rounded-2xl border border-borderLight dark:border-slate-700 flex items-stretch gap-2 hover:border-primaryBrand dark:hover:border-primaryBrand transition-colors shadow-sm relative overflow-hidden group";
                el.innerHTML = `
                    <div class="absolute left-0 top-0 bottom-0 w-1 ${dotColor}"></div>
                    
                    <div class="flex flex-col items-center justify-center bg-bgLight dark:bg-slate-900 w-14 rounded-xl border border-borderLight dark:border-slate-700 shrink-0 ml-1.5 my-1.5">
                        <span class="text-[9px] font-black uppercase tracking-widest text-textMuted dark:text-slate-400">${logDate.toLocaleString('en-US', {month:'short'})}</span>
                        <span class="text-sm font-black text-darkPurple dark:text-white leading-none mt-1">${logDate.getDate()}</span>
                    </div>

                    <div class="flex-1 min-w-0 flex flex-col justify-center py-2 px-1">
                        <div class="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1.5">
                            <span class="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1.5 ${tagColorStyle}"><div class="w-1.5 h-1.5 rounded-full ${dotColor}"></div>${log.tag}</span>
                            <span class="text-[9px] font-bold text-textMuted dark:text-slate-400 flex items-center gap-1 whitespace-nowrap"><i class="fa-regular fa-clock"></i>${timeInFmt.time}${timeInFmt.ampm} - ${timeOutFmt.time}${timeOutFmt.ampm}</span>
                        </div>
                        <p class="text-[11px] font-medium text-textDark dark:text-slate-200 truncate pr-1">${log.tasks}</p>
                    </div>

                    <div class="w-px bg-borderLight dark:bg-slate-700 my-2.5"></div>

                    <div class="flex flex-col items-center justify-center shrink-0 w-14">
                        <span class="text-[11px] font-black text-darkPurple dark:text-white text-center">${durH}h ${durM}m</span>
                        ${otBadge ? `<div class="mt-0.5">${otBadge}</div>` : ''}
                        <div class="flex gap-2.5 mt-1.5">
                            <button onclick="openLogEntryModal('${log.id}')" class="text-textMuted dark:text-slate-500 hover:text-primaryBrand transition-colors"><i class="fa-solid fa-pen text-[10px]"></i></button>
                            <button onclick="openDeleteModal('${log.id}')" class="text-textMuted dark:text-slate-500 hover:text-indRed transition-colors"><i class="fa-solid fa-trash-can text-[10px]"></i></button>
                        </div>
                    </div>
                `;
                container.appendChild(el);
            });
        };

        window.renderAnalyticsChart = function() {
            const ctx = document.getElementById('weeklyChart').getContext('2d');
            const isDark = document.documentElement.classList.contains('dark');
            const textColor = isDark ? '#94a3b8' : '#8b8a96'; 
            
            const dates = []; const regData = []; const otData = [];
            for(let i=6; i>=0; i--) {
                let d = new Date(); d.setDate(d.getDate() - i);
                dates.push(d.toLocaleDateString('en-US', {weekday:'short'}));
                
                const dayLogs = window.state.logs.filter(l => new Date(l.dateObj || l.timeIn).toDateString() === d.toDateString());
                let totalDur = dayLogs.reduce((acc, curr) => acc + (curr.durationSec/3600), 0);
                
                regData.push(Math.min(totalDur, 8));
                otData.push(Math.max(0, totalDur - 8));
            }

            if(window.analyticsChart) window.analyticsChart.destroy();
            
            window.analyticsChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: dates,
                    datasets: [
                        { label: 'Regular', data: regData, backgroundColor: '#6058F7', borderRadius: 4 },
                        { label: 'Overtime', data: otData, backgroundColor: '#f59e0b', borderRadius: 4 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: {
                        x: { stacked: true, grid: {display: false}, ticks: {color: textColor, font: {size: 9, family: "'Public Sans'"}} },
                        y: { stacked: true, beginAtZero: true, display: false }
                    },
                    plugins: { legend: {display: false} }
                }
            });
        };

        window.exportCSV = function() {
            if(window.state.logs.length === 0) return alert("No logs to export!");
            let csv = "Date,Time In,Time Out,Regular Hours,Overtime Hours,Total Hours,Break Deducted,Tag,Tasks\n";
            
            const sorted = [...window.state.logs].sort((a,b) => a.timeIn - b.timeIn);
            sorted.forEach(log => {
                const dateStr = log.dateObj ? new Date(log.dateObj).toLocaleDateString() : new Date(log.timeIn).toLocaleDateString();
                const inStr = new Date(log.timeIn).toLocaleTimeString();
                const outStr = new Date(log.timeOut).toLocaleTimeString();
                
                const tHrs = log.durationSec / 3600;
                const rHrs = Math.min(tHrs, 8).toFixed(2);
                const oHrs = Math.max(0, tHrs - 8).toFixed(2);
                
                const safeTask = `"${log.tasks.replace(/"/g, '""')}"`;
                
                csv += `${dateStr},${inStr},${outStr},${rHrs},${oHrs},${tHrs.toFixed(2)},${log.breakDeducted?'Yes':'No'},${log.tag},${safeTask}\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "OJT_Logs.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        window.generatePDF = function() {
            if (window.state.logs.length === 0) return alert("No records to export yet!");
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFont("helvetica", "bold"); doc.setFontSize(18);
            doc.text('OJT Time Record (DTR)', 14, 22);
            
            doc.setFont("helvetica", "normal"); doc.setFontSize(10);
            const totalHours = (window.state.logs.reduce((acc, log) => acc + log.durationSec, 0) / 3600).toFixed(2);
            doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 14, 30);
            doc.text(`Name: ${window.state.username}`, 14, 36);
            doc.text(`Total Rendered Hours: ${totalHours} / ${window.state.targetHours}`, 14, 42);

            const tableColumn = ["Date", "Time In", "Time Out", "Total", "Tasks"];
            const tableRows = [];
            const sortedLogs = [...window.state.logs].sort((a, b) => a.timeIn - b.timeIn);

            sortedLogs.forEach(log => {
                const durH = Math.floor(log.durationSec / 3600);
                const durM = Math.floor((log.durationSec % 3600) / 60);
                const timeInFmt = window.formatTimeSplit(log.timeIn);
                const timeOutFmt = window.formatTimeSplit(log.timeOut);
                const dateStr = log.dateObj ? new Date(log.dateObj).toLocaleDateString() : new Date(log.timeIn).toLocaleDateString();

                tableRows.push([
                    dateStr,
                    `${timeInFmt.time} ${timeInFmt.ampm}`,
                    `${timeOutFmt.time} ${timeOutFmt.ampm}`,
                    `${durH}h ${durM}m`,
                    log.tasks
                ]);
            });

            doc.autoTable({ head: [tableColumn], body: tableRows, startY: 50, theme: 'grid', styles: { fontSize: 8, cellPadding: 3 }, headStyles: { fillColor: [96, 88, 247] } });
            const finalY = doc.lastAutoTable.finalY || 50;
            doc.text('_____________________________', 14, finalY + 30); doc.text('Intern Signature', 20, finalY + 35);
            doc.text('_____________________________', 120, finalY + 30); doc.text('Supervisor Signature', 125, finalY + 35);
            doc.save('OJT_Time_Record.pdf');
        };
    