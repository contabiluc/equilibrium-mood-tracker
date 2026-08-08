/* -------------------------------------------------------------
   Staicumine Mood Tracker - Application Logic
------------------------------------------------------------- */

// State Management
let moodEntries = [];
let safetyPlan = {
    docName: '',
    therapistName: '',
    emergencyName: '',
    triggers: '',
    coping: ''
};
let currentChartPeriod = 7; // default view

// Toast Notification Helper
function showToast(message) {
    const toast = document.getElementById('toast-notification');
    const toastMsg = document.getElementById('toast-message');
    toastMsg.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}

// Format date helper (RO layout)
function formatDateRO(dateStr) {
    const options = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateStr);
    return date.toLocaleDateString('ro-RO', options);
}

// Generate Realistic Mock Data for Demonstration
function generateMockData() {
    const entries = [];
    const today = new Date();
    
    // 10 days of mock data simulating a transition from mild depression to stability, with sleep variance
    const mockPatterns = [
        { mood: -3, sleep: 5.5, anxiety: 6, energy: 3, symptoms: ['tristete', 'lipsa_concentrare'], med: true, notes: 'M-am trezit foarte obosit și fără energie. Activitățile de la serviciu mi s-au părut copleșitoare. Am stat retras.' },
        { mood: -2, sleep: 6.0, anxiety: 5, energy: 4, symptoms: ['tristete', 'retragere_sociala'], med: true, notes: 'Puțin mai bine ca ieri, dar tot am o senzație de greutate în piept. Am dormit ceva mai mult.' },
        { mood: 0, sleep: 7.5, anxiety: 2, energy: 5, med: true, notes: "O zi liniștită. Plimbare scurtă în parc.", symptoms: [] },
        { mood: 0, sleep: 8.0, anxiety: 1, energy: 5, med: true, notes: "Somn bun. Stare generală stabilă.", symptoms: [] },
        { mood: 1, sleep: 7.0, anxiety: 3, energy: 6, med: true, notes: "Idei multe la muncă. Energie ridicată.", symptoms: ["insomnie_ușoară"] },
        { mood: 2, sleep: 5.5, anxiety: 4, energy: 8, med: true, notes: "Vorbesc repede, multe proiecte începute.", symptoms: ["insomnie_ușoară", "iritabilitate"] },
        { mood: 2, sleep: 5.0, anxiety: 5, energy: 8, med: false, notes: "Am uitat pastila. Agitație.", symptoms: ["insomnie_ușoară", "impulsivitate"] },
        { mood: 1, sleep: 6.5, anxiety: 3, energy: 6, med: true, notes: "M-am liniștit puțin seara.", symptoms: [] },
        { mood: 0, sleep: 7.0, anxiety: 2, energy: 5, med: true, notes: "Zi obișnuită de lucru.", symptoms: [] },
        { mood: -1, sleep: 8.5, anxiety: 3, energy: 4, med: true, notes: "Oboseală nespecifică. Lipsă de motivație.", symptoms: ["oboseală"] },
        { mood: -2, sleep: 9.5, anxiety: 5, energy: 2, med: true, notes: "Tristețe nemotivată. Greu de ieșit din casă.", symptoms: ["oboseală", "tristețe"] },
        { mood: -2, sleep: 9.0, anxiety: 4, energy: 3, med: true, notes: "Încă fără energie. Am vorbit cu un prieten.", symptoms: ["oboseală"] },
        { mood: -1, sleep: 8.0, anxiety: 2, energy: 4, med: true, notes: "Ușoară îmbunătățire.", symptoms: [] },
        { mood: 0, sleep: 7.5, anxiety: 2, energy: 5, med: true, notes: "Revenire la starea neutră.", symptoms: [] },
        { mood: 0, sleep: 7.5, anxiety: 1, energy: 5, med: true, notes: "Zi excelentă în familie.", symptoms: [] },
        { mood: 0, sleep: 7.0, anxiety: 2, energy: 5, med: true, notes: "Monitorizare de rutină.", symptoms: [] }
    ];

    for (let i = 13; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const pat = mockPatterns[13 - i];

        entries.push({
            date: dateStr,
            mood: pat.mood,
            sleep: pat.sleep,
            anxiety: pat.anxiety,
            energy: pat.energy,
            medicationTaken: pat.med,
            notes: pat.notes,
            symptoms: pat.symptoms
        });
    }
    
    return entries;
}

// Load Data from LocalStorage
function loadData() {
    const storedEntries = localStorage.getItem('staicumine_mood_entries') || localStorage.getItem('equilibrium_mood_entries');
    const isDemo = (localStorage.getItem('staicumine_is_demo') || localStorage.getItem('equilibrium_is_demo')) === 'true';
    
    if (storedEntries) {
        moodEntries = JSON.parse(storedEntries);
        // Show demo banner if still in demo mode
        if (isDemo) {
            setTimeout(() => showDemoBanner(), 600);
        }
    } else {
        // First time user: generate mock data to demonstrate app potential
        moodEntries = generateMockData();
        localStorage.setItem('staicumine_mood_entries', JSON.stringify(moodEntries));
        localStorage.setItem('staicumine_is_demo', 'true');
        // Show onboarding modal
        setTimeout(() => showOnboarding(), 800);
    }

    const storedSafety = localStorage.getItem('staicumine_safety_plan') || localStorage.getItem('equilibrium_safety_plan');
    if (storedSafety) {
        safetyPlan = JSON.parse(storedSafety);
        // Populate inputs
        document.getElementById('safety-doc-name').value = safetyPlan.docName || '';
        document.getElementById('safety-therapist-name').value = safetyPlan.therapistName || '';
        document.getElementById('safety-emergency-name').value = safetyPlan.emergencyName || '';
        document.getElementById('safety-triggers').value = safetyPlan.triggers || '';
        document.getElementById('safety-coping').value = safetyPlan.coping || '';
    }
    
    // Sort entries chronologically
    sortEntries();
}

// Show / hide demo banner
function showDemoBanner() {
    const banner = document.getElementById('demo-data-banner');
    if (banner) banner.style.display = 'flex';
}

