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
    const isInitialized = localStorage.getItem('staicumine_initialized') === 'true';
    
    if (isInitialized && storedEntries) {
        moodEntries = JSON.parse(storedEntries);
        if (isDemo) {
            setTimeout(() => showDemoBanner(), 600);
        }
    } else if (isInitialized) {
        moodEntries = [];
    } else {
        // First time user: start empty and show choice modal
        moodEntries = [];
        setTimeout(() => showWelcomeChoiceModal(), 600);
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

// First time choice handlers
function showWelcomeChoiceModal() {
    const modal = document.getElementById('welcome-modal');
    if (modal) modal.style.display = 'flex';
}

function startFreshJournal() {
    localStorage.setItem('staicumine_initialized', 'true');
    localStorage.setItem('staicumine_mood_entries', JSON.stringify([]));
    localStorage.setItem('staicumine_is_demo', 'false');
    moodEntries = [];
    
    const modal = document.getElementById('welcome-modal');
    if (modal) modal.style.display = 'none';
    
    const banner = document.getElementById('demo-data-banner');
    if (banner) banner.style.display = 'none';

    showToast('Bun venit! Ai creat propriul tău jurnal privat.');
    updateDashboard();
}

function loadDemoJournal() {
    localStorage.setItem('staicumine_initialized', 'true');
    moodEntries = generateMockData();
    localStorage.setItem('staicumine_mood_entries', JSON.stringify(moodEntries));
    localStorage.setItem('staicumine_is_demo', 'true');
    
    const modal = document.getElementById('welcome-modal');
    if (modal) modal.style.display = 'none';
    
    showDemoBanner();
    showToast('Exemplul demo a fost încărcat. Îl poți șterge oricând din banner!');
    updateDashboard();
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
function switchTab(tabId, skipReset = false) {
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
        headerTitle.textContent = "Acasă";
        headerSubtitle.textContent = "Monitorizează-ți starea. Înțelege-ți tiparele.";
        updateDashboard();
    } else if (tabId === 'log') {
        headerTitle.textContent = "Check-in";
        headerSubtitle.textContent = "Urmărește-ți dispoziția, somnul și factorii care îți influențează starea.";
        if (!skipReset) {
            resetLogForm();
        }
    } else if (tabId === 'history') {
        headerTitle.textContent = "Istoric";
        headerSubtitle.textContent = "Revizuiește toate înregistrările tale și observă dinamica emoțională.";
        renderHistory();
    } else if (tabId === 'safety') {
        headerTitle.textContent = "Plan de siguranță";
        headerSubtitle.textContent = "Strategii personale și resurse de suport în caz de criză.";
    } else if (tabId === 'settings') {
        headerTitle.textContent = "Date & setări";
        headerSubtitle.textContent = "Exportă, importă sau șterge datele stocate exclusiv în browser.";
    } else if (tabId === 'guides') {
        headerTitle.textContent = "Resurse";
        headerSubtitle.textContent = "Recomandări bazate pe dovezi științifice pentru calmarea anxietății, somn odihnitor și echilibru emotiv.";
    }
}

// Edit Existing Entry Handler
let isEditingMode = false;

function editEntry(dateStr) {
    const entry = moodEntries.find(e => e.date === dateStr);
    if (!entry) {
        showToast("Nu am găsit înregistrarea pentru această dată.");
        return;
    }

    isEditingMode = true;
    
    // Switch to log tab without resetting form
    switchTab('log', true);

    // Populate form inputs
    document.getElementById('entry-date').value = entry.date;
    setMoodValue(entry.mood);

    document.getElementById('sleep-hours').value = entry.sleep;
    updateSliderVal('sleep-hours-val', entry.sleep);

    document.getElementById('anxiety-level').value = entry.anxiety;
    updateSliderVal('anxiety-val', entry.anxiety);

    document.getElementById('energy-level').value = entry.energy;
    updateSliderVal('energy-val', entry.energy);

    document.getElementById('medication-taken').checked = !!entry.medicationTaken;
    document.getElementById('journal-notes').value = entry.notes || '';

    // Populate Symptoms Checklist
    document.querySelectorAll('.symptom-card').forEach(card => {
        const input = card.querySelector('input[name="symptom"]');
        if (input) {
            const isChecked = entry.symptoms && entry.symptoms.includes(input.value);
            input.checked = isChecked;
            if (isChecked) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        }
    });

    // Update Form Header Title & Submit CTA
    const formTitle = document.querySelector('#view-log .form-header-bar h2');
    if (formTitle) formTitle.textContent = "Editează check-in-ul";

    const submitBtn = document.querySelector('#view-log button[type="submit"]');
    if (submitBtn) submitBtn.textContent = "Actualizează check-in-ul";

    // Show edit mode badge
    let editBadge = document.getElementById('edit-mode-notice-badge');
    if (!editBadge) {
        editBadge = document.createElement('div');
        editBadge.id = 'edit-mode-notice-badge';
        editBadge.className = 'edit-mode-notice-badge';
        const formHeader = document.querySelector('#view-log .form-header-bar');
        if (formHeader) formHeader.parentNode.insertBefore(editBadge, formHeader.nextSibling);
    }
    editBadge.innerHTML = `✏️ Modifici check-in-ul salvat din <strong>${formatDateRO(entry.date)}</strong>`;
    editBadge.style.display = 'block';

    checkExistingEntryForDate(entry.date);
    showToast(`Editare activă pentru ${formatDateRO(entry.date)}`);
}

// Reset log form input values
function resetLogForm() {
    isEditingMode = false;

    // Reset Form Header & CTA text
    const formTitle = document.querySelector('#view-log .form-header-bar h2');
    if (formTitle) formTitle.textContent = "Înregistrează starea de azi";

    const submitBtn = document.querySelector('#view-log button[type="submit"]');
    if (submitBtn) submitBtn.textContent = "Salvează check-in-ul";

    const editBadge = document.getElementById('edit-mode-notice-badge');
    if (editBadge) editBadge.style.display = 'none';

    document.getElementById('entry-date').value = new Date().toISOString().split('T')[0];
    setMoodValue(0);
    
    document.getElementById('sleep-hours').value = 8;
    updateSliderVal('sleep-hours-val', 8);
    
    document.getElementById('anxiety-level').value = 2;
    updateSliderVal('anxiety-val', 2);
    
    document.getElementById('energy-level').value = 5;
    updateSliderVal('energy-val', 5);
    
    // Reset symptom cards
    document.querySelectorAll('.symptom-card').forEach(card => {
        card.classList.remove('selected');
        const input = card.querySelector('input[name="symptom"]');
        if (input) input.checked = false;
    });
    
    document.getElementById('medication-taken').checked = true;
    document.getElementById('journal-notes').value = '';
    checkExistingEntryForDate(document.getElementById('entry-date').value);
    restoreDraft();
}

// Handle slider value display badges
function updateSliderVal(badgeId, value) {
    const badge = document.getElementById(badgeId);
    if (!badge) return;
    
    const val = parseFloat(value);

    if (badgeId === 'sleep-hours-val') {
        badge.textContent = `${val} ore`;
    } else if (badgeId === 'anxiety-val') {
        let label = 'Scăzută';
        if (val >= 9) label = 'Extremă';
        else if (val >= 7) label = 'Severă';
        else if (val >= 5) label = 'Moderată';
        else if (val >= 2) label = 'Tolerabilă';
        else if (val <= 1) label = 'Scăzută';
        badge.textContent = `${val} / 10 • ${label}`;
    } else if (badgeId === 'energy-val') {
        let label = 'Moderată';
        if (val >= 9) label = 'Foarte bună';
        else if (val >= 7) label = 'Bună';
        else if (val >= 5) label = 'Moderată';
        else if (val >= 3) label = 'Scăzută';
        else if (val <= 2) label = 'Foarte scăzută';
        badge.textContent = `${val} / 10 • ${label}`;
    }
}

// Mood values selector buttons (7-column Bipolar Grid)
function setMoodValue(val) {
    document.getElementById('mood-value').value = val;
    
    // Toggle active state on buttons
    document.querySelectorAll('.bipolar-btn, .bipolar-btn-7').forEach(btn => {
        if (parseInt(btn.getAttribute('data-val')) === val) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    saveDraft();
}

// Toggle symptom card click
function toggleSymptomCard(cardElement) {
    const checkbox = cardElement.querySelector('input[name="symptom"]');
    if (!checkbox) return;

    checkbox.checked = !checkbox.checked;
    if (checkbox.checked) {
        cardElement.classList.add('selected');
    } else {
        cardElement.classList.remove('selected');
    }
    saveDraft();
}

// Check if duplicate entry exists for selected date
function checkExistingEntryForDate(dateStr) {
    const warning = document.getElementById('duplicate-date-warning');
    if (!warning) return;

    const existing = moodEntries.find(e => e.date === dateStr);
    if (existing) {
        warning.style.display = 'block';
    } else {
        warning.style.display = 'none';
    }
    saveDraft();
}

// Auto-Draft Management (LocalStorage with Strict Date Matching)
function saveDraft() {
    const dateVal = document.getElementById('entry-date')?.value;
    if (!dateVal) return;

    const draftData = {
        date: dateVal,
        mood: document.getElementById('mood-value')?.value,
        sleep: document.getElementById('sleep-hours')?.value,
        anxiety: document.getElementById('anxiety-level')?.value,
        energy: document.getElementById('energy-level')?.value,
        medicationTaken: document.getElementById('medication-taken')?.checked,
        journalNotes: document.getElementById('journal-notes')?.value,
        symptoms: Array.from(document.querySelectorAll('input[name="symptom"]:checked')).map(cb => cb.value),
        savedAt: new Date().toISOString()
    };
    localStorage.setItem('staicumine_checkin_draft', JSON.stringify(draftData));
    
    const notice = document.getElementById('draft-status-notice');
    const label = document.getElementById('draft-time-label');
    if (notice && label) {
        notice.style.display = 'block';
        label.textContent = '(salvat automat)';
    }
}

function restoreDraft() {
    const draftStr = localStorage.getItem('staicumine_checkin_draft');
    const unfinishedBanner = document.getElementById('unfinished-draft-banner');
    if (unfinishedBanner) unfinishedBanner.style.display = 'none';

    if (!draftStr) return;

    try {
        const draft = JSON.parse(draftStr);
        const currentDateInput = document.getElementById('entry-date')?.value;

        // Strict Date Matching Check:
        if (draft.date && draft.date !== currentDateInput) {
            // Draft belongs to a different date! Show smart prompt.
            showUnfinishedDraftBanner(draft.date);
            return;
        }

        // Same date: restore values cleanly
        if (draft.mood !== undefined) setMoodValue(parseInt(draft.mood));
        if (draft.sleep !== undefined) {
            document.getElementById('sleep-hours').value = draft.sleep;
            updateSliderVal('sleep-hours-val', draft.sleep);
        }
        if (draft.anxiety !== undefined) {
            document.getElementById('anxiety-level').value = draft.anxiety;
            updateSliderVal('anxiety-val', draft.anxiety);
        }
        if (draft.energy !== undefined) {
            document.getElementById('energy-level').value = draft.energy;
            updateSliderVal('energy-val', draft.energy);
        }
        if (draft.medicationTaken !== undefined) {
            document.getElementById('medication-taken').checked = draft.medicationTaken;
        }
        if (draft.journalNotes !== undefined) {
            document.getElementById('journal-notes').value = draft.journalNotes;
        }
        if (draft.symptoms && Array.isArray(draft.symptoms)) {
            document.querySelectorAll('.symptom-card').forEach(card => {
                const input = card.querySelector('input[name="symptom"]');
                if (input && draft.symptoms.includes(input.value)) {
                    input.checked = true;
                    card.classList.add('selected');
                }
            });
        }
        const notice = document.getElementById('draft-status-notice');
        const label = document.getElementById('draft-time-label');
        if (notice && label) {
            notice.style.display = 'block';
            label.textContent = '(restaurat automat)';
        }
    } catch(e) {}
}

function showUnfinishedDraftBanner(draftDate) {
    let banner = document.getElementById('unfinished-draft-banner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'unfinished-draft-banner';
        banner.className = 'unfinished-draft-banner';
        const formHeader = document.querySelector('#view-log .form-header-bar');
        if (formHeader) formHeader.parentNode.insertBefore(banner, formHeader.nextSibling);
    }
    
    banner.innerHTML = `
        <div class="unfinished-draft-content">
            <span>📝 Ai un check-in neterminat din <strong>${formatDateRO(draftDate)}</strong>. Vrei să-l continui?</span>
            <div class="unfinished-draft-actions">
                <button type="button" class="action-btn-primary btn-sm" onclick="continueDraftDate('${draftDate}')">Continuă draftul din ${formatDateRO(draftDate)}</button>
                <button type="button" class="action-btn-secondary btn-sm" onclick="clearDraft()">Șterge draftul</button>
            </div>
        </div>
    `;
    banner.style.display = 'block';
}

function continueDraftDate(draftDate) {
    document.getElementById('entry-date').value = draftDate;
    checkExistingEntryForDate(draftDate);
    restoreDraft();
}

function clearDraft() {
    localStorage.removeItem('staicumine_checkin_draft');
    const notice = document.getElementById('draft-status-notice');
    if (notice) notice.style.display = 'none';
    const unfinishedBanner = document.getElementById('unfinished-draft-banner');
    if (unfinishedBanner) unfinishedBanner.style.display = 'none';
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
        if (confirm(`Există deja un check-in pentru data de ${formatDateRO(date)}. Dorești să-l actualizezi?`)) {
            moodEntries[existingIndex] = newEntry;
            showToast("Check-in-ul a fost actualizat cu succes!");
        } else {
            return;
        }
    } else {
        moodEntries.push(newEntry);
        showToast("Check-in-ul a fost salvat!");
    }

    clearDraft();
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
                    <span>Începe primul check-in</span>
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
                    <span>Fă check-in-ul de azi</span>
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
                    <button class="edit-btn-hero" onclick="editEntry('${todayStr}')">
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
    renderSparklines(filteredEntries);
}

// Helper to filter entries based on timeframe (Exact calendar day cutoff)
function getEntriesForPeriod(days) {
    const today = new Date();
    const cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() - (days - 1));
    cutoffDate.setHours(0, 0, 0, 0);
    
    return moodEntries.filter(entry => {
        const entryDate = new Date(entry.date + 'T00:00:00');
        return entryDate >= cutoffDate;
    });
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

// Generate dynamic statistical insights from data (Graduated Confidence UX)
function renderInsights(entries) {
    const list = document.getElementById('insights-list');
    if (!list) return;
    list.innerHTML = '';
    
    const count = entries.length;

    // Stage 1: 0 - 2 check-ins -> Summary only, no observations yet
    if (count < 3) {
        list.innerHTML = `
            <div class="empty-state-insights" style="text-align:center;padding:1.25rem 0.5rem">
                <div class="empty-icon-badge" style="width:36px;height:36px;font-size:1.1rem;margin:0 auto 0.6rem;display:flex;align-items:center;justify-content:center;background:rgba(99,102,241,0.12);border-radius:50%">📈</div>
                <h4 style="font-size:0.92rem;font-weight:700;color:var(--text-primary);margin-bottom:0.3rem">Colectăm mai multe date</h4>
                <p style="font-size:0.84rem;color:var(--text-muted);line-height:1.5;max-width:320px;margin:0 auto">
                    Secțiunea <strong>„Ce observăm”</strong> se activează după <strong>3 check-in-uri</strong> pentru a-ți arăta primele observații. Continuă să-ți înregistrezi starea zi de zi!
                </p>
            </div>`;
        return;
    }

    // Determine confidence level badge based on check-in count
    let confidenceLabel = '';
    let confidenceBadgeClass = '';
    
    if (count >= 3 && count <= 6) {
        confidenceLabel = '🌱 Observație preliminară';
        confidenceBadgeClass = 'badge-preliminary';
    } else if (count >= 7 && count <= 29) {
        confidenceLabel = '📊 Tipar preliminar';
        confidenceBadgeClass = 'badge-pattern';
    } else {
        confidenceLabel = '🌟 Tendință consistentă';
        confidenceBadgeClass = 'badge-trend';
    }

    const insights = [];

    // Analyze Sleep vs Anxiety
    const lowSleepDays = entries.filter(e => e.sleep < 6.5);
    const normalSleepDays = entries.filter(e => e.sleep >= 6.5);
    
    if (lowSleepDays.length >= 1 && normalSleepDays.length >= 1) {
        const avgAnxietyLowSleep = lowSleepDays.reduce((sum, e) => sum + e.anxiety, 0) / lowSleepDays.length;
        const avgAnxietyNormalSleep = normalSleepDays.reduce((sum, e) => sum + e.anxiety, 0) / normalSleepDays.length;
        
        if (avgAnxietyLowSleep > avgAnxietyNormalSleep + 0.8) {
            insights.push({
                type: 'alert',
                icon: '😴',
                title: 'Somnul și anxietatea par asociate',
                desc: count <= 6 
                    ? `O primă observație: anxietatea medie a fost de ${avgAnxietyLowSleep.toFixed(1)}/10 în zilele cu mai puțin de 6.5h somn, față de ${avgAnxietyNormalSleep.toFixed(1)}/10 în zilele cu somn odihnitor.`
                    : `În ultimele ${currentChartPeriod} zile (${count} check-in-uri), anxietatea medie a fost de ${avgAnxietyLowSleep.toFixed(1)}/10 în zilele cu mai puțin de 6.5 ore de somn, comparativ cu ${avgAnxietyNormalSleep.toFixed(1)}/10 în cele cu somn suficient.`
            });
        }
    }

    // Analyze High Energy/Mood Pattern (Cautious & Friendly language)
    const manicDays = entries.filter(e => e.mood >= 2);
    if (manicDays.length >= 1) {
        const avgSleepManic = manicDays.reduce((sum, e) => sum + e.sleep, 0) / manicDays.length;
        if (avgSleepManic < 6) {
            insights.push({
                type: 'alert',
                icon: '🔎',
                title: 'Am observat un tipar care merită urmărit',
                desc: `În ultimele ${currentChartPeriod} zile, în zilele cu o stare mai ridicată (+2 sau peste), somnul mediu a fost mai scăzut (${avgSleepManic.toFixed(1)}h). Dacă acest tipar se repetă sau te îngrijorează, îți recomandăm să îl discuți cu medicul sau terapeutul tău.`
            });
        }
    }

    // Analyze Medication compliance vs mood stability
    const missedMedDays = entries.filter(e => !e.medicationTaken);
    if (missedMedDays.length > 0) {
        insights.push({
            type: 'alert',
            icon: '💊',
            title: `Monitorizarea tratamentului`,
            desc: `Ai înregistrat ${missedMedDays.length} ${missedMedDays.length === 1 ? 'zi' : 'zile'} fără tratament în ultimele ${currentChartPeriod} zile (${count} check-in-uri). Menținerea rutei de tratament sprijină stabilitatea emoțională.`
        });
    } else {
        insights.push({
            type: 'stable',
            icon: '🌱',
            title: 'Tratament urmat consecvent',
            desc: `Ai bifat tratamentul în fiecare zi din ultimele ${currentChartPeriod} zile (${count} check-in-uri).`
        });
    }

    // General Stable Streak
    const stableDays = entries.filter(e => e.mood === 0);
    if (stableDays.length >= 2) {
        insights.push({
            type: 'stable',
            icon: '⚖️',
            title: `${stableDays.length} zile de echilibru menținut`,
            desc: `Ai menținut o stare stabilă în această perioadă. Continuă obiceiurile sănătoase de somn.`
        });
    }

    // Render insights list
    if (insights.length === 0) {
        list.innerHTML = `<div class="insight-card"><div class="insight-title">Stare generală echilibrată</div><div class="insight-desc">Nu am identificat fluctuații sau asocieri marcante în datele tale recente. Continuă check-in-urile zilnice!</div></div>`;
    } else {
        insights.forEach(ins => {
            const card = document.createElement('div');
            card.className = `insight-card ${ins.type}`;
            card.innerHTML = `
                <div class="insight-card-top">
                    <span class="insight-title">${ins.icon ? ins.icon + ' ' : ''}${ins.title}</span>
                    <span class="confidence-badge ${confidenceBadgeClass}">${confidenceLabel}</span>
                </div>
                <div class="insight-desc">${ins.desc}</div>
                <div class="insight-footer">🔎 Bazat pe ${count} check-in-uri</div>
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

// Chart State
let currentChartMetric = 'mood'; // 'mood' | 'sleep' | 'anxiety' | 'energy' | 'all'

function setChartMetric(metric) {
    currentChartMetric = metric;
    
    // Update metric selector button states
    document.querySelectorAll('.metric-btn').forEach(btn => {
        if (btn.getAttribute('data-metric') === metric) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update main chart title and subtitle based on metric
    const titleEl = document.getElementById('chart-main-title');
    const subEl = document.getElementById('chart-main-sub');

    if (metric === 'mood') {
        if (titleEl) titleEl.textContent = "Evoluția dispoziției";
        if (subEl) subEl.textContent = "Scară calibrată: -5 (Depresie) la +5 (Manie)";
    } else if (metric === 'sleep') {
        if (titleEl) titleEl.textContent = "Ore de somn";
        if (subEl) subEl.textContent = "Scară calibrată: 0 la 16 ore (Zona optimă 6.5h - 9h)";
    } else if (metric === 'anxiety') {
        if (titleEl) titleEl.textContent = "Nivel de anxietate";
        if (subEl) subEl.textContent = "Scară calibrată: 0 (Scăzută) la 10 (Severă)";
    } else if (metric === 'energy') {
        if (titleEl) titleEl.textContent = "Nivel de energie";
        if (subEl) subEl.textContent = "Scară calibrată: 0 (Scăzută) la 10 (Foarte bună)";
    } else if (metric === 'all') {
        if (titleEl) titleEl.textContent = "Toți indicatorii suprapuși";
        if (subEl) subEl.textContent = "Urmărire comparativă pe scară procentuală normalizată";
    }

    const filteredEntries = getEntriesForPeriod(currentChartPeriod);
    drawCustomChart(filteredEntries);
    renderSparklines(filteredEntries);
}

function renderChartLegend() {
    const legendEl = document.getElementById('chart-legend');
    if (!legendEl) return;

    if (currentChartMetric === 'mood') {
        legendEl.innerHTML = `
            <span class="legend-item"><span class="legend-dot" style="background: #818cf8;"></span> Dispoziție (-5 la +5)</span>
            <span class="legend-item"><span class="legend-dot" style="background: #10b981;"></span> Linia de Stabilitate (0)</span>
        `;
    } else if (currentChartMetric === 'sleep') {
        legendEl.innerHTML = `
            <span class="legend-item"><span class="legend-dot" style="background: #38bdf8;"></span> Ore Somn (0-16h)</span>
            <span class="legend-item"><span class="legend-dot" style="background: rgba(56, 189, 248, 0.25);"></span> Zona optimă de somn (6.5h - 9h)</span>
        `;
    } else if (currentChartMetric === 'anxiety') {
        legendEl.innerHTML = `
            <span class="legend-item"><span class="legend-dot" style="background: #f59e0b;"></span> Anxietate (0-10)</span>
            <span class="legend-item"><span class="legend-dot" style="background: rgba(16, 185, 129, 0.25);"></span> Zona de confort (0-3)</span>
        `;
    } else if (currentChartMetric === 'energy') {
        legendEl.innerHTML = `
            <span class="legend-item"><span class="legend-dot" style="background: #10b981;"></span> Energie (0-10)</span>
        `;
    } else if (currentChartMetric === 'all') {
        legendEl.innerHTML = `
            <span class="legend-item"><span class="legend-dot" style="background: #818cf8;"></span> Dispoziție</span>
            <span class="legend-item"><span class="legend-dot" style="background: #38bdf8;"></span> Somn</span>
            <span class="legend-item"><span class="legend-dot" style="background: #f59e0b;"></span> Anxietate</span>
            <span class="legend-item"><span class="legend-dot" style="background: #10b981;"></span> Energie</span>
        `;
    }
}

function renderSparklines(entries) {
    const grid = document.getElementById('mini-sparklines-grid');
    if (!grid) return;

    if (!entries || entries.length === 0) {
        grid.style.display = 'none';
        return;
    }

    grid.style.display = 'grid';
    const lastEntry = entries[entries.length - 1];

    const moodValEl = document.getElementById('sparkline-val-mood');
    const sleepValEl = document.getElementById('sparkline-val-sleep');
    const anxietyValEl = document.getElementById('sparkline-val-anxiety');
    const energyValEl = document.getElementById('sparkline-val-energy');

    if (moodValEl) moodValEl.textContent = lastEntry.mood > 0 ? `+${lastEntry.mood}` : `${lastEntry.mood}`;
    if (sleepValEl) sleepValEl.textContent = `${lastEntry.sleep}h`;
    if (anxietyValEl) anxietyValEl.textContent = `${lastEntry.anxiety}/10`;
    if (energyValEl) energyValEl.textContent = `${lastEntry.energy}/10`;

    drawMiniSparkline('sparkline-canvas-mood', entries.map(e => e.mood), -5, 5, '#818cf8');
    drawMiniSparkline('sparkline-canvas-sleep', entries.map(e => e.sleep), 0, 16, '#38bdf8');
    drawMiniSparkline('sparkline-canvas-anxiety', entries.map(e => e.anxiety), 0, 10, '#f59e0b');
    drawMiniSparkline('sparkline-canvas-energy', entries.map(e => e.energy), 0, 10, '#10b981');
}

function drawMiniSparkline(canvasId, values, minY, maxY, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width || 120;
    const height = rect.height || 36;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    if (values.length < 2) return;

    const pad = 4;
    const w = width - pad * 2;
    const h = height - pad * 2;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    values.forEach((v, idx) => {
        const x = pad + (idx / (values.length - 1)) * w;
        const normY = (v - minY) / (maxY - minY);
        const y = height - pad - normY * h;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });

    ctx.stroke();
}

// Canvas-based Calibrated Chart Engine
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
    ctx.clearRect(0, 0, width, height);

    const isMobileCanvas = width < 480;
    const paddingLeft = isMobileCanvas ? 42 : 55;
    const paddingRight = isMobileCanvas ? 15 : 20;
    const paddingTop = isMobileCanvas ? 35 : 45;
    const paddingBottom = isMobileCanvas ? 30 : 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    let minY = -5, maxY = 5;
    let gridSteps = [];
    let lineColor = '#818cf8';
    let gradientStart = 'rgba(99, 102, 241, 0.22)';
    let formatLabel = (v) => v > 0 ? `+${v}` : `${v}`;

    if (currentChartMetric === 'mood') {
        minY = -5; maxY = 5;
        gridSteps = [-5, -3, 0, 3, 5];
        lineColor = '#818cf8';
        gradientStart = 'rgba(99, 102, 241, 0.22)';
        formatLabel = (v) => v === 0 ? "0 (Stabil)" : v > 0 ? `+${v}` : `${v}`;
    } else if (currentChartMetric === 'sleep') {
        minY = 0; maxY = 16;
        gridSteps = [0, 4, 8, 12, 16];
        lineColor = '#38bdf8';
        gradientStart = 'rgba(56, 189, 248, 0.22)';
        formatLabel = (v) => `${v}h`;
    } else if (currentChartMetric === 'anxiety') {
        minY = 0; maxY = 10;
        gridSteps = [0, 3, 5, 8, 10];
        lineColor = '#f59e0b';
        gradientStart = 'rgba(245, 158, 11, 0.22)';
        formatLabel = (v) => `${v}`;
    } else if (currentChartMetric === 'energy') {
        minY = 0; maxY = 10;
        gridSteps = [0, 3, 5, 8, 10];
        lineColor = '#10b981';
        gradientStart = 'rgba(16, 185, 129, 0.22)';
        formatLabel = (v) => `${v}`;
    } else if (currentChartMetric === 'all') {
        minY = 0; maxY = 10;
        gridSteps = [0, 2.5, 5, 7.5, 10];
        formatLabel = (v) => `${v * 10}%`;
    }

    // Draw Grid Lines & Axis Labels
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '500 10px Inter';
    ctx.textAlign = 'right';

    gridSteps.forEach(val => {
        const y = getYCoordinate(val, minY, maxY, chartHeight, paddingTop);
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(width - paddingRight, y);
        ctx.stroke();

        ctx.fillText(formatLabel(val), paddingLeft - 6, y + 3);
    });

    // Draw Target / Reference Bands
    if (currentChartMetric === 'mood') {
        const stableY = getYCoordinate(0, -5, 5, chartHeight, paddingTop);
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(paddingLeft, stableY);
        ctx.lineTo(width - paddingRight, stableY);
        ctx.stroke();
    } else if (currentChartMetric === 'sleep') {
        const sleepTargetTop = getYCoordinate(9, 0, 16, chartHeight, paddingTop);
        const sleepTargetBottom = getYCoordinate(6.5, 0, 16, chartHeight, paddingTop);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.07)';
        ctx.fillRect(paddingLeft, sleepTargetTop, chartWidth, sleepTargetBottom - sleepTargetTop);
    } else if (currentChartMetric === 'anxiety') {
        const anxLowTop = getYCoordinate(3, 0, 10, chartHeight, paddingTop);
        const anxLowBottom = getYCoordinate(0, 0, 10, chartHeight, paddingTop);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.06)';
        ctx.fillRect(paddingLeft, anxLowTop, chartWidth, anxLowBottom - anxLowTop);
    }

    // Map X & Y coordinates for each entry
    const points = [];
    const count = entries.length;

    entries.forEach((e, idx) => {
        const x = count === 1 
            ? paddingLeft + chartWidth / 2 
            : paddingLeft + (idx / (count - 1)) * chartWidth;
        
        let val = e.mood;
        if (currentChartMetric === 'sleep') val = e.sleep;
        else if (currentChartMetric === 'anxiety') val = e.anxiety;
        else if (currentChartMetric === 'energy') val = e.energy;

        points.push({
            x: x,
            y: getYCoordinate(val, minY, maxY, chartHeight, paddingTop),
            moodY: getYCoordinate(e.mood, -5, 5, chartHeight, paddingTop),
            sleepY: getYCoordinate(e.sleep, 0, 16, chartHeight, paddingTop),
            anxietyY: getYCoordinate(e.anxiety, 0, 10, chartHeight, paddingTop),
            energyY: getYCoordinate(e.energy, 0, 10, chartHeight, paddingTop),
            entry: e
        });
    });

    if (currentChartMetric !== 'all') {
        // Draw single metric line with gradient fill
        if (points.length > 1) {
            const areaGrad = ctx.createLinearGradient(0, paddingTop, 0, height - paddingBottom);
            areaGrad.addColorStop(0, gradientStart);
            areaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = areaGrad;
            ctx.beginPath();
            ctx.moveTo(points[0].x, height - paddingBottom);
            points.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.lineTo(points[points.length - 1].x, height - paddingBottom);
            ctx.closePath();
            ctx.fill();
        }

        // Main Stroke Line
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        points.forEach((p, idx) => {
            if (idx === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // Points
        points.forEach(p => {
            ctx.fillStyle = lineColor;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
    } else {
        // Draw all 4 lines (Mood, Sleep, Anxiety, Energy)
        const drawLine = (getY, color, isDashed = false) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            if (isDashed) ctx.setLineDash([4, 4]);
            else ctx.setLineDash([]);
            ctx.beginPath();
            points.forEach((p, idx) => {
                if (idx === 0) ctx.moveTo(p.x, getY(p));
                else ctx.lineTo(p.x, getY(p));
            });
            ctx.stroke();
            ctx.setLineDash([]);
        };

        drawLine(p => p.moodY, '#818cf8');
        drawLine(p => p.sleepY, '#38bdf8', true);
        drawLine(p => p.anxietyY, '#f59e0b', true);
        drawLine(p => p.energyY, '#10b981');
    }

    // X-Axis Date Labels
    ctx.fillStyle = '#64748b';
    ctx.font = '500 10px Inter';
    ctx.textAlign = 'center';

    points.forEach((p, idx) => {
        let drawLabel = true;
        if (count > 7 && currentChartPeriod === 30 && idx % 3 !== 0) drawLabel = false;
        if (count > 7 && currentChartPeriod === 90 && idx % 9 !== 0) drawLabel = false;
        
        if (drawLabel) {
            const dateObj = new Date(p.entry.date);
            const dayStr = dateObj.getDate().toString().padStart(2, '0');
            const monthStr = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            ctx.fillText(`${dayStr}/${monthStr}`, p.x, height - paddingBottom + 18);
        }
    });

    renderChartLegend();
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

// History Filter State
let currentHistoryFilter = 'all';

function setHistoryFilter(filterId) {
    currentHistoryFilter = filterId;
    document.querySelectorAll('.history-filter-pill').forEach(btn => {
        if (btn.getAttribute('data-filter') === filterId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    renderHistory();
}

function filterHistory() {
    renderHistory();
}

// Render History Journal Entries List (Grouped by Month & Scannable Compact Cards)
function renderHistory() {
    const list = document.getElementById('history-list');
    if (!list) return;
    list.innerHTML = '';

    if (moodEntries.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <p>Nu există nicio înregistrare salvată până acum.</p>
                <button class="action-btn-primary" onclick="switchTab('log')">Fă primul check-in</button>
            </div>
        `;
        return;
    }

    const searchVal = (document.getElementById('history-search')?.value || '').toLowerCase().trim();

    // Filter entries based on search input and active filter pill
    const filtered = moodEntries.filter(e => {
        // Text search
        if (searchVal) {
            const matchNotes = e.notes && e.notes.toLowerCase().includes(searchVal);
            const matchDate = e.date.includes(searchVal);
            const matchSymptoms = e.symptoms && e.symptoms.some(s => s.toLowerCase().includes(searchVal));
            if (!matchNotes && !matchDate && !matchSymptoms) return false;
        }

        // Active analytical filter
        if (currentHistoryFilter === 'mood-low') return e.mood < 0;
        if (currentHistoryFilter === 'mood-stable') return e.mood === 0;
        if (currentHistoryFilter === 'mood-high') return e.mood > 0;
        if (currentHistoryFilter === 'sleep-low') return e.sleep < 6;
        if (currentHistoryFilter === 'anxiety-high') return e.anxiety > 6;
        if (currentHistoryFilter === 'med-missed') return !e.medicationTaken;

        return true;
    });

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <p>Nicio înregistrare nu se potrivește filtrelor selectate.</p>
                <button class="action-btn-secondary btn-sm" onclick="setHistoryFilter('all')" style="margin-top:0.6rem">Resetează filtrele</button>
            </div>
        `;
        return;
    }

    // Sort newest first
    const sortedDesc = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Group by Month & Year (e.g. "AUGUST 2026")
    const groupedByMonth = {};
    sortedDesc.forEach(entry => {
        const dateObj = new Date(entry.date);
        const monthNamesRO = [
            "IANUARIE", "FEBRUARIE", "MARTIE", "APRILIE", "MAI", "IUNIE",
            "IULIE", "AUGUST", "SEPTEMBRIE", "OCTOMBRIE", "NOIEMBRIE", "DECEMBRIE"
        ];
        const monthYearKey = `${monthNamesRO[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
        if (!groupedByMonth[monthYearKey]) {
            groupedByMonth[monthYearKey] = [];
        }
        groupedByMonth[monthYearKey].push(entry);
    });

    // Render grouped months
    Object.keys(groupedByMonth).forEach(monthKey => {
        const monthEntries = groupedByMonth[monthKey];

        const monthGroup = document.createElement('div');
        monthGroup.className = 'history-month-group';

        const monthHeader = document.createElement('div');
        monthHeader.className = 'history-month-header';
        monthHeader.innerHTML = `
            <span class="month-title">${monthKey}</span>
            <span class="month-count">${monthEntries.length} ${monthEntries.length === 1 ? 'check-in' : 'check-in-uri'}</span>
        `;
        monthGroup.appendChild(monthHeader);

        const itemsBox = document.createElement('div');
        itemsBox.className = 'history-items-box';

        monthEntries.forEach(e => {
            const dateObj = new Date(e.date);
            const dayNum = dateObj.getDate().toString().padStart(2, '0');
            const monthShortNamesRO = ["JAN", "FEB", "MAR", "APR", "MAI", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
            const monthShort = monthShortNamesRO[dateObj.getMonth()];

            const moodSign = e.mood > 0 ? "+" : "";
            const moodValText = e.mood === 0 ? "0" : `${moodSign}${e.mood}`;

            // Build symptoms text preview
            let symptomsText = '';
            if (e.symptoms && e.symptoms.length > 0) {
                symptomsText = e.symptoms.map(s => capitalizeFirst(s)).join(', ');
            }

            const item = document.createElement('div');
            item.className = 'history-item-compact glass';
            item.setAttribute('data-id', e.date);
            item.onclick = () => showEntryDetailModal(e.date);

            item.innerHTML = `
                <div class="history-item-left">
                    <div class="history-date-badge">
                        <span class="day-num">${dayNum}</span>
                        <span class="month-name">${monthShort}</span>
                    </div>
                    <div class="history-metrics-row">
                        <span class="metric-chip mood-chip" style="background:${getMoodColor(e.mood)}">${moodValText}</span>
                        <span class="metric-chip sleep-chip">${e.sleep}h</span>
                        <span class="metric-chip anxiety-chip">anx. ${e.anxiety}</span>
                        <span class="metric-chip energy-chip">en. ${e.energy}</span>
                    </div>
                </div>

                <div class="history-item-right" onclick="event.stopPropagation()">
                    <div class="history-sub-info">
                        <span class="med-tag ${e.medicationTaken ? 'yes' : 'no'}">${e.medicationTaken ? '✓ Tratament' : '✗ Fără tratament'}</span>
                        ${symptomsText ? `<span class="symptoms-summary-tag">${symptomsText}</span>` : ''}
                    </div>
                    <div class="history-actions-inline">
                        <button class="btn-detail-link" onclick="showEntryDetailModal('${e.date}')">Vezi detalii →</button>
                        <button class="btn-edit-action" onclick="editEntry('${e.date}')">✏️ Editează</button>
                        <button class="btn-delete-action" onclick="deleteEntry('${e.date}')" title="Șterge">🗑️</button>
                    </div>
                </div>
            `;
            itemsBox.appendChild(item);
        });

        monthGroup.appendChild(itemsBox);
        list.appendChild(monthGroup);
    });
}

function showEntryDetailModal(dateStr) {
    const entry = moodEntries.find(e => e.date === dateStr);
    if (!entry) return;

    const modal = document.getElementById('entry-detail-modal');
    if (!modal) return;

    document.getElementById('detail-modal-date').textContent = formatDateRO(entry.date);
    
    const moodSign = entry.mood > 0 ? "+" : "";
    document.getElementById('detail-mood').textContent = entry.mood === 0 ? "0 (Stabil)" : `${moodSign}${entry.mood}`;
    document.getElementById('detail-sleep').textContent = `${entry.sleep}h`;
    document.getElementById('detail-anxiety').textContent = `${entry.anxiety} / 10`;
    document.getElementById('detail-energy').textContent = `${entry.energy} / 10`;
    document.getElementById('detail-medication').textContent = entry.medicationTaken 
        ? "✓ Am urmat tratamentul prescris astăzi" 
        : "✗ Nu am urmat tratamentul pentru această zi";

    // Symptoms
    const symptomsBox = document.getElementById('detail-symptoms-box');
    const symptomsList = document.getElementById('detail-symptoms-list');
    if (entry.symptoms && entry.symptoms.length > 0) {
        symptomsBox.style.display = 'block';
        symptomsList.innerHTML = entry.symptoms.map(s => `<span class="symptom-tag-pill">${capitalizeFirst(s)}</span>`).join('');
    } else {
        symptomsBox.style.display = 'none';
    }

    // Notes
    const notesBox = document.getElementById('detail-notes-box');
    const notesText = document.getElementById('detail-notes-text');
    if (entry.notes && entry.notes.trim()) {
        notesBox.style.display = 'block';
        notesText.textContent = entry.notes;
    } else {
        notesBox.style.display = 'none';
    }

    // Action buttons
    const btnEdit = document.getElementById('detail-btn-edit');
    const btnDelete = document.getElementById('detail-btn-delete');

    if (btnEdit) btnEdit.onclick = () => { closeEntryDetailModal(); editEntry(dateStr); };
    if (btnDelete) btnDelete.onclick = () => { closeEntryDetailModal(); deleteEntry(dateStr); };

    modal.style.display = 'flex';
}

function closeEntryDetailModal() {
    const modal = document.getElementById('entry-detail-modal');
    if (modal) modal.style.display = 'none';
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

// Purge Local Storage Data (Safe Targeted Key Removal)
function clearAllData() {
    if (confirm("ATENȚIE: Sigur dorești să ștergi DEFINITIV toate datele înregistrate? Această acțiune nu poate fi anulată!")) {
        if (confirm("Vă rugăm să confirmați încă o dată că doriți ștergerea completă a bazei de date locale.")) {
            // Remove Staicumine & legacy Equilibrium keys specifically (never call localStorage.clear()!)
            const keysToRemove = [
                'staicumine_mood_entries',
                'staicumine_safety_plan',
                'staicumine_initialized',
                'staicumine_is_demo',
                'staicumine_onboarding_done',
                'staicumine_checkin_draft',
                'staicumine_last_backup_date',
                'staicumine_backup_banner_closed_at',
                'equilibrium_mood_entries',
                'equilibrium_safety_plan',
                'equilibrium_is_demo',
                'equilibrium_last_backup_date',
                'equilibrium_backup_banner_closed_at'
            ];
            
            keysToRemove.forEach(key => localStorage.removeItem(key));

            moodEntries = [];
            safetyPlan = { docName: '', therapistName: '', emergencyName: '', triggers: '', coping: '' };
            
            // Reset input fields
            const docNameEl = document.getElementById('safety-doc-name');
            const therapistNameEl = document.getElementById('safety-therapist-name');
            const emergencyNameEl = document.getElementById('safety-emergency-name');
            const triggersEl = document.getElementById('safety-triggers');
            const copingEl = document.getElementById('safety-coping');

            if (docNameEl) docNameEl.value = '';
            if (therapistNameEl) therapistNameEl.value = '';
            if (emergencyNameEl) emergencyNameEl.value = '';
            if (triggersEl) triggersEl.value = '';
            if (copingEl) copingEl.value = '';
            
            showToast("Toate datele Staicumine au fost șterse definitiv.");
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

// Crisis Help Modal Handler
function openCrisisHelpModal() {
    const modal = document.getElementById('crisis-help-modal');
    if (!modal) return;

    const nameEl = document.getElementById('crisis-trust-name');
    const phoneLink = document.getElementById('crisis-trust-phone-link');

    if (typeof safetyPlan !== 'undefined' && safetyPlan && safetyPlan.emergencyName) {
        const contactVal = safetyPlan.emergencyName.trim();
        if (nameEl) nameEl.textContent = contactVal;
        if (phoneLink) {
            // Check if contactVal contains phone numbers
            const digitsMatch = contactVal.match(/[\d\s+()-]{5,}/);
            if (digitsMatch) {
                const phoneDigits = digitsMatch[0].replace(/[^\d+]/g, '');
                phoneLink.href = `tel:${phoneDigits}`;
                phoneLink.textContent = `📞 Sună (${phoneDigits})`;
            } else {
                phoneLink.href = "#";
                phoneLink.textContent = "📞 Sună";
            }
            phoneLink.onclick = null;
        }
    } else {
        if (nameEl) nameEl.textContent = "Neconfigurată în Planul de Siguranță.";
        if (phoneLink) {
            phoneLink.href = "#";
            phoneLink.textContent = "⚙️ Configurează în Plan";
            phoneLink.onclick = (e) => {
                e.preventDefault();
                closeCrisisHelpModal();
                switchTab('safety');
            };
        }
    }

    modal.style.display = 'flex';
}

function closeCrisisHelpModal() {
    const modal = document.getElementById('crisis-help-modal');
    if (modal) modal.style.display = 'none';
}

function startCrisisBreathing() {
    closeCrisisHelpModal();
    navigateToBreathingExercise();
}

function navigateToBreathingExercise() {
    switchTab('safety');
    setTimeout(() => {
        const targetElement = document.getElementById('breathing-widget-container') || document.querySelector('.actionable-guide-card') || document.getElementById('breathing-circle');
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetElement.classList.add('highlight-pulse');
            setTimeout(() => targetElement.classList.remove('highlight-pulse'), 1500);
        }
        if (!breathingActive) {
            toggleBreathingExercise();
        }
    }, 250);
}

// Articles & Guides expand/collapse handler
function toggleGuideReadMore(guideId) {
    const content = document.getElementById(`guide-content-${guideId}`);
    const btn = document.getElementById(`btn-toggle-${guideId}`);
    const chevron = document.getElementById(`chevron-${guideId}`);
    if (!content || !btn) return;

    const spanText = btn.querySelector('span');

    if (content.style.display === 'none' || !content.style.display) {
        content.style.display = 'block';
        if (spanText) spanText.textContent = 'Ascunde articolul';
        if (chevron) chevron.style.transform = 'rotate(180deg)';
    } else {
        content.style.display = 'none';
        if (spanText) spanText.textContent = 'Citește articolul explicativ';
        if (chevron) chevron.style.transform = 'rotate(0deg)';
    }
}