// Clear demo data and start fresh
function clearDemoData() {
    if (confirm('Ești sigur că vrei să ștergi datele demo și să începi cu un jurnal gol? Această acțiune nu poate fi anulată.')) {
        localStorage.removeItem('staicumine_mood_entries');
        localStorage.removeItem('staicumine_is_demo');
        localStorage.removeItem('equilibrium_mood_entries');
        localStorage.removeItem('equilibrium_is_demo');
        moodEntries = [];
        saveEntriesToStorage();
        const banner = document.getElementById('demo-data-banner');
        if (banner) banner.style.display = 'none';
        showToast('Date demo șterse. Poți începe primul tău jurnal!');
        switchTab('log');
    }
}

// Onboarding modal state
let onboardingStep = 1;
const ONBOARDING_STEPS = 3;

function showOnboarding() {
    const modal = document.getElementById('onboarding-modal');
    if (modal) {
        onboardingStep = 1;
        updateOnboardingStep();
        modal.style.display = 'flex';
    }
}

function updateOnboardingStep() {
    for (let i = 1; i <= ONBOARDING_STEPS; i++) {
        const step = document.getElementById(`onboarding-step-${i}`);
        if (step) step.style.display = i === onboardingStep ? 'block' : 'none';
    }
    const dots = document.querySelectorAll('.onboarding-dot');
    dots.forEach((d, idx) => {
        d.classList.toggle('active', idx + 1 === onboardingStep);
    });
    const nextBtn = document.getElementById('onboarding-next-btn');
    if (nextBtn) {
        nextBtn.textContent = onboardingStep === ONBOARDING_STEPS ? 'Să începem!' : 'Înainte →';
    }
}

function onboardingNext() {
    if (onboardingStep < ONBOARDING_STEPS) {
        onboardingStep++;
        updateOnboardingStep();
    } else {
        closeOnboarding();
    }
}

function closeOnboarding() {
    const modal = document.getElementById('onboarding-modal');
    if (modal) modal.style.display = 'none';
    localStorage.setItem('staicumine_onboarding_done', 'true');
}

// Sort entries by date ascending
function sortEntries() {
    moodEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// Save entries to LocalStorage
function saveEntriesToStorage() {
    localStorage.setItem('staicumine_mood_entries', JSON.stringify(moodEntries));
}

// Mobile Sandwich / Hamburger Menu Logic
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && sidebar.classList.contains('open')) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

function openMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.getElementById('mobile-menu-backdrop');
    if (sidebar) sidebar.classList.add('open');
    if (backdrop) backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.getElementById('mobile-menu-backdrop');
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
}

// Tab view switching logic
function switchTab(tabId) {
    // Always close mobile sandwich menu when a tab is selected
    closeMobileMenu();

    // If leaving safety tab, stop breathing exercise
    if (tabId !== 'safety') {
        stopBreathingIfRunning();
    }

    // Hide all views
    document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    // Show active view
    const activeView = document.getElementById(`view-${tabId}`);
    if (activeView) activeView.classList.add('active');
    
    // Set active button
    const activeBtn = document.getElementById(`btn-${tabId}`);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Update header context or perform specific actions
    const headerTitle = document.getElementById('header-title');
    const headerSubtitle = document.getElementById('header-subtitle');
    
    if (tabId === 'dashboard') {
        headerTitle.textContent = "Staicumine";
        headerSubtitle.textContent = "Monitorizează-ți starea. Înțelege-ți tiparele.";
        updateDashboard();
    } else if (tabId === 'log') {
        headerTitle.textContent = "Check-in Zilnic";
        headerSubtitle.textContent = "Urmărește-ți dispoziția, somnul și factorii care îți influențează starea.";
        resetLogForm();
    } else if (tabId === 'safety') {
        headerTitle.textContent = "Plan de Criză Personal";
        headerSubtitle.textContent = "Pregătire preventivă și resurse rapide de asistență psihologică.";
    } else if (tabId === 'history') {
        headerTitle.textContent = "Istoricul Înregistrărilor";
        headerSubtitle.textContent = "Parcurge sau editează însemnările tale din zilele anterioare.";
        renderHistory();
    } else if (tabId === 'settings') {
        headerTitle.textContent = "Securitate Date & Setări";
        headerSubtitle.textContent = "Exportă, importă sau șterge datele stocate exclusiv în browser.";
    } else if (tabId === 'guides') {
        headerTitle.textContent = "Ghiduri & Articole Utile";
        headerSubtitle.textContent = "Recomandări bazate pe dovezi științifice pentru calmarea anxietății, somn odihnitor și echilibru emotiv.";
    }
}

// Toggle Guide Read More expander
function toggleGuideReadMore(id) {
    const content = document.getElementById(`guide-content-${id}`);
    const btn = document.getElementById(`btn-toggle-${id}`);
    if (!content || !btn) return;

    if (content.style.display === 'none') {
        content.style.display = 'block';
        btn.textContent = 'Ascunde articolul ↑';
        btn.classList.add('expanded');
    } else {
        content.style.display = 'none';
        btn.textContent = 'Citește tot articolul ↓';
        btn.classList.remove('expanded');
    }
}

// Reset log form input values
function resetLogForm() {
    document.getElementById('entry-date').value = new Date().toISOString().split('T')[0];
    setMoodValue(0);
    
    document.getElementById('sleep-hours').value = 8;
    updateSliderVal('sleep-hours-val', 8);
    
    document.getElementById('anxiety-level').value = 2;
    updateSliderVal('anxiety-val', 2);
    
    document.getElementById('energy-level').value = 5;
    updateSliderVal('energy-val', 5);
    
    // Uncheck symptoms
    document.querySelectorAll('input[name="symptom"]').forEach(cb => cb.checked = false);
    
    document.getElementById('medication-taken').checked = true;
    document.getElementById('journal-notes').value = '';
}

// Handle slider value display badges
function updateSliderVal(badgeId, value) {
    const badge = document.getElementById(badgeId);
    if (!badge) return;
    
    if (badgeId === 'sleep-hours-val') {
        badge.textContent = `${value} ore`;
    } else if (badgeId === 'anxiety-val') {
        let label = 'Scăzută';
        if (value >= 9) label = 'Extremă / Panicilă';
        else if (value >= 7) label = 'Severă';
        else if (value >= 5) label = 'Moderată';
        else if (value >= 3) label = 'Tolerabilă';
        else if (value <= 0) label = 'Nulă';
        badge.textContent = `${value} (${label})`;
    } else if (badgeId === 'energy-val') {
        let label = 'Normală';
        if (value >= 9) label = 'Extremă';
        else if (value >= 7) label = 'Ridicată';
        else if (value >= 3) label = 'Scăzută';
        else if (value <= 2) label = 'Foarte Scăzută';
        badge.textContent = `${value} (${label})`;
    }
}

// Mood values selector buttons
function setMoodValue(val) {
    document.getElementById('mood-value').value = val;
    
    // Toggle active state on buttons
    document.querySelectorAll('.bipolar-btn').forEach(btn => {
        if (parseInt(btn.getAttribute('data-val')) === val) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Save Mood Entry Form Handler
function saveMoodEntry(event) {
    event.preventDefault();
    
    const date = document.getElementById('entry-date').value;
    const mood = parseInt(document.getElementById('mood-value').value);
    const sleep = parseFloat(document.getElementById('sleep-hours').value);
    const anxiety = parseInt(document.getElementById('anxiety-level').value);
    const energy = parseInt(document.getElementById('energy-level').value);
    const medicationTaken = document.getElementById('medication-taken').checked;
    const notes = document.getElementById('journal-notes').value.trim();
    
    // Symptoms Checklist
    const symptoms = [];
    document.querySelectorAll('input[name="symptom"]:checked').forEach(cb => {
        symptoms.push(cb.value);
    });

    const newEntry = {
        date,
        mood,
        sleep,
        anxiety,
        energy,
        symptoms,
        medicationTaken,
        notes
    };

    // Check if an entry already exists for this date, overwrite if so
    const existingIndex = moodEntries.findIndex(e => e.date === date);
    if (existingIndex !== -1) {
        if (confirm(`Există deja o înregistrare pentru data de ${formatDateRO(date)}. Dorești să o suprascrii?`)) {
            moodEntries[existingIndex] = newEntry;
            showToast("Înregistrarea a fost actualizată cu succes!");
        } else {
            return;
        }
    } else {
        moodEntries.push(newEntry);
        showToast("Starea de spirit a fost înregistrată!");
    }

    sortEntries();
    saveEntriesToStorage();
    switchTab('dashboard');
}

// Save Safety Plan Contacts
function saveSafetyPlan(event) {
    event.preventDefault();
    safetyPlan.docName = document.getElementById('safety-doc-name').value.trim();
    safetyPlan.therapistName = document.getElementById('safety-therapist-name').value.trim();
    safetyPlan.emergencyName = document.getElementById('safety-emergency-name').value.trim();
    
    localStorage.setItem('staicumine_safety_plan', JSON.stringify(safetyPlan));
    showToast("Contactele de încredere au fost salvate.");
}

// Save Safety Plan Coping strategies
function saveSafetyStrategies(event) {
    event.preventDefault();
    safetyPlan.triggers = document.getElementById('safety-triggers').value.trim();
    safetyPlan.coping = document.getElementById('safety-coping').value.trim();
    
    localStorage.setItem('staicumine_safety_plan', JSON.stringify(safetyPlan));
    showToast("Strategiile de coping au fost salvate.");
}

// Render Hero Card based on user check-in lifecycle state
function renderHeroCard() {
    const container = document.getElementById('welcome-hero-card-container');
    if (!container) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayEntry = moodEntries.find(e => e.date === todayStr);

    if (moodEntries.length === 0) {
        container.innerHTML = `
            <div class="welcome-hero-card glass onboarding-hero">
                <div class="welcome-hero-text">
                    <h2>Bună! 👋</h2>
                    <p class="welcome-hero-sub">Cum te simți astăzi?</p>
                    <p class="hero-onboarding-hint">Primul tău check-in durează aproximativ 30 de secunde.</p>
                </div>
                <button class="checkin-btn-hero" onclick="switchTab('log')">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
                    <span>+ Începe primul check-in</span>
                </button>
            </div>
        `;
    } else if (!todayEntry) {
        container.innerHTML = `
            <div class="welcome-hero-card glass">
                <div class="welcome-hero-text">
                    <h2>Bună! 👋</h2>
                    <p class="welcome-hero-sub">Cum te simți astăzi?</p>
                </div>
                <button class="checkin-btn-hero" onclick="switchTab('log')">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
                    <span>+ Fă check-in-ul de azi</span>
                </button>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="welcome-hero-card glass completed-hero">
                <div class="welcome-hero-text">
                    <h2>Bună! 👋</h2>
                    <p class="welcome-hero-sub">Ai completat check-in-ul pentru astăzi.</p>
                </div>
                <div class="hero-completed-actions">
                    <span class="completed-badge">✓ Check-in complet pentru azi</span>
                    <button class="edit-btn-hero" onclick="switchTab('log')">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        <span>Editează</span>
                    </button>
                </div>
            </div>
        `;
    }
}

// Dynamic dashboard update: Stats & Chart
function updateDashboard() {
    // Render dynamic lifecycle Hero Card (Onboarding vs Daily vs Completed)
    renderHeroCard();

    // Check if we need to show the backup warning banner
    checkBackupWarning();

    const emptyCard = document.getElementById('chart-empty-card');
    const canvasWrapper = document.getElementById('canvas-wrapper');
    const chartLegend = document.getElementById('chart-legend');
    const filtersContainer = document.getElementById('chart-filters-container');

    if (moodEntries.length === 0) {
        resetDashboardStats();
        if (emptyCard) emptyCard.style.display = 'flex';
        if (canvasWrapper) canvasWrapper.style.display = 'none';
        if (chartLegend) chartLegend.style.display = 'none';
        if (filtersContainer) filtersContainer.style.display = 'none';
        renderInsights([]);
        return;
    }

    // Filter entries for the selected chart period (7, 30, 90 days)
    const filteredEntries = getEntriesForPeriod(currentChartPeriod);
    
    if (filteredEntries.length === 0) {
        resetDashboardStats();
        if (emptyCard) emptyCard.style.display = 'flex';
        if (canvasWrapper) canvasWrapper.style.display = 'none';
        if (chartLegend) chartLegend.style.display = 'none';
        if (filtersContainer) filtersContainer.style.display = 'none';
        renderInsights([]);
        return;
    }

    // Entries exist
    if (emptyCard) emptyCard.style.display = 'none';
    if (canvasWrapper) canvasWrapper.style.display = 'block';
    if (chartLegend) chartLegend.style.display = 'flex';
    if (filtersContainer) filtersContainer.style.display = 'flex';

    calculateStats(filteredEntries);
    renderInsights(filteredEntries);
    drawCustomChart(filteredEntries);
}

// Helper to filter entries based on timeframe
function getEntriesForPeriod(days) {
    const today = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(today.getDate() - days);
    
    return moodEntries.filter(entry => new Date(entry.date) >= cutoffDate);
}

// Reset stats cards to empty states
function resetDashboardStats() {
    document.getElementById('stat-avg-mood').textContent = "-";
    document.getElementById('stat-avg-mood-desc').textContent = "Fără date";
    
    document.getElementById('stat-avg-sleep').textContent = "-";
    document.getElementById('stat-avg-sleep-desc').textContent = "Fără date";
    
    document.getElementById('stat-avg-anxiety').textContent = "-";
    document.getElementById('stat-avg-anxiety-desc').textContent = "Fără date";
    
    if (document.getElementById('stat-avg-energy')) {
        document.getElementById('stat-avg-energy').textContent = "-";
        document.getElementById('stat-avg-energy-desc').textContent = "Fără date";
    }

    if (document.getElementById('summary-total-entries')) {
        document.getElementById('summary-total-entries').textContent = "0 check-in-uri";
        document.getElementById('summary-avg-sleep').textContent = "0.0 h somn mediu";
        document.getElementById('summary-avg-anxiety').textContent = "0.0 anxietate medie";
        document.getElementById('summary-med-adherence').textContent = "0% aderență tratament";
    }
}

// Calculate dashboard indicators
function calculateStats(entries) {
    let totalMood = 0;
    let totalSleep = 0;
    let totalAnxiety = 0;
    let totalEnergy = 0;
    let medCount = 0;
    
    entries.forEach(e => {
        totalMood += e.mood;
        totalSleep += e.sleep;
        totalAnxiety += e.anxiety;
        totalEnergy += (e.energy !== undefined ? e.energy : 5);
        if (e.medicationTaken) medCount++;
    });

    const count = entries.length;
    const avgMood = totalMood / count;
    const avgSleep = totalSleep / count;
    const avgAnxiety = totalAnxiety / count;
    const avgEnergy = totalEnergy / count;
    const medAdherence = (medCount / count) * 100;

    // Mood description — ton cald, non-clinic
    let moodSign = avgMood > 0 ? "+" : "";
    document.getElementById('stat-avg-mood').textContent = `${moodSign}${avgMood.toFixed(1)}`;
    
    let moodDesc = "Echilibrat";
    if (avgMood > 3) moodDesc = "Stare foarte ridicată";
    else if (avgMood > 1.5) moodDesc = "Elevată";
    else if (avgMood > 0.5) moodDesc = "Ușor ridicată";
    else if (avgMood < -3) moodDesc = "Depresie severă";
    else if (avgMood < -1.5) moodDesc = "Dificilă";
    else if (avgMood < -0.5) moodDesc = "Ușor scăzută";
    
    document.getElementById('stat-avg-mood-desc').textContent = moodDesc;
    
    // Sleep avg
    document.getElementById('stat-avg-sleep').textContent = `${avgSleep.toFixed(1)} h`;
    let sleepDesc = "Bun";
    if (avgSleep < 6) sleepDesc = "Scăzut";
    else if (avgSleep > 9) sleepDesc = "Prea lung";
    document.getElementById('stat-avg-sleep-desc').textContent = sleepDesc;

    // Anxiety avg
    document.getElementById('stat-avg-anxiety').textContent = `${avgAnxiety.toFixed(1)}`;
    let anxietyDesc = "Scăzută";
    if (avgAnxiety >= 7) anxietyDesc = "Ridicată";
    else if (avgAnxiety >= 3.5) anxietyDesc = "Moderată";
    document.getElementById('stat-avg-anxiety-desc').textContent = anxietyDesc;

    // Energy avg
    if (document.getElementById('stat-avg-energy')) {
        document.getElementById('stat-avg-energy').textContent = `${avgEnergy.toFixed(1)}`;
        let energyDesc = "Bună";
        if (avgEnergy >= 7.5) energyDesc = "Foarte ridicată";
        else if (avgEnergy < 4) energyDesc = "Scăzută";
        document.getElementById('stat-avg-energy-desc').textContent = energyDesc;
    }

    // Summary Box (Visual 2x2 Grid)
    if (document.getElementById('summary-total-val')) {
        document.getElementById('summary-total-val').textContent = `${count}`;
        document.getElementById('summary-sleep-val').textContent = `${avgSleep.toFixed(1)} h`;
        document.getElementById('summary-anxiety-val').textContent = `${avgAnxiety.toFixed(1)}/10`;
        
        let moodSign = avgMood > 0 ? "+" : "";
        document.getElementById('summary-mood-val').textContent = `${moodSign}${avgMood.toFixed(1)}`;
    }
}

// Generate dynamic statistical insights from data
function renderInsights(entries) {
    const list = document.getElementById('insights-list');
    list.innerHTML = '';
    
    if (entries.length < 3) {
        list.innerHTML = `
            <div class="empty-state-insights">
                <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--text-muted);margin-bottom:0.75rem">
                    <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"/>
                </svg>
                <p style="font-size:0.9rem;color:var(--text-muted);text-align:center;line-height:1.5">Ai nevoie de <strong style="color:var(--text-secondary)">cel puțin 3-7 zile</strong> de date pentru ca Analiza Inteligentă să-ți ofere recomandări relevante și personalizate.</p>
            </div>`;
        return;
    }

    const insights = [];

    // Analyze Sleep vs Anxiety
    const lowSleepDays = entries.filter(e => e.sleep < 6.5);
    const normalSleepDays = entries.filter(e => e.sleep >= 6.5);
    
    if (lowSleepDays.length >= 2 && normalSleepDays.length >= 2) {
        const avgAnxietyLowSleep = lowSleepDays.reduce((sum, e) => sum + e.anxiety, 0) / lowSleepDays.length;
        const avgAnxietyNormalSleep = normalSleepDays.reduce((sum, e) => sum + e.anxiety, 0) / normalSleepDays.length;
        
        if (avgAnxietyLowSleep > avgAnxietyNormalSleep + 1) {
            insights.push({
                type: 'alert',
                icon: '😴',
                title: 'Somnul și anxietatea par asociate',
                desc: `În ultimele ${entries.length} zile, anxietatea medie a fost ${avgAnxietyLowSleep.toFixed(1)} în zilele cu mai puțin de 6.5 ore de somn și ${avgAnxietyNormalSleep.toFixed(1)} în cele cu somn suficient.`
            });
        }
    }

    // Analyze Medication compliance vs mood stability
    const missedMedDays = entries.filter(e => !e.medicationTaken);
    if (missedMedDays.length > 0) {
        insights.push({
            type: 'alert',
            icon: '💊',
            title: `Tratament omis în ${missedMedDays.length} ${missedMedDays.length === 1 ? 'zi' : 'zile'}`,
            desc: `Continuitatea tratamentului face diferența în menținerea echilibrului. În ultimele ${entries.length} zile ai înregistrat ${missedMedDays.length} zile fără tratament.`
        });
    } else {
        insights.push({
            type: 'stable',
            icon: '🌟',
            title: 'Tratament luat consecvent',
            desc: `Ai luat tratamentul în fiecare zi din cele ${entries.length} zile înregistrate în această perioadă.`
        });
    }

    // Analyze High Energy/Mania Warning
    const manicDays = entries.filter(e => e.mood >= 2);
    if (manicDays.length >= 2) {
        const avgSleepManic = manicDays.reduce((sum, e) => sum + e.sleep, 0) / manicDays.length;
        if (avgSleepManic < 6) {
            insights.push({
                type: 'alert',
                icon: '🔆',
                title: 'Stare mai ridicată asociată cu somn scăzut',
                clinicalNote: 'Semnal timpuriu de hipomanie',
                desc: `Am observat energie crescută cu un somn mediu scăzut (${avgSleepManic.toFixed(1)}h). Ar fi util să discuți cu medicul curant.`
            });
        }
    }

    // General Stable Streak
    const stableDays = entries.filter(e => e.mood === 0);
    if (stableDays.length >= 5) {
        insights.push({
            type: 'stable',
            icon: '⚖️',
            title: `${stableDays.length} zile de echilibru menținut`,
            desc: `Rutina ta oferă stabilitate emoțională. Continuă obiceiurile sănătoase de odihnă.`
        });
    }

    // Render insights list
    if (insights.length === 0) {
        list.innerHTML = `<div class="insight-card"><div class="insight-title">Date echilibrate</div><div class="insight-desc">Nu am găsit devieri sau corelații notabile în datele tale recente. Continuă monitorizarea!</div></div>`;
    } else {
        insights.forEach(ins => {
            const card = document.createElement('div');
            card.className = `insight-card ${ins.type}`;
            const clinicalTag = ins.clinicalNote
                ? `<span class="clinical-tooltip" title="Termen clinic: ${ins.clinicalNote}">ℹ️ ce înseamnă asta?</span>`
                : '';
            card.innerHTML = `
                <div class="insight-title">${ins.icon ? ins.icon + ' ' : ''}${ins.title} ${clinicalTag}</div>
                <div class="insight-desc">${ins.desc}</div>
                <div class="insight-footer">🔎 Bazat pe ${entries.length} check-in-uri</div>
            `;
            list.appendChild(card);
        });
    }
}

// Change chart timeframe
function changeChartPeriod(days) {
    currentChartPeriod = days;
    
    // Toggle active button style
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.id === `filter-btn-${days}`) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    updateDashboard();
}

// Canvas-based Beautiful Chart Draw Engine
function drawCustomChart(entries) {
    const canvas = document.getElementById('mood-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Handle High DPI / Retina screen scaling & dynamic height
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width || 300;
    const height = rect.height || 280;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Grid coordinates calculations
    const isMobileCanvas = width < 480;
    const paddingLeft = isMobileCanvas ? 32 : 45;
    const paddingRight = isMobileCanvas ? 15 : 20;
    const paddingTop = isMobileCanvas ? 35 : 45;
    const paddingBottom = isMobileCanvas ? 30 : 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Draw horizontal grid lines for Mood Values (-5 to +5)
    const moodLines = [-5, -3, 0, 3, 5];
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b'; // Label colors
    ctx.font = '500 10px Inter';
    ctx.textAlign = 'right';

    moodLines.forEach(val => {
        // Map val range [-5, 5] to canvas coordinates
        const y = getYCoordinate(val, -5, 5, chartHeight, paddingTop);
        
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(width - paddingRight, y);
        ctx.stroke();

        // Draw horizontal grid texts
        let label = val > 0 ? `+${val}` : `${val}`;
        if (val === 0) label = isMobileCanvas ? "0" : "0 (Stabil)";
        ctx.fillText(label, paddingLeft - 6, y + 3);
    });

    // Draw Stable reference band (0 line - bold green)
    const stableY = getYCoordinate(0, -5, 5, chartHeight, paddingTop);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, stableY);
    ctx.lineTo(width - paddingRight, stableY);
    ctx.stroke();

    // Map X coordinates for each entry
    const points = [];
    const count = entries.length;

    entries.forEach((e, idx) => {
        const x = count === 1 
            ? paddingLeft + chartWidth / 2 
            : paddingLeft + (idx / (count - 1)) * chartWidth;
        points.push({
            x: x,
            moodY: getYCoordinate(e.mood, -5, 5, chartHeight, paddingTop),
            sleepY: getYCoordinate(e.sleep, 0, 16, chartHeight, paddingTop),
            anxietyY: getYCoordinate(e.anxiety, 0, 10, chartHeight, paddingTop),
            entry: e
        });
    });

    // 1. Draw Sleep Area (Dashed Lavender Line)
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    points.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.sleepY);
        else ctx.lineTo(p.x, p.sleepY);
    });
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // 2. Draw Anxiety Area (Dotted Amber Line)
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    points.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.anxietyY);
        else ctx.lineTo(p.x, p.anxietyY);
    });
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // 3. Draw Mood Gradient Fill & Line (Main Indigo glowing line)
    // Draw gradient underneath mood line
    if (points.length > 1) {
        const areaGrad = ctx.createLinearGradient(0, paddingTop, 0, height - paddingBottom);
        areaGrad.addColorStop(0, 'rgba(99, 102, 241, 0.18)');
        areaGrad.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
        
        ctx.fillStyle = areaGrad;
        ctx.beginPath();
        ctx.moveTo(points[0].x, stableY); // start on stable line
        points.forEach(p => ctx.lineTo(p.x, p.moodY));
        ctx.lineTo(points[points.length - 1].x, stableY); // end on stable line
        ctx.closePath();
        ctx.fill();
    }

    // Draw main glowing mood stroke line
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    points.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.moodY);
        else ctx.lineTo(p.x, p.moodY);
    });
    ctx.stroke();

    // Draw points & Labels
    points.forEach((p, idx) => {
        // Circle point for mood
        ctx.fillStyle = getMoodColor(p.entry.mood);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.moodY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw date text on Bottom Axis
        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 9px Inter';
        ctx.textAlign = 'center';
        
        const dateObj = new Date(p.entry.date);
        const dayStr = dateObj.getDate().toString().padStart(2, '0');
        const monthStr = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        
        // Optimize horizontal axis spacing (skip labels if too crowded)
        let drawLabel = true;
        if (currentChartPeriod === 30 && idx % 3 !== 0) drawLabel = false;
        if (currentChartPeriod === 90 && idx % 9 !== 0) drawLabel = false;
        
        if (drawLabel) {
            ctx.fillText(`${dayStr}/${monthStr}`, p.x, height - paddingBottom + 18);
        }
    });

    // Draw Title/Indicator
    ctx.fillStyle = '#f8fafc';
    ctx.font = isMobileCanvas ? '600 11px Outfit' : 'bold 12px Outfit';
    ctx.textAlign = 'left';
    const titleStr = isMobileCanvas 
        ? `Grafic: ${currentChartPeriod} Zile` 
        : `Grafic perioada: ${currentChartPeriod} Zile (Ultima intrare: ${entries[entries.length - 1].date})`;
    ctx.fillText(titleStr, paddingLeft, paddingTop - 14);
}

// Draw a placeholder state if no data
function drawPlaceholderChart(message = "Adăugați înregistrări pentru grafic") {
    const canvas = document.getElementById('mood-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width || 300;
    const height = rect.height || 280;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(message, width / 2, height / 2);
}

// Map value to Y coordinate in Canvas coordinates space
function getYCoordinate(value, minVal, maxVal, heightRange, topPad) {
    // Math: invert Y (since 0,0 is top left in Canvas)
    const pct = (value - minVal) / (maxVal - minVal);
    return topPad + heightRange - (pct * heightRange);
}

// Bipolar mood color mapper
function getMoodColor(val) {
    if (val === 5) return '#ec4899';
    if (val === 3) return '#d946ef';
    if (val === 1) return '#a855f7';
    if (val === 0) return '#10b981';
    if (val === -1) return '#3b82f6';
    if (val === -3) return '#1d4ed8';
    if (val === -5) return '#6366f1';
    return '#6366f1';
}

// Render History Journal Entries List
function renderHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = '';

    if (moodEntries.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <p>Nu există nicio înregistrare salvată până acum.</p>
                <button class="action-btn-primary" onclick="switchTab('log')">Adaugă prima ta stare</button>
            </div>
        `;
        return;
    }

    // Copy and reverse order to show newest first
    const sortedDesc = [...moodEntries].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedDesc.forEach(e => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.setAttribute('data-id', e.date);

        // Symptoms HTML string builder
        let symptomsHtml = '';
        if (e.symptoms && e.symptoms.length > 0) {
            symptomsHtml = `
                <div class="history-symptoms">
                    ${e.symptoms.map(s => `<span class="symptom-tag">${capitalizeFirst(s)}</span>`).join('')}
                </div>
            `;
        }

        // Mood label evaluation
        let moodSign = e.mood > 0 ? "+" : "";
        let moodClass = getMoodTextClass(e.mood);
        let moodValText = e.mood === 0 ? "0 (Stabil)" : `${moodSign}${e.mood}`;

        item.innerHTML = `
            <div class="history-item-header">
                <div class="history-date">${formatDateRO(e.date)}</div>
                <div class="history-indicators">
                    <span class="indicator-badge badge-mood ${moodClass}" style="background-color: ${getMoodColor(e.mood)}">Dispoziție: ${moodValText}</span>
                    <span class="indicator-badge badge-sleep">Somn: ${e.sleep}h</span>
                    <span class="indicator-badge badge-anxiety">Anxietate: ${e.anxiety}</span>
                    <span class="indicator-badge badge-energy">Energie: ${e.energy}</span>
                    <span class="indicator-badge badge-med ${e.medicationTaken ? 'yes' : 'no'}">${e.medicationTaken ? 'Medicament Luat' : 'Medicament Lipsă'}</span>
                </div>
            </div>
            
            ${e.notes ? `<div class="history-body">${escapeHTML(e.notes)}</div>` : '<div class="history-body italic" style="color: var(--text-muted)">Nicio notă sau jurnal scris în această zi.</div>'}
            
            ${symptomsHtml}

            <div class="history-item-footer">
                <button class="delete-entry-btn" onclick="deleteEntry('${e.date}')">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Șterge Înregistrarea
                </button>
            </div>
        `;
        list.appendChild(item);
    });
}

// Capitalize helper
function capitalizeFirst(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1).replace('_', ' ');
}

// Get text class helper
function getMoodTextClass(val) {
    if (val > 0) return 'mania-mild';
    if (val < 0) return 'depression-mild';
    return 'stable';
}

// Escape HTML safety function
function escapeHTML(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}

// Delete entry handler
function deleteEntry(dateStr) {
    if (confirm(`Sigur dorești să ștergi definitiv înregistrarea din data de ${formatDateRO(dateStr)}?`)) {
        moodEntries = moodEntries.filter(e => e.date !== dateStr);
        saveEntriesToStorage();
        showToast("Înregistrarea a fost ștearsă.");
        
        // Refresh appropriate views
        const activeTab = document.querySelector('.nav-btn.active').id.replace('btn-', '');
        if (activeTab === 'history') {
            renderHistory();
        } else {
            updateDashboard();
        }
    }
}

// Filter history listings via Search Input
function filterHistory() {
    const searchVal = document.getElementById('history-search').value.toLowerCase();
    const items = document.querySelectorAll('.history-item');
    
    items.forEach(item => {
        const notes = item.querySelector('.history-body').textContent.toLowerCase();
        const date = item.querySelector('.history-date').textContent.toLowerCase();
        
        if (notes.includes(searchVal) || date.includes(searchVal)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Backup & Export JSON data
function exportData() {
    const dataObj = {
        entries: moodEntries,
        safetyPlan: safetyPlan,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataObj, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `Staicumine_Backup_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
    
    // Save last backup date & update banner status
    localStorage.setItem('staicumine_last_backup_date', new Date().toISOString());
    checkBackupWarning();
    
    showToast("Datele au fost exportate cu succes!");
}

// Check if we should display backup warning banner
function checkBackupWarning() {
    const banner = document.getElementById('backup-warning-banner');
    const textWrapper = document.getElementById('backup-banner-text-wrapper');
    if (!banner) return;

    // If there is no data, no need to alert
    if (moodEntries.length === 0) {
        banner.style.display = 'none';
        return;
    }

    const lastBackupStr = localStorage.getItem('staicumine_last_backup_date') || localStorage.getItem('equilibrium_last_backup_date');
    const bannerClosedStr = localStorage.getItem('staicumine_backup_banner_closed_at') || localStorage.getItem('equilibrium_backup_banner_closed_at');
    const now = new Date();

    if (lastBackupStr) {
        const lastBackupDate = new Date(lastBackupStr);
        const day = lastBackupDate.getDate().toString().padStart(2, '0');
        const month = (lastBackupDate.getMonth() + 1).toString().padStart(2, '0');
        const year = lastBackupDate.getFullYear();
        
        if (textWrapper) {
            textWrapper.innerHTML = `<span class="backup-banner-text">🔒 Ultimul backup: <strong>${day}.${month}.${year}</strong> <a href="#" onclick="exportData(); return false;" class="backup-link" style="margin-left:6px">(Exportă din nou)</a></span>`;
        }

        // If user closed banner recently, hide
        if (bannerClosedStr) {
            const bannerClosed = new Date(bannerClosedStr);
            const diffDays = Math.ceil(Math.abs(now - bannerClosed) / (1000 * 60 * 60 * 24));
            if (diffDays <= 7) {
                banner.style.display = 'none';
                return;
            }
        }
        banner.style.display = 'flex';
        return;
    }

    // Initial state before any export
    if (textWrapper) {
        textWrapper.innerHTML = `<span class="backup-banner-text">🔒 Datele sunt stocate local. <a href="#" onclick="exportData(); return false;" class="backup-link">Exportă un backup</a> pentru a evita pierderea lor.</span>`;
    }

    if (bannerClosedStr) {
        const bannerClosed = new Date(bannerClosedStr);
        const diffDays = Math.ceil(Math.abs(now - bannerClosed) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) {
            banner.style.display = 'none';
            return;
        }
    }

    banner.style.display = 'flex';
}

// Restore & Import backup
function importData(event) {
    const input = event.target;
    if (input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();
    
    reader.onload = function() {
        try {
            const imported = JSON.parse(reader.result);
            
            // Validation
            if (imported && (Array.isArray(imported.entries) || Array.isArray(imported))) {
                const entries = imported.entries || imported;
                const safety = imported.safetyPlan || {};
                
                if (confirm(`Fișierul conține ${entries.length} înregistrări. Această acțiune va îmbina datele importate cu cele actuale. Continuăm?`)) {
                    
                    // Merge logic (avoid duplicates on same date)
                    entries.forEach(impEntry => {
                        const idx = moodEntries.findIndex(e => e.date === impEntry.date);
                        if (idx !== -1) {
                            moodEntries[idx] = impEntry; // overwrite duplicate
                        } else {
                            moodEntries.push(impEntry); // insert new
                        }
                    });

                    if (safety.docName || safety.therapistName || safety.emergencyName) {
                        safetyPlan = { ...safetyPlan, ...safety };
                        localStorage.setItem('staicumine_safety_plan', JSON.stringify(safetyPlan));
                    }

                    sortEntries();
                    saveEntriesToStorage();
                    showToast("Datele au fost importate cu succes!");
                    
                    // Reload UI
                    switchTab('dashboard');
                }
            } else {
                alert("Format JSON nevalid pentru restaurare.");
            }
        } catch (e) {
            alert("Eroare la citirea fișierului. Asigurați-vă că este un fișier JSON valid.");
        }
    };
    reader.readAsText(file);
}

// Purge Local Storage Data
function clearAllData() {
    if (confirm("ATENȚIE: Sigur dorești să ștergi DEFINITIV toate datele înregistrate? Această acțiune nu poate fi anulată!")) {
        if (confirm("Vă rugăm să confirmați încă o dată că doriți ștergerea completă a bazei de date locale.")) {
            localStorage.clear();
            moodEntries = [];
            safetyPlan = { docName: '', therapistName: '', emergencyName: '', triggers: '', coping: '' };
            
            // Reset fields
            document.getElementById('safety-doc-name').value = '';
            document.getElementById('safety-therapist-name').value = '';
            document.getElementById('safety-emergency-name').value = '';
            document.getElementById('safety-triggers').value = '';
            document.getElementById('safety-coping').value = '';
            
            showToast("Toate datele au fost șterse definitiv.");
            switchTab('dashboard');
        }
    }
}

// SOS Modal
function openSOSModal() {
    const modal = document.getElementById('sos-modal');
    if (modal) modal.style.display = 'flex';
}

function closeSOSModal() {
    const modal = document.getElementById('sos-modal');
    if (modal) modal.style.display = 'none';
}

// On Application Init Load
window.addEventListener('DOMContentLoaded', () => {
    loadData();
    resetLogForm();
    updateDashboard();

    // Close modals on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                backdrop.style.display = 'none';
            }
        });
    });

    // Close mobile menu or modals on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMobileMenu();
            closeSOSModal();
        }
    });

    // Listen to resize to make the canvas chart responsive
    window.addEventListener('resize', () => {
        const activeTab = document.querySelector('.nav-btn.active').id.replace('btn-', '');
        if (activeTab === 'dashboard') {
            updateDashboard();
        }
    });
});

// Helper: Toggle Mood Guide Accordion Panel
function toggleMoodGuidePanel() {
    const panel = document.getElementById('mood-guide-panel');
    if (!panel) return;
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
}

// Close backup warning banner & hide it for 7 days
function closeBackupBanner() {
    localStorage.setItem('staicumine_backup_banner_closed_at', new Date().toISOString());
    const banner = document.getElementById('backup-warning-banner');
    if (banner) banner.style.display = 'none';
    showToast("Notificarea de backup a fost ascunsă pentru 7 zile.");
}

// Check if we should display backup warning banner
function checkBackupWarning() {
    const banner = document.getElementById('backup-warning-banner');
    if (!banner) return;

    // If there is no data, no need to alert
    if (moodEntries.length === 0) {
        banner.style.display = 'none';
        return;
    }

    const lastBackupStr = localStorage.getItem('staicumine_last_backup_date') || localStorage.getItem('equilibrium_last_backup_date');
    const bannerClosedStr = localStorage.getItem('staicumine_backup_banner_closed_at') || localStorage.getItem('equilibrium_backup_banner_closed_at');
    const now = new Date();

    // Check if backup happened recently (last 7 days)
    if (lastBackupStr) {
        const lastBackup = new Date(lastBackupStr);
        const diffTime = Math.abs(now - lastBackup);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) {
            banner.style.display = 'none';
            return;
        }
    }

    // Check if banner was dismissed recently (last 7 days)
    if (bannerClosedStr) {
        const bannerClosed = new Date(bannerClosedStr);
        const diffTime = Math.abs(now - bannerClosed);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) {
            banner.style.display = 'none';
            return;
        }
    }

    // Show banner if conditions met
    banner.style.display = 'flex';
}

// Toggle Coping Suggestions Accordion Details
function toggleSuggestionDetail(id) {
    const content = document.getElementById(id);
    const chevron = document.getElementById(`chevron-${id}`);
    const header = content.previousElementSibling;
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        header.classList.add('active');
        chevron.textContent = '▲';
    } else {
        content.style.display = 'none';
        header.classList.remove('active');
        chevron.textContent = '▼';
    }
}

// Add Suggestion Text to Personal Coping strategies Textarea
function addSuggestionToCoping(text) {
    const copingTextarea = document.getElementById('safety-coping');
    if (!copingTextarea) return;

    const currentVal = copingTextarea.value.trim();
    if (currentVal === '') {
        copingTextarea.value = text;
    } else {
        // Check if suggestion already exists to avoid duplicate spamming
        if (currentVal.includes(text)) {
            showToast("Această sugestie este deja în planul tău.");
            return;
        }
        copingTextarea.value = currentVal + "\n\n" + text;
    }

    // Trigger local state update and save
    safetyPlan.coping = copingTextarea.value;
    localStorage.setItem('staicumine_safety_plan', JSON.stringify(safetyPlan));
    showToast("Sugestia a fost adăugată la strategiile tale de calmare.");
}

// Interactive Breathing Exercise State Variables
let breathingIntervalId = null;
let isBreathingRunning = false;

function toggleBreathingExercise() {
    const circle = document.getElementById('breathing-circle');
    const instruction = document.getElementById('breathing-instruction');
    const timerText = document.getElementById('breathing-timer');
    const btn = document.getElementById('breathing-start-btn');

    if (!circle || !instruction || !timerText || !btn) return;

    if (isBreathingRunning) {
        // Stop exercise
        stopBreathingIfRunning();
    } else {
        // Start exercise
        isBreathingRunning = true;
        btn.textContent = 'Oprește Respirația';
        btn.classList.remove('action-btn-primary');
        btn.classList.add('action-btn-danger');
        showToast("Exercițiul de respirație a început. Urmărește instrucțiunile.");

        runBreathingCycle(circle, instruction, timerText);
    }
}

function stopBreathingIfRunning() {
    if (!isBreathingRunning) return;
    
    clearInterval(breathingIntervalId);
    breathingIntervalId = null;
    isBreathingRunning = false;
    
    const circle = document.getElementById('breathing-circle');
    const instruction = document.getElementById('breathing-instruction');
    const timerText = document.getElementById('breathing-timer');
    const btn = document.getElementById('breathing-start-btn');
    
    if (circle && instruction && timerText && btn) {
        circle.className = 'breathing-circle';
        instruction.textContent = 'Pregătit?';
        timerText.textContent = '';
        btn.textContent = 'Începe Respirația';
        btn.classList.remove('action-btn-danger');
        btn.classList.add('action-btn-primary');
    }
    showToast("Exercițiul de respirație a fost oprit.");
}

function runBreathingCycle(circle, instruction, timerText) {
    let currentState = 'inhale'; // states: inhale, hold, exhale
    let timerValue = 4;

    const updateUI = () => {
        circle.className = 'breathing-circle ' + currentState;
        timerText.textContent = timerValue;
        
        if (currentState === 'inhale') {
            instruction.textContent = 'Inspiră adânc...';
        } else if (currentState === 'hold') {
            instruction.textContent = 'Menține aerul...';
        } else if (currentState === 'exhale') {
            instruction.textContent = 'Expiră lent pe gură...';
        }
    };

    updateUI();

    breathingIntervalId = setInterval(() => {
        timerValue--;
        
        if (timerValue <= 0) {
            // State transitions
            if (currentState === 'inhale') {
                currentState = 'hold';
                timerValue = 7;
            } else if (currentState === 'hold') {
                currentState = 'exhale';
                timerValue = 8;
            } else if (currentState === 'exhale') {
                currentState = 'inhale';
                timerValue = 4;
            }
        }
        
        updateUI();
    }, 1000);
}
