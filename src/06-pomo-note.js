/* =========================================================================
   06-POMO-NOTE.JS (v17.2 PURE DESKTOP EDITION — PLUG-AND-PLAY MODULE)
   POMONOTE & HYBRID SCRATCHPAD: MULTI-PAGE A4 NOTEBOOK, PAGE COLOR &
   GEOMETRICAL PAPER CHANGER (WHITE, BLACK, GEOMETRICAL, MUDDY GREEN, RULED,
   CUSTOM COLOR), UNIFIED POMOREADER TOOL INTEGRATION (ZERO DUPLICATION),
   4-TAB CHEM/RINGS/MATH/MEDICAL DOCK, LINE NOTE VIEWER & GLOBAL NOTES HUB
   ========================================================================= */
(function() {
    window.haptic = window.haptic || function() {};
    window.escapeJsStr = window.escapeJsStr || function(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '&quot;')
            .replace(/\r?\n/g, ' ');
    };

    function getActiveBook() {
        return window.PomoReaderCore ? window.PomoReaderCore.getActiveBook() : null;
    }

    // Inject PomoNote Page Color & Geometrical Paper CSS Styles dynamically so 06-pomo-note.js is 100% self-contained
    (function injectPomoNotePaperStyles() {
        if (document.getElementById('pomonote-dynamic-paper-styles')) return;
        const st = document.createElement('style');
        st.id = 'pomonote-dynamic-paper-styles';
        st.textContent = `
            .pomonote-a4-sheet.paper-white {
                background-color: #ffffff !important;
                color: #0f172a !important;
                background-image: none !important;
            }
            .pomonote-a4-sheet.paper-black {
                background-color: #000000 !important;
                color: #f8fafc !important;
                background-image: none !important;
                border: 1px solid #1e293b;
            }
            .pomonote-a4-sheet.paper-geometrical {
                background-color: #071324 !important;
                color: #e0f2fe !important;
                background-size: 40px 40px, 40px 40px, 20px 20px, 20px 20px, 40px 40px;
                background-image:
                    linear-gradient(to right, rgba(56, 189, 248, 0.24) 1.2px, transparent 1.2px),
                    linear-gradient(to bottom, rgba(56, 189, 248, 0.24) 1.2px, transparent 1.2px),
                    linear-gradient(to right, rgba(56, 189, 248, 0.08) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(56, 189, 248, 0.08) 1px, transparent 1px),
                    linear-gradient(30deg, rgba(16, 185, 129, 0.08) 1px, transparent 1px);
            }
            .pomonote-a4-sheet.paper-geo-white {
                background-color: #ffffff !important;
                color: #0f172a !important;
                background-size: 40px 40px, 40px 40px, 10px 10px, 10px 10px;
                background-image:
                    linear-gradient(to right, rgba(37, 99, 235, 0.28) 1.2px, transparent 1.2px),
                    linear-gradient(to bottom, rgba(37, 99, 235, 0.28) 1.2px, transparent 1.2px),
                    linear-gradient(to right, rgba(59, 130, 246, 0.11) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(59, 130, 246, 0.11) 1px, transparent 1px);
            }
            .pomonote-a4-sheet.paper-ruled-white {
                background-color: #ffffff !important;
                color: #0f172a !important;
                background-image:
                    linear-gradient(90deg, transparent 42px, rgba(239, 68, 68, 0.45) 42px, rgba(239, 68, 68, 0.45) 44px, transparent 44px),
                    repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, rgba(59, 130, 246, 0.28) 28px) !important;
                padding-left: 3.4rem !important;
            }
            .pomonote-a4-sheet.paper-muddy {
                background-color: #dce6d9 !important;
                color: #18241b !important;
                background-image: repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, rgba(24, 36, 27, 0.12) 28px) !important;
            }
            .pomonote-a4-sheet.paper-sepia {
                background-color: #f4ecd8 !important;
                color: #3b2f2f !important;
                background-image: repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, rgba(120, 53, 15, 0.14) 28px) !important;
            }
            .pomonote-text-editor:empty:before {
                content: attr(data-placeholder);
                color: rgba(148, 163, 184, 0.55);
                pointer-events: none;
                display: block;
            }
        `;
        document.head.appendChild(st);
    })();

    /* =========================================================================
       1. BOOK-BOUND POMONOTE STATE, TWO-TIER DEBOUNCED AUTO-SAVE, OFFLINE
          QUEUE, CLOUD DELETION TOMBSTONES & LIVE SYNC STATUS PILL
       ========================================================================= */
    function createDefaultBookNoteState(bookTitle = '') {
        return {
            bookId: getActiveBook()?.id || 'global_standalone',
            activePageIndex: 0,
            inputMode: 'hybrid', // 'hybrid' | 'type' | 'draw'
            activeSymbolTab: 'chem', // 'chem' | 'rings' | 'math' | 'med'
            isFloating: false,
            updatedAt: Date.now(),
            deletedIds: [],
            pages: [
                {
                    id: 'pnote_1',
                    title: bookTitle ? `${bookTitle.slice(0, 28)} — Note 1` : 'PomoNote Revision Sheet 1',
                    paperStyle: 'ruled',
                    customBgColor: '',
                    textContent: bookTitle ? '' : safeGet('pages_pomodoro_scratchpad_v12', ''),
                    snippedImages: [],
                    updatedAt: Date.now()
                }
            ],
            annotations: [] // Shared vector strokes, highlights, occlusion masks & bookmarks per page (1-based)
        };
    }

    let pomoNoteDebounceTimer = null;

    window.updatePomoNoteSyncPill = function(status = 'synced') {
        const pill = document.getElementById('pomonote-sync-status-pill');
        if (!pill) return;
        if (!navigator.onLine || status === 'offline') {
            pill.className = "text-[9px] font-mono font-extrabold bg-amber-950/90 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 transition-all";
            pill.innerHTML = `<span>💾</span><span>Queued Offline</span>`;
            pill.title = "Saved to LocalStorage — Queued to sync to Firestore when online";
        } else if (status === 'syncing') {
            pill.className = "text-[9px] font-mono font-extrabold bg-blue-950/90 text-cyan-300 border border-cyan-500/50 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 transition-all";
            pill.innerHTML = `<span class="inline-block animate-spin">↻</span><span>Syncing...</span>`;
            pill.title = "Syncing PomoNote changes & deletions to Firestore...";
        } else {
            pill.className = "text-[9px] font-mono font-extrabold bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 transition-all";
            pill.innerHTML = `<span>✓</span><span>Synced</span>`;
            pill.title = "All PomoNote changes & deletions synced with this Book in Cloud";
        }
    };

    function markBookQueuedForCloudSync(bookId) {
        if (!bookId) return;
        const q = JSON.parse(safeGet('pages_pomodoro_pomonote_sync_q_v17', '[]'));
        if (!q.includes(bookId)) {
            q.push(bookId);
            safeSet('pages_pomodoro_pomonote_sync_q_v17', JSON.stringify(q));
        }
    }

    function clearBookFromCloudSyncQueue(bookId) {
        const q = JSON.parse(safeGet('pages_pomodoro_pomonote_sync_q_v17', '[]')).filter(id => id !== bookId);
        safeSet('pages_pomodoro_pomonote_sync_q_v17', JSON.stringify(q));
    }

    window.flushPomoNoteOfflineQueueToFirestore = async function() {
        if (!navigator.onLine) {
            window.updatePomoNoteSyncPill('offline');
            return;
        }
        const q = JSON.parse(safeGet('pages_pomodoro_pomonote_sync_q_v17', '[]'));
        if (!q.length) {
            window.updatePomoNoteSyncPill('synced');
            return;
        }

        window.updatePomoNoteSyncPill('syncing');
        const roomId = safeGet('pages_pomodoro_sync_room', '');
        const localMap = JSON.parse(safeGet('pages_pomodoro_pomonote_by_book_v17', '{}'));

        if (roomId && typeof firebase !== 'undefined' && firebase.apps?.length) {
            try {
                const db = firebase.firestore();
                for (const bId of q) {
                    const noteData = localMap[bId];
                    if (noteData) {
                        await db.collection('artifacts').doc('neettimercloud')
                            .collection('public').doc('data')
                            .collection('sync_rooms').doc(roomId)
                            .collection('reader_pro').doc('pomonote_' + bId)
                            .set({ bookId: bId, pomoNote: noteData, updatedAt: noteData.updatedAt || Date.now() }, { merge: true });
                    }
                    clearBookFromCloudSyncQueue(bId);
                }
            } catch (e) {}
        } else {
            q.forEach(bId => clearBookFromCloudSyncQueue(bId));
        }

        if (window.saveReaderMeta) window.saveReaderMeta(false);
        setTimeout(() => window.updatePomoNoteSyncPill('synced'), 450);
    };

    window.scheduleDebouncedPomoNoteCloudSync = function() {
        if (!navigator.onLine) {
            window.updatePomoNoteSyncPill('offline');
            return;
        }
        window.updatePomoNoteSyncPill('syncing');
        clearTimeout(pomoNoteDebounceTimer);
        pomoNoteDebounceTimer = setTimeout(() => {
            window.flushPomoNoteOfflineQueueToFirestore();
        }, 850);
    };

    window.syncPomoNoteWithActiveBook = function() {
        const activeBook = getActiveBook();
        const targetBookId = activeBook ? activeBook.id : 'global_standalone';

        if (activeBook) {
            const localMap = JSON.parse(safeGet('pages_pomodoro_pomonote_by_book_v17', '{}'));
            const localSaved = localMap[targetBookId];
            if (!activeBook.pomoNote && localSaved) {
                activeBook.pomoNote = localSaved;
            } else if (activeBook.pomoNote && localSaved && (localSaved.updatedAt || 0) > (activeBook.pomoNote.updatedAt || 0)) {
                activeBook.pomoNote = localSaved;
            }
            if (!activeBook.pomoNote || !Array.isArray(activeBook.pomoNote.pages) || !activeBook.pomoNote.pages.length) {
                activeBook.pomoNote = createDefaultBookNoteState(activeBook.title);
            }
            if (!Array.isArray(activeBook.pomoNote.annotations)) activeBook.pomoNote.annotations = [];
            if (!Array.isArray(activeBook.pomoNote.deletedIds)) activeBook.pomoNote.deletedIds = [];
            window.pomoNoteState = activeBook.pomoNote;

            // Hydrate any IndexedDB snipped images for this book
            idbGet('steelSnapshots', 'pomonote_book_' + activeBook.id).then(snap => {
                if (snap?.state?.pages && window.pomoNoteState === activeBook.pomoNote) {
                    snap.state.pages.forEach((sp, idx) => {
                        if (window.pomoNoteState.pages[idx] && Array.isArray(sp.snippedImages) && sp.snippedImages.length) {
                            window.pomoNoteState.pages[idx].snippedImages = sp.snippedImages.filter(
                                sn => !(window.pomoNoteState.deletedIds || []).includes(sn.id)
                            );
                        }
                    });
                }
            }).catch(() => {});
        } else {
            const standalone = JSON.parse(safeGet('pages_pomodoro_pomonote_book_v17', 'null')) || createDefaultBookNoteState('');
            if (!Array.isArray(standalone.pages) || !standalone.pages.length) standalone.pages = createDefaultBookNoteState('').pages;
            if (!Array.isArray(standalone.annotations)) standalone.annotations = [];
            if (!Array.isArray(standalone.deletedIds)) standalone.deletedIds = [];
            window.pomoNoteState = standalone;
        }

        if (document.getElementById('reader-split-scratchpad')) {
            renderPomoNoteInterior();
        }
        return window.pomoNoteState;
    };

    window.syncPomoNoteWithActiveBook();

    // Virtual Book Object passed into PomoReader's SVG & Selection Engine so ALL PomoReader tools work on PomoNote!
    const pomoNoteVirtualBook = {
        id: 'pomonote_virtual_book',
        title: 'PomoNote Revision Notebook',
        shelfName: 'PomoNote Scratchpad',
        format: 'pbook',
        get totalPages() { return window.pomoNoteState.pages.length; },
        get currentPage() { return (window.pomoNoteState.activePageIndex || 0) + 1; },
        get annotations() { return window.pomoNoteState.annotations; },
        set annotations(val) { window.pomoNoteState.annotations = Array.isArray(val) ? val : []; },
        deletedAnnotationIds: [],
        rev: 1,
        lastModified: Date.now()
    };

    window.savePomoNoteState = function(silent = false) {
        const activeBook = getActiveBook();
        const st = window.pomoNoteState;
        const now = Date.now();
        const curSheet = st.pages[st.activePageIndex || 0];
        const editorEl = document.getElementById('pomonote-live-editor');
        const titleEl = document.getElementById('pomonote-sheet-title-inp');

        if (curSheet && editorEl) {
            curSheet.textContent = editorEl.innerText || '';
            curSheet.updatedAt = now;
            if (!activeBook && st.activePageIndex === 0) {
                safeSet('pages_pomodoro_scratchpad_v12', curSheet.textContent);
            }
        }
        if (curSheet && titleEl) {
            curSheet.title = titleEl.value.trim() || `PomoNote Revision Sheet ${(st.activePageIndex || 0) + 1}`;
            curSheet.updatedAt = now;
        }
        st.updatedAt = now;

        if (activeBook) {
            st.bookId = activeBook.id;
            const slimPages = (st.pages || []).map(p => ({
                ...p,
                snippedImages: (p.snippedImages || []).map(sn => ({ id: sn.id, hasIdbSnip: true }))
            }));
            const slimNoteState = { ...st, pages: slimPages, updatedAt: now };
            activeBook.pomoNote = slimNoteState;
            activeBook.rev = (activeBook.rev || 1) + 1;
            activeBook.lastModified = now;
            activeBook.pendingCloudSync = true;

            // Tier 1: 0ms Instant LocalStorage + IndexedDB Commit
            const localMap = JSON.parse(safeGet('pages_pomodoro_pomonote_by_book_v17', '{}'));
            localMap[activeBook.id] = slimNoteState;
            safeSet('pages_pomodoro_pomonote_by_book_v17', JSON.stringify(localMap));
            idbPut('steelSnapshots', { key: 'pomonote_book_' + activeBook.id, state: st, updatedAt: now });
            if (window.saveReaderMeta) window.saveReaderMeta(true);

            // Tier 2: Queue for Firestore & Trigger 850ms Debounced Sync
            markBookQueuedForCloudSync(activeBook.id);
            window.scheduleDebouncedPomoNoteCloudSync();
        } else {
            safeSet('pages_pomodoro_pomonote_book_v17', JSON.stringify(st));
            idbPut('steelSnapshots', { key: 'pomonote_backup_v17', state: st, updatedAt: now });
            window.scheduleDebouncedPomoNoteCloudSync();
        }

        if (!silent) {
            showToast(navigator.onLine
                ? `☁️ PomoNote saved & syncing with "${activeBook ? activeBook.title.slice(0, 24) : 'Notebook'}"!`
                : `💾 Offline: Saved to LocalStorage (Queued for Cloud sync)`);
        }
    };

    window.addEventListener('online', () => {
        window.flushPomoNoteOfflineQueueToFirestore();
    });

    /* =========================================================================
       2. SCIENTIFIC, CHEMICAL, GEOMETRICAL & MEDICAL SYMBOL BANKS (4 TABS)
       ========================================================================= */
    const SYMBOL_BANKS = {
        chem: [
            '→', '⇌', '↔', '↑', '↓', '—(Δ)→', '—(hν)→', '—(cat.)→', 'ΔG°', 'ΔH°', 'ΔS°',
            'K_eq', 'K_c', 'K_p', 'K_sp', 'K_a', 'K_b', 'pK_a', 'pK_b', 'pH = -log[H⁺]',
            'E°_cell = E°_cathode - E°_anode', 'sp³', 'sp²', 'sp', 'dsp²', 'd²sp³',
            'σ-bond', 'π-bond', 'δ⁺', 'δ⁻', '⊕', '⊖', '• (Radical)', ': (Lone Pair)',
            '-OH', '-COOH', '-CHO', '-CO-', '-NH₂', '-CN', '-NO₂', '-SO₃H', '-X (Halogen)',
            'SN1', 'SN2', 'E1', 'E2', '+I Effect', '-I Effect', '+M / +R', '-M / -R'
        ],
        math: [
            '∫', '∮', 'd/dx', '∂/∂x', '∇', 'Δ', '∑', '∏', '√x', '∛x', '∞', '≈', '≠', '≤', '≥', '±', '∝',
            '⇒', '⇔', 'A⃗·B⃗', 'A⃗×B⃗', 'î', 'ĵ', 'k̂', 'θ', 'ω', 'α', 'β', 'γ', 'λ', 'μ', 'π', 'Ω',
            'sin²θ + cos²θ = 1', 'sin(2θ) = 2sinθcosθ', 'v = ds/dt', 'a = dv/dt', 'W = ∫ F·dx',
            'aₙ = a + (n-1)d', 'S∞ = a/(1-r)', 'y = mx + c', 'ln(x)', 'log₁₀(x)', 'eˣ'
        ],
        med: [
            '↑↑', '↓↓', '⇒', '⊣ (Inhibits)', 'α₁', 'α₂', 'β₁', 'β₂', 'M₁–M₅', 'GFR',
            'CO = HR × SV', 'BP = CO × TPR', 'MAP = DBP + ⅓(SBP-DBP)', 'Na⁺/K⁺-ATPase',
            'Ca²⁺', 'H⁺/K⁺', 'Cl⁻', 'HCO₃⁻', 'ATP → ADP + Pi', 'NADH', 'FADH₂',
            'cAMP', 'IP₃ / DAG', 'DNA → mRNA → Protein', 't½ = 0.693 / k', 'V_max', 'K_m',
            'pH = 6.1 + log([HCO₃⁻] / 0.03·P_CO₂)'
        ]
    };

    const VECTOR_RING_STAMPS = [
        { id: 'benzene', label: '⬡ Benzene Ring' },
        { id: 'cyclohexane', label: '⬢ Cyclohexane' },
        { id: 'chair', label: '🪑 Chair Conformation' },
        { id: 'cyclopentane', label: '⬠ Cyclopentane' },
        { id: 'axes_xy', label: '📈 2D Graph Axes (x,y)' },
        { id: 'axes_xyz', label: '🧭 3D Vector Axes (x,y,z)' },
        { id: 'energy_curve', label: '⚡ Activation Energy Curve' },
        { id: 'triangle_right', label: '📐 Right Triangle (θ)' }
    ];

    window.insertSymbolIntoPomoNote = function(symStr) {
        const editor = document.getElementById('pomonote-live-editor');
        if (!editor) return;
        editor.focus();
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            const textNode = document.createTextNode(symStr + ' ');
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            sel.removeAllRanges();
            sel.addRange(range);
        } else {
            editor.innerText += (editor.innerText.endsWith(' ') || !editor.innerText ? '' : ' ') + symStr + ' ';
        }
        window.savePomoNoteState(true);
    };

    window.stampVectorStructureOnPomoNote = function(stampId) {
        const pageNum = (window.pomoNoteState.activePageIndex || 0) + 1;
        const color = document.getElementById('v4-pencil-color')?.value || '#38bdf8';
        const cx = 0.50 + (Math.random() * 0.16 - 0.08);
        const cy = 0.35 + (Math.random() * 0.16 - 0.08);
        const rx = 0.08, ry = 0.06;
        const newShapes = [];
        const addLine = (p1, p2, shapeType = 'line') => {
            newShapes.push({
                id: 'draw_' + Date.now() + '_' + Math.floor(Math.random() * 99999),
                page: pageNum,
                type: 'drawing',
                shapeType,
                color,
                strokeWidth: 3,
                points: [p1, p2],
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
        };

        if (stampId === 'cyclohexane' || stampId === 'benzene') {
            const pts = [];
            for (let i = 0; i < 6; i++) {
                const ang = (Math.PI / 6) + (i * Math.PI / 3);
                pts.push({ x: +(cx + rx * Math.cos(ang)).toFixed(4), y: +(cy + ry * Math.sin(ang)).toFixed(4) });
            }
            pts.push(pts[0]);
            newShapes.push({
                id: 'draw_' + Date.now() + '_hex',
                page: pageNum,
                type: 'drawing',
                shapeType: 'pencil',
                color,
                strokeWidth: 3,
                points: pts,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
            if (stampId === 'benzene') {
                newShapes.push({
                    id: 'draw_' + Date.now() + '_ring',
                    page: pageNum,
                    type: 'drawing',
                    shapeType: 'circle',
                    color,
                    strokeWidth: 2.5,
                    points: [{ x: cx - rx * 0.52, y: cy - ry * 0.52 }, { x: cx + rx * 0.52, y: cy + ry * 0.52 }],
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                });
            }
        } else if (stampId === 'cyclopentane') {
            const pts = [];
            for (let i = 0; i < 5; i++) {
                const ang = -Math.PI / 2 + (i * 2 * Math.PI / 5);
                pts.push({ x: +(cx + rx * Math.cos(ang)).toFixed(4), y: +(cy + ry * Math.sin(ang)).toFixed(4) });
            }
            pts.push(pts[0]);
            newShapes.push({
                id: 'draw_' + Date.now() + '_pent',
                page: pageNum,
                type: 'drawing',
                shapeType: 'pencil',
                color,
                strokeWidth: 3,
                points: pts,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
        } else if (stampId === 'chair') {
            const pts = [
                { x: cx - 0.11, y: cy + 0.02 },
                { x: cx - 0.04, y: cy - 0.03 },
                { x: cx + 0.03, y: cy + 0.01 },
                { x: cx + 0.11, y: cy - 0.02 },
                { x: cx + 0.04, y: cy + 0.03 },
                { x: cx - 0.03, y: cy - 0.01 },
                { x: cx - 0.11, y: cy + 0.02 }
            ];
            newShapes.push({
                id: 'draw_' + Date.now() + '_chair',
                page: pageNum,
                type: 'drawing',
                shapeType: 'pencil',
                color,
                strokeWidth: 3,
                points: pts,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
        } else if (stampId === 'axes_xy') {
            addLine({ x: cx - 0.14, y: cy + 0.08 }, { x: cx - 0.14, y: cy - 0.08 }, 'arrow');
            addLine({ x: cx - 0.14, y: cy + 0.08 }, { x: cx + 0.14, y: cy + 0.08 }, 'arrow');
        } else if (stampId === 'axes_xyz') {
            addLine({ x: cx, y: cy }, { x: cx, y: cy - 0.09 }, 'arrow');
            addLine({ x: cx, y: cy }, { x: cx + 0.13, y: cy }, 'arrow');
            addLine({ x: cx, y: cy }, { x: cx - 0.09, y: cy + 0.06 }, 'arrow');
        } else if (stampId === 'energy_curve') {
            addLine({ x: cx - 0.15, y: cy + 0.08 }, { x: cx - 0.15, y: cy - 0.08 }, 'arrow');
            addLine({ x: cx - 0.15, y: cy + 0.08 }, { x: cx + 0.15, y: cy + 0.08 }, 'arrow');
            const curvePts = [];
            for (let t = 0; t <= 20; t++) {
                const u = t / 20;
                const px = (cx - 0.13) + u * 0.25;
                const py = (cy + 0.04) - Math.exp(-Math.pow((u - 0.45) * 4.2, 2)) * 0.10 + (u > 0.5 ? 0.02 : 0);
                curvePts.push({ x: +px.toFixed(4), y: +py.toFixed(4) });
            }
            newShapes.push({
                id: 'draw_' + Date.now() + '_ecurve',
                page: pageNum,
                type: 'drawing',
                shapeType: 'pencil',
                color: '#f59e0b',
                strokeWidth: 3,
                points: curvePts,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
        } else if (stampId === 'triangle_right') {
            const pts = [
                { x: cx - 0.09, y: cy + 0.06 },
                { x: cx + 0.09, y: cy + 0.06 },
                { x: cx + 0.09, y: cy - 0.06 },
                { x: cx - 0.09, y: cy + 0.06 }
            ];
            newShapes.push({
                id: 'draw_' + Date.now() + '_tri',
                page: pageNum,
                type: 'drawing',
                shapeType: 'pencil',
                color,
                strokeWidth: 3,
                points: pts,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
        }

        window.pomoNoteState.annotations.push(...newShapes);
        window.savePomoNoteState(true);
        refreshPomoNoteSheetSvg();
        showToast("⬡ Stamped vector diagram onto PomoNote sheet! (Use 🖐️ Select in top bar to move/resize)");
    };

    /* =========================================================================
       3. POMONOTE & HYBRID SCRATCHPAD UI (MATCHES IMAGE 3 + PAGE COLOR CHANGER)
       ========================================================================= */
    window.openStandalonePomoNoteFromShelf = function() {
        const ov = document.getElementById('reader-fullscreen-overlay');
        if (ov && ov.classList.contains('hidden')) {
            if (window.readerBooks?.length && window.openBookAtPage) {
                window.openBookAtPage(window.readerBooks[0].id, window.readerBooks[0].currentPage || 1).then(() => {
                    if (!document.getElementById('reader-split-scratchpad')) window.toggleSplitScreenScratchpad();
                });
                return;
            }
            ov.classList.remove('hidden');
        }
        if (!document.getElementById('reader-split-scratchpad')) {
            window.toggleSplitScreenScratchpad();
        }
    };

    // UI state for OneNote Popover Dropdowns & Slide-Over Pages Drawer (0px wasted vertical space!)
    let activeOneNoteDropdown = null; // 'paper' | 'symbols' | 'actions' | null
    let isPagesDrawerOpen = false;

    function getSavedSplitWidthPct() {
        const raw = parseFloat(safeGet('pomo_onenote_split_pct_v18', '50'));
        return Number.isFinite(raw) ? Math.max(28, Math.min(72, raw)) : 50;
    }

    function applyPomoNoteLayoutGeometry(triggerBookRefit = false) {
        const pane = document.getElementById('reader-split-scratchpad');
        const overlay = document.getElementById('reader-fullscreen-overlay');
        if (!pane || !overlay) return;

        const st = window.pomoNoteState || {};
        if (!st.layoutMode) {
            st.layoutMode = st.isFloating ? 'float' : 'split';
        }
        const mode = st.layoutMode;
        const splitPct = getSavedSplitWidthPct();
        const topBarEl = document.getElementById('reader-top-bar');
        const topBarH = topBarEl ? Math.max(36, Math.round(topBarEl.getBoundingClientRect().height)) : 42;

        pane.classList.remove('onenote-mode-split', 'onenote-mode-float', 'onenote-mode-max');
        overlay.classList.remove('pomonote-split-active');

        if (mode === 'split') {
            st.isFloating = false;
            pane.classList.add('onenote-mode-split');
            overlay.classList.add('pomonote-split-active');
            overlay.style.setProperty('--pomonote-split-w', `${splitPct}%`);
            pane.style.width = `${splitPct}%`;
            pane.style.maxWidth = `${splitPct}%`;
            pane.style.left = `${+(100 - splitPct).toFixed(1)}%`;
            pane.style.right = '0px';
            pane.style.top = `${topBarH}px`;
            pane.style.bottom = '0px';
            pane.style.height = `calc(100dvh - ${topBarH}px)`;
            if (triggerBookRefit) {
                setTimeout(() => window.PomoReaderCore?.fitBookToViewportWidth?.(), 40);
            }
        } else if (mode === 'max') {
            st.isFloating = false;
            pane.classList.add('onenote-mode-max');
            overlay.style.removeProperty('--pomonote-split-w');
            pane.style.width = '96vw';
            pane.style.maxWidth = '96vw';
            pane.style.height = `calc(100dvh - ${topBarH + 8}px)`;
            pane.style.top = `${topBarH + 4}px`;
            pane.style.bottom = '4px';
            pane.style.right = '2vw';
            pane.style.left = '2vw';
        } else {
            // 'float' mode (Draggable & Resizable floating window)
            st.isFloating = true;
            pane.classList.add('onenote-mode-float');
            overlay.style.removeProperty('--pomonote-split-w');
            pane.style.width = st.floatWidth || '560px';
            pane.style.maxWidth = '94vw';
            pane.style.height = st.floatHeight || '82vh';
            pane.style.top = st.floatTop || `${topBarH + 8}px`;
            pane.style.right = st.floatLeft ? 'auto' : '1rem';
            pane.style.left = st.floatLeft || 'auto';
            pane.style.bottom = 'auto';
            if (triggerBookRefit) {
                setTimeout(() => window.PomoReaderCore?.fitBookToViewportWidth?.(), 40);
            }
        }
        window.syncPencilToolbarVerticalDock?.(true);
        window.syncPencilSplit5050BtnUI?.();
    }

    window.setPomoNoteLayoutMode = function(mode) {
        if (!window.pomoNoteState) return;
        if (mode === 'split') {
            safeSet('pomo_onenote_split_pct_v18', '50');
            if (window.readerSettings) window.readerSettings.split5050PomoNote = true;
            window.saveReaderMeta?.(true);
        } else if (window.readerSettings) {
            window.readerSettings.split5050PomoNote = false;
            window.saveReaderMeta?.(true);
        }
        window.pomoNoteState.layoutMode = mode;
        window.pomoNoteState.isFloating = (mode === 'float');
        window.savePomoNoteState(true);
        applyPomoNoteLayoutGeometry(true);
        renderPomoNoteInterior();
        window.syncPencilSplit5050BtnUI?.();
        const modeLabels = {
            split: '◫ 50/50 Split-Screen Active (Left Half Book • Right Half PomoNote)',
            float: '❐ Floating Window Mode Active (Drag header to move)',
            max: '⛶ Maximized OneNote Desktop Canvas Active'
        };
        showToast(modeLabels[mode] || 'Layout updated');
    };

    window.togglePomoNotePagesDrawer = function(forceState = null) {
        isPagesDrawerOpen = forceState !== null ? Boolean(forceState) : !isPagesDrawerOpen;
        activeOneNoteDropdown = null;
        renderPomoNoteInterior();
    };

    window.togglePomoNoteDropdown = function(ddName, ev) {
        if (ev) ev.stopPropagation();
        activeOneNoteDropdown = (activeOneNoteDropdown === ddName) ? null : ddName;
        renderPomoNoteInterior();
    };

    function refreshPomoNoteSheetSvg() {
        const cardEl = document.getElementById('pomonote-a4-card');
        if (!cardEl || !window.PomoReaderCore) return;
        const pageNum = (window.pomoNoteState.activePageIndex || 0) + 1;
        cardEl.setAttribute('data-page', pageNum);
        const svg = cardEl.querySelector('svg.v4-interactive-svg');
        if (svg) svg.setAttribute('data-page', pageNum);
        window.PomoReaderCore.updateSinglePageSvg(pageNum, pomoNoteVirtualBook, cardEl);
        if (svg) window.PomoReaderCore.bindPageInteractiveSvg(pageNum, svg, pomoNoteVirtualBook);
    }

    window.setPomoNoteInputMode = function(mode) {
        window.pomoNoteState.inputMode = mode;
        const svg = document.querySelector('#pomonote-a4-card svg.v4-interactive-svg');
        const editor = document.getElementById('pomonote-live-editor');

        if (mode === 'draw') {
            editor?.blur?.();
            if (window.PomoReaderCore?.setStudioState) {
                window.PomoReaderCore.setStudioState({ studioActive: true });
                const bar = document.getElementById('reader-pencil-toolbar');
                bar?.classList.remove('hidden');
                bar?.classList.add('flex');
            }
            if (svg) svg.classList.add('active-draw-layer');
            if (editor) editor.style.pointerEvents = 'none';
            showToast("✍️ Draw / Writing Pad Layer Active on PomoNote (Hotkeys 1–7 & Stylus Ready!)");
        } else if (mode === 'type') {
            if (window.PomoReaderCore?.setStudioState) {
                window.PomoReaderCore.setStudioState({ studioActive: false, occlusionModeActive: false });
                document.getElementById('reader-pencil-toolbar')?.classList.add('hidden');
            }
            if (svg) svg.classList.remove('active-draw-layer');
            if (editor) { editor.style.pointerEvents = 'auto'; editor.focus(); }
            showToast("⌨️ Type Layer Active on PomoNote (Single-key hotkeys auto-guarded; press Esc to release cursor)");
        } else {
            const st = window.PomoReaderCore?.getStudioState?.() || {};
            const drawNow = Boolean(st.studioActive || st.occlusionModeActive);
            if (svg) svg.classList.toggle('active-draw-layer', drawNow);
            if (editor) editor.style.pointerEvents = drawNow ? 'none' : 'auto';
        }
        window.savePomoNoteState(true);
        renderPomoNoteInterior();
    };

    window.changePomoNotePaperStyle = function(styleVal, customHex = '') {
        const curSheet = window.pomoNoteState.pages[window.pomoNoteState.activePageIndex || 0];
        if (!curSheet) return;
        if (styleVal) curSheet.paperStyle = styleVal;
        if (customHex !== null) curSheet.customBgColor = customHex;
        window.savePomoNoteState(true);
        renderPomoNoteInterior();
    };

    window.setPomoNoteLineSpacing = function(pxVal) {
        const curSheet = window.pomoNoteState.pages[window.pomoNoteState.activePageIndex || 0];
        if (!curSheet) return;
        curSheet.lineSpacingPx = parseInt(pxVal) || 28;
        window.savePomoNoteState(true);
        renderPomoNoteInterior();
    };

    window.togglePomoNoteMarginLine = function() {
        const curSheet = window.pomoNoteState.pages[window.pomoNoteState.activePageIndex || 0];
        if (!curSheet) return;
        curSheet.showMarginLine = curSheet.showMarginLine === false ? true : false;
        window.savePomoNoteState(true);
        renderPomoNoteInterior();
    };

    window.extendPomoNoteCanvasHeight = function(extraPx = 600) {
        const curSheet = window.pomoNoteState.pages[window.pomoNoteState.activePageIndex || 0];
        if (!curSheet) return;
        curSheet.canvasHeightPx = Math.min(8000, Math.max(1100, (curSheet.canvasHeightPx || 1100) + extraPx));
        window.savePomoNoteState(true);
        renderPomoNoteInterior();
        showToast(`📏 Extended OneNote Page Canvas Height (${curSheet.canvasHeightPx}px)`);
    };

    window.switchPomoNoteSymbolTab = function(tabKey, ev) {
        if (ev) ev.stopPropagation();
        window.pomoNoteState.activeSymbolTab = tabKey;
        activeOneNoteDropdown = 'symbols';
        window.savePomoNoteState(true);
        renderPomoNoteInterior();
    };

    window.jumpToPomoNoteSheetIndex = function(idx) {
        window.savePomoNoteState(true);
        const total = window.pomoNoteState.pages.length;
        window.pomoNoteState.activePageIndex = Math.max(0, Math.min(total - 1, parseInt(idx) || 0));
        window.savePomoNoteState(true);
        renderPomoNoteInterior();
    };

    window.stepPomoNoteSheet = function(delta) {
        window.savePomoNoteState(true);
        const total = window.pomoNoteState.pages.length;
        const nextIdx = Math.max(0, Math.min(total - 1, (window.pomoNoteState.activePageIndex || 0) + delta));
        window.pomoNoteState.activePageIndex = nextIdx;
        window.savePomoNoteState(true);
        renderPomoNoteInterior();
    };

    window.addNewPomoNoteSheet = function() {
        window.savePomoNoteState(true);
        const curSheet = window.pomoNoteState.pages[window.pomoNoteState.activePageIndex || 0];
        const newIdx = window.pomoNoteState.pages.length + 1;
        window.pomoNoteState.pages.push({
            id: 'pnote_' + Date.now(),
            title: `Note Page ${newIdx}`,
            paperStyle: curSheet?.paperStyle || 'ruled',
            customBgColor: curSheet?.customBgColor || '',
            lineSpacingPx: curSheet?.lineSpacingPx || 28,
            showMarginLine: curSheet?.showMarginLine !== false,
            canvasHeightPx: 1150,
            textContent: '',
            snippedImages: [],
            updatedAt: Date.now()
        });
        window.pomoNoteState.activePageIndex = window.pomoNoteState.pages.length - 1;
        window.savePomoNoteState(true);
        renderPomoNoteInterior();
        showToast(`➕ Added Page #${newIdx} to PomoNote!`);
    };

    window.duplicatePomoNoteSheet = function(targetIdx = null) {
        window.savePomoNoteState(true);
        const st = window.pomoNoteState;
        const idx = targetIdx !== null ? targetIdx : (st.activePageIndex || 0);
        const src = st.pages[idx];
        if (!src) return;
        const srcPageNum = idx + 1;
        const newPageNum = st.pages.length + 1;
        const copySheet = {
            ...JSON.parse(JSON.stringify(src)),
            id: 'pnote_' + Date.now(),
            title: `${src.title || `Note Page ${srcPageNum}`} (Copy)`,
            updatedAt: Date.now()
        };
        st.pages.push(copySheet);
        const srcAnns = (st.annotations || []).filter(a => (a.page || 1) === srcPageNum);
        srcAnns.forEach(a => {
            st.annotations.push({
                ...JSON.parse(JSON.stringify(a)),
                id: 'draw_' + Date.now() + '_' + Math.floor(Math.random() * 9999),
                page: newPageNum,
                updatedAt: Date.now()
            });
        });
        st.activePageIndex = st.pages.length - 1;
        window.savePomoNoteState(true);
        renderPomoNoteInterior();
        showToast(`📋 Duplicated Page #${srcPageNum} -> Page #${newPageNum}`);
    };

    window.deletePomoNoteSheetAt = function(targetIdx, ev) {
        if (ev) ev.stopPropagation();
        const st = window.pomoNoteState;
        if (!st || st.pages.length <= 1) {
            window.purgeCurrentPomoNoteSheet();
            return;
        }
        const delPageNum = targetIdx + 1;
        const removedPage = st.pages.splice(targetIdx, 1)[0];
        if (!Array.isArray(st.deletedIds)) st.deletedIds = [];
        if (removedPage?.id) st.deletedIds.push(removedPage.id);
        // Remove annotations on deleted sheet and shift higher page indices down by 1
        st.annotations = (st.annotations || []).filter(a => {
            const p = a.page || 1;
            if (p === delPageNum) {
                if (a.id && !st.deletedIds.includes(a.id)) st.deletedIds.push(a.id);
                return false;
            }
            if (p > delPageNum) a.page = p - 1;
            return true;
        });
        st.activePageIndex = Math.max(0, Math.min(st.pages.length - 1, st.activePageIndex || 0));
        window.savePomoNoteState(true);
        renderPomoNoteInterior();
        showToast(`🗑️ Deleted Page #${delPageNum}`);
    };

    window.pasteLatestSnipIntoPomoNote = function() {
        const snipUrl = window.PomoReaderCore?.getLatestSnippedDiagram?.() || '';
        if (!snipUrl) {
            showToast("Click 📸 in the top reader bar (beside 📖 Dictionary) first to snip a diagram from your book!", true);
            return null;
        }
        const curSheet = window.pomoNoteState.pages[window.pomoNoteState.activePageIndex || 0];
        if (!curSheet) return null;
        if (!Array.isArray(curSheet.snippedImages)) curSheet.snippedImages = [];
        const newSnip = { id: 'snip_' + Date.now(), dataUrl: snipUrl };
        curSheet.snippedImages.push(newSnip);
        window.savePomoNoteState(true);
        renderPomoNoteInterior();
        showToast("📸 Pasted snipped diagram onto PomoNote sheet!");
        return newSnip.id;
    };

    window.removePomoNoteSnipImage = function(snipId) {
        const curSheet = window.pomoNoteState.pages[window.pomoNoteState.activePageIndex || 0];
        if (!curSheet || !Array.isArray(curSheet.snippedImages)) return;
        curSheet.snippedImages = curSheet.snippedImages.filter(s => s.id !== snipId);
        if (!Array.isArray(window.pomoNoteState.deletedIds)) window.pomoNoteState.deletedIds = [];
        if (!window.pomoNoteState.deletedIds.includes(snipId)) window.pomoNoteState.deletedIds.push(snipId);
        window.savePomoNoteState(true);
        renderPomoNoteInterior();
    };

    window.sendCurrentPomoNoteToVault = function() {
        window.savePomoNoteState(true);
        const curSheet = window.pomoNoteState.pages[window.pomoNoteState.activePageIndex || 0];
        if (!curSheet) return;
        const activeBook = getActiveBook();
        if (window.saveNotebookLmReportToVault) {
            window.saveNotebookLmReportToVault(
                curSheet.title || 'PomoNote Revision Sheet',
                window.activeTaskSubj || 'Medical Science',
                curSheet.textContent || 'Visual & Hybrid PomoNote Sheet',
                activeBook?.id || null,
                activeBook?.currentPage || 1
            );
        }
    };

    window.createFlashcardFromPomoNote = function() {
        window.savePomoNoteState(true);
        const curSheet = window.pomoNoteState.pages[window.pomoNoteState.activePageIndex || 0];
        const selTxt = window.getSelection()?.toString()?.trim() || '';
        const bodyTxt = selTxt || curSheet?.textContent || '';
        const cards = JSON.parse(safeGet('pages_pomodoro_fsrs_cards_v15', '[]'));
        const newCardId = 'fc_pnote_' + Date.now();
        cards.unshift({
            id: newCardId,
            topic: window.activeTaskSubj || curSheet?.title || 'PomoNote',
            front: `Recall key mechanisms & formulas from: ${curSheet?.title || 'PomoNote Sheet'}`,
            back: bodyTxt.slice(0, 1200) || 'Review PomoNote Sheet diagrams & equations.',
            intervalDays: 1,
            stabilityPct: 95,
            lastReviewed: Date.now()
        });
        safeSet('pages_pomodoro_fsrs_cards_v15', JSON.stringify(cards));
        PomoEventBus.emit('vault:updated');
        showToast("🃏 Created FSRS Flashcard from PomoNote Sheet!");
        return newCardId;
    };

    window.purgeCurrentPomoNoteSheet = function() {
        const curSheet = window.pomoNoteState.pages[window.pomoNoteState.activePageIndex || 0];
        const pageNum = (window.pomoNoteState.activePageIndex || 0) + 1;
        if (!Array.isArray(window.pomoNoteState.deletedIds)) window.pomoNoteState.deletedIds = [];
        if (curSheet) {
            (curSheet.snippedImages || []).forEach(sn => {
                if (sn.id && !window.pomoNoteState.deletedIds.includes(sn.id)) window.pomoNoteState.deletedIds.push(sn.id);
            });
            curSheet.textContent = '';
            curSheet.snippedImages = [];
            curSheet.updatedAt = Date.now();
        }
        (window.pomoNoteState.annotations || []).forEach(a => {
            if ((a.page || 1) === pageNum && a.id && !window.pomoNoteState.deletedIds.includes(a.id)) {
                window.pomoNoteState.deletedIds.push(a.id);
            }
        });
        window.pomoNoteState.annotations = (window.pomoNoteState.annotations || []).filter(a => (a.page || 1) !== pageNum);
        const editorEl = document.getElementById('pomonote-live-editor');
        if (editorEl) editorEl.innerText = '';
        window.savePomoNoteState(true);
        renderPomoNoteInterior();
        showToast(`🗑️ Cleared Sheet #${pageNum} (Press same hotkey again to Restore!)`);
    };

    window.togglePomoNoteFloatMode = function() {
        const st = window.pomoNoteState;
        if (!st) return;
        const nextMode = st.layoutMode === 'float' ? 'split' : 'float';
        window.setPomoNoteLayoutMode(nextMode);
    };

    /* =========================================================================
       3B. POMONOTE SAME-KEY DO / UNDO HOTKEY DISPATCHER
       ========================================================================= */
    const pomoNoteSameKeyUndoMap = {};
    let lastPomoNoteHotkeyAction = null;

    window.undoLastPomoNoteStrokeOrItem = function() {
        const st = window.pomoNoteState;
        if (!st) return false;
        const pageNum = (st.activePageIndex || 0) + 1;
        if (Array.isArray(st.annotations)) {
            for (let i = st.annotations.length - 1; i >= 0; i--) {
                if ((st.annotations[i].page || 1) === pageNum) {
                    const removed = st.annotations.splice(i, 1)[0];
                    if (!Array.isArray(st.deletedIds)) st.deletedIds = [];
                    if (removed?.id && !st.deletedIds.includes(removed.id)) st.deletedIds.push(removed.id);
                    window.savePomoNoteState(true);
                    refreshPomoNoteSheetSvg();
                    showToast(`↩️ Undid PomoNote ${removed.shapeType || removed.type || 'stroke'} on Sheet #${pageNum}!`);
                    return true;
                }
            }
        }
        const curSheet = st.pages[st.activePageIndex || 0];
        if (curSheet && Array.isArray(curSheet.snippedImages) && curSheet.snippedImages.length) {
            const removedSnip = curSheet.snippedImages.pop();
            if (!Array.isArray(st.deletedIds)) st.deletedIds = [];
            if (removedSnip?.id && !st.deletedIds.includes(removedSnip.id)) st.deletedIds.push(removedSnip.id);
            window.savePomoNoteState(true);
            renderPomoNoteInterior();
            showToast(`↩️ Undid Pasted Diagram on PomoNote Sheet #${pageNum}!`);
            return true;
        }
        showToast("Nothing left on this PomoNote sheet to undo.", true);
        return false;
    };

    window.handlePomoNoteHotkey = function(actionId) {
        if (!document.getElementById('reader-split-scratchpad') || !window.pomoNoteState) return false;
        const st = window.pomoNoteState;
        const useSameKeyUndo = window.sameKeyUndoEnabled !== false;

        if (actionId === 'pnote_undo_last') {
            lastPomoNoteHotkeyAction = null;
            return window.undoLastPomoNoteStrokeOrItem();
        }

        if (useSameKeyUndo && lastPomoNoteHotkeyAction === actionId && typeof pomoNoteSameKeyUndoMap[actionId] === 'function') {
            const undoFn = pomoNoteSameKeyUndoMap[actionId];
            delete pomoNoteSameKeyUndoMap[actionId];
            lastPomoNoteHotkeyAction = null;
            undoFn();
            return true;
        }

        if (actionId === 'pnote_mode_draw') {
            const prevMode = st.inputMode || 'hybrid';
            window.setPomoNoteInputMode('draw');
            lastPomoNoteHotkeyAction = actionId;
            pomoNoteSameKeyUndoMap[actionId] = () => {
                window.undoLastPomoNoteStrokeOrItem();
                window.setPomoNoteInputMode(prevMode === 'draw' ? 'hybrid' : prevMode);
                showToast(`↩️ Same-Key Undo: Exited Draw Mode & Restored ${prevMode.toUpperCase()}`);
            };
            return true;
        }

        if (actionId === 'pnote_mode_type') {
            const prevMode = st.inputMode || 'hybrid';
            window.setPomoNoteInputMode('type');
            lastPomoNoteHotkeyAction = actionId;
            pomoNoteSameKeyUndoMap[actionId] = () => {
                window.setPomoNoteInputMode(prevMode === 'type' ? 'hybrid' : prevMode);
                showToast(`↩️ Same-Key Undo: Reverted Mode to ${(prevMode === 'type' ? 'hybrid' : prevMode).toUpperCase()}`);
            };
            return true;
        }

        if (actionId === 'pnote_mode_hybrid') {
            const prevMode = st.inputMode || 'type';
            window.setPomoNoteInputMode('hybrid');
            lastPomoNoteHotkeyAction = actionId;
            pomoNoteSameKeyUndoMap[actionId] = () => {
                window.setPomoNoteInputMode(prevMode);
                showToast(`↩️ Same-Key Undo: Reverted Mode to ${prevMode.toUpperCase()}`);
            };
            return true;
        }

        if (actionId === 'pnote_add_sheet') {
            const prevIdx = st.activePageIndex || 0;
            window.addNewPomoNoteSheet();
            const addedSheetId = st.pages[st.pages.length - 1]?.id;
            lastPomoNoteHotkeyAction = actionId;
            pomoNoteSameKeyUndoMap[actionId] = () => {
                if (st.pages.length > 1) {
                    const idx = st.pages.findIndex(p => p.id === addedSheetId);
                    if (idx >= 0) st.pages.splice(idx, 1);
                    if (!Array.isArray(st.deletedIds)) st.deletedIds = [];
                    if (addedSheetId) st.deletedIds.push(addedSheetId);
                    st.activePageIndex = Math.max(0, Math.min(st.pages.length - 1, prevIdx));
                    window.savePomoNoteState(true);
                    renderPomoNoteInterior();
                    showToast("↩️ Same-Key Undo: Removed Newly Added Page!");
                }
            };
            return true;
        }

        if (actionId === 'pnote_next_sheet' || actionId === 'pnote_prev_sheet') {
            const prevIdx = st.activePageIndex || 0;
            window.stepPomoNoteSheet(actionId === 'pnote_next_sheet' ? 1 : -1);
            lastPomoNoteHotkeyAction = actionId;
            pomoNoteSameKeyUndoMap[actionId] = () => {
                st.activePageIndex = prevIdx;
                window.savePomoNoteState(true);
                renderPomoNoteInterior();
                showToast(`↩️ Same-Key Undo: Returned to Sheet #${prevIdx + 1}`);
            };
            return true;
        }

        if (actionId === 'pnote_cycle_paper') {
            const curSheet = st.pages[st.activePageIndex || 0];
            if (!curSheet) return false;
            const styles = ['ruled', 'white', 'black', 'geometrical', 'geo-white', 'ruled-white', 'grid', 'dot', 'muddy', 'sepia'];
            const prevStyle = curSheet.paperStyle || 'ruled';
            const prevCustom = curSheet.customBgColor || '';
            const nextStyle = styles[(styles.indexOf(prevStyle) + 1) % styles.length];
            window.changePomoNotePaperStyle(nextStyle, '');
            showToast(`🎨 PomoNote Paper: ${nextStyle.toUpperCase()} (Press same key again to Undo)`);
            lastPomoNoteHotkeyAction = actionId;
            pomoNoteSameKeyUndoMap[actionId] = () => {
                window.changePomoNotePaperStyle(prevStyle, prevCustom);
                showToast(`↩️ Same-Key Undo: Restored Paper to ${prevStyle.toUpperCase()}`);
            };
            return true;
        }

        if (actionId === 'pnote_paste_snip') {
            const pastedId = window.pasteLatestSnipIntoPomoNote();
            if (pastedId) {
                lastPomoNoteHotkeyAction = actionId;
                pomoNoteSameKeyUndoMap[actionId] = () => {
                    window.removePomoNoteSnipImage(pastedId);
                    showToast("↩️ Same-Key Undo: Removed Pasted Book Diagram!");
                };
            }
            return true;
        }

        if (actionId === 'pnote_stamp_ring') {
            const beforeCount = Array.isArray(st.annotations) ? st.annotations.length : 0;
            window.stampVectorStructureOnPomoNote('benzene');
            const addedIds = (st.annotations || []).slice(beforeCount).map(a => a.id);
            lastPomoNoteHotkeyAction = actionId;
            pomoNoteSameKeyUndoMap[actionId] = () => {
                st.annotations = (st.annotations || []).filter(a => !addedIds.includes(a.id));
                if (!Array.isArray(st.deletedIds)) st.deletedIds = [];
                addedIds.forEach(id => { if (id && !st.deletedIds.includes(id)) st.deletedIds.push(id); });
                window.savePomoNoteState(true);
                refreshPomoNoteSheetSvg();
                showToast("↩️ Same-Key Undo: Removed Stamped Vector Ring!");
            };
            return true;
        }

        if (actionId === 'pnote_send_vault') {
            const beforeLen = Array.isArray(window.tasks) ? window.tasks.length : 0;
            window.sendCurrentPomoNoteToVault();
            lastPomoNoteHotkeyAction = actionId;
            pomoNoteSameKeyUndoMap[actionId] = () => {
                if (Array.isArray(window.tasks) && window.tasks.length > beforeLen) {
                    window.tasks.shift();
                    window.saveTasks?.();
                    showToast("↩️ Same-Key Undo: Removed Sheet from Memory Beast Vault!");
                }
            };
            return true;
        }

        if (actionId === 'pnote_make_card') {
            const newCardId = window.createFlashcardFromPomoNote();
            lastPomoNoteHotkeyAction = actionId;
            pomoNoteSameKeyUndoMap[actionId] = () => {
                const cards = JSON.parse(safeGet('pages_pomodoro_fsrs_cards_v15', '[]')).filter(c => c.id !== newCardId);
                safeSet('pages_pomodoro_fsrs_cards_v15', JSON.stringify(cards));
                PomoEventBus.emit('vault:updated');
                showToast("↩️ Same-Key Undo: Removed FSRS Flashcard!");
            };
            return true;
        }

        if (actionId === 'pnote_float_toggle') {
            window.togglePomoNoteFloatMode();
            lastPomoNoteHotkeyAction = actionId;
            pomoNoteSameKeyUndoMap[actionId] = () => {
                window.togglePomoNoteFloatMode();
                showToast("↩️ Same-Key Undo: Reverted PomoNote Window Layout!");
            };
            return true;
        }

        if (actionId === 'pnote_purge_sheet') {
            window.savePomoNoteState(true);
            const pageIdx = st.activePageIndex || 0;
            const pageNum = pageIdx + 1;
            const curSheet = st.pages[pageIdx];
            const backupText = curSheet?.textContent || '';
            const backupSnips = JSON.parse(JSON.stringify(curSheet?.snippedImages || []));
            const backupAnns = JSON.parse(JSON.stringify((st.annotations || []).filter(a => (a.page || 1) === pageNum)));

            window.purgeCurrentPomoNoteSheet();
            lastPomoNoteHotkeyAction = actionId;
            pomoNoteSameKeyUndoMap[actionId] = () => {
                const targetSheet = st.pages[pageIdx];
                if (targetSheet) {
                    targetSheet.textContent = backupText;
                    targetSheet.snippedImages = backupSnips;
                    targetSheet.updatedAt = Date.now();
                }
                const restoredIds = new Set([
                    ...backupSnips.map(s => s.id),
                    ...backupAnns.map(a => a.id)
                ]);
                st.deletedIds = (st.deletedIds || []).filter(id => !restoredIds.has(id));
                st.annotations = [...(st.annotations || []), ...backupAnns];
                window.savePomoNoteState(true);
                renderPomoNoteInterior();
                showToast(`↩️ Same-Key Undo: Restored Cleared PomoNote Sheet #${pageNum}!`);
            };
            return true;
        }

        return false;
    };

    // Exports all PomoNote A4 sheets (including page background color, typed notes & vector shapes) to a real PDF!
    window.exportPomoNoteRevisionPdf = async function() {
        window.savePomoNoteState(true);
        if (typeof PDFLib === 'undefined') {
            showToast("PDF-Lib not loaded.", true);
            return;
        }
        try {
            showToast(`📦 Exporting ${window.pomoNoteState.pages.length} PomoNote A4 sheet(s) to PDF...`);
            const pdfDoc = await PDFLib.PDFDocument.create();
            const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
            const fontBold = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

            const hexToRgb = (hex) => {
                const clean = (hex || '#0b1324').replace('#', '');
                const num = parseInt(clean, 16) || 0x0b1324;
                return PDFLib.rgb(((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255);
            };

            for (let i = 0; i < window.pomoNoteState.pages.length; i++) {
                const sh = window.pomoNoteState.pages[i];
                const pNum = i + 1;
                const page = pdfDoc.addPage([595.28, 841.89]); // Standard A4
                const { width, height } = page.getSize();

                const isLightPage = ['white', 'geo-white', 'ruled-white', 'blank', 'muddy', 'sepia'].includes(sh.paperStyle) && !sh.customBgColor;
                const bgHex = sh.customBgColor || (
                    sh.paperStyle === 'white' || sh.paperStyle === 'geo-white' || sh.paperStyle === 'ruled-white' || sh.paperStyle === 'blank' ? '#ffffff' :
                    sh.paperStyle === 'black' ? '#000000' :
                    sh.paperStyle === 'muddy' ? '#dce6d9' :
                    sh.paperStyle === 'sepia' ? '#f4ecd8' : '#0b1324'
                );
                page.drawRectangle({ x: 0, y: 0, width, height, color: hexToRgb(bgHex) });

                if (sh.paperStyle.includes('ruled')) {
                    for (let y = height - 70; y >= 40; y -= 22) {
                        page.drawLine({ start: { x: 36, y }, end: { x: width - 36, y }, thickness: 0.5, color: PDFLib.rgb(0.35, 0.55, 0.75), opacity: 0.35 });
                    }
                } else if (sh.paperStyle.includes('geo') || sh.paperStyle === 'grid') {
                    for (let x = 36; x <= width - 36; x += 25) {
                        page.drawLine({ start: { x, y: 40 }, end: { x, y: height - 55 }, thickness: 0.4, color: PDFLib.rgb(0.3, 0.55, 0.8), opacity: 0.28 });
                    }
                    for (let y = 40; y <= height - 55; y += 25) {
                        page.drawLine({ start: { x: 36, y }, end: { x: width - 36, y }, thickness: 0.4, color: PDFLib.rgb(0.3, 0.55, 0.8), opacity: 0.28 });
                    }
                }

                const textColor = isLightPage ? PDFLib.rgb(0.08, 0.12, 0.2) : PDFLib.rgb(0.92, 0.95, 0.98);
                const safePdfAscii = (str) => String(str || '')
                    .replace(/→/g, '->').replace(/⇌/g, '<=>').replace(/↔/g, '<->')
                    .replace(/↑/g, '^').replace(/↓/g, 'v').replace(/Δ/g, 'Delta ')
                    .replace(/[^\x20-\x7E\n]/g, '');

                page.drawText(safePdfAscii(`${sh.title || `PomoNote Sheet ${pNum}`} (Page ${pNum}/${window.pomoNoteState.pages.length})`), {
                    x: 40, y: height - 42, size: 13, font: fontBold, color: textColor
                });

                const rawLines = safePdfAscii(sh.textContent || '').split(/\r?\n/);
                let curY = height - 70;
                rawLines.forEach(ln => {
                    if (curY < 45) return;
                    page.drawText(ln.slice(0, 92), { x: 42, y: curY, size: 10.5, font, color: textColor });
                    curY -= 18;
                });

                const sheetAnns = (window.pomoNoteState.annotations || []).filter(a => (a.page || 1) === pNum && a.type === 'drawing');
                sheetAnns.forEach(ann => {
                    const c = hexToRgb(ann.color || '#38bdf8');
                    const pts = ann.points || [];
                    const sw = ann.strokeWidth || 2.5;
                    if (ann.shapeType === 'pencil' && pts.length > 1) {
                        for (let k = 0; k < pts.length - 1; k++) {
                            page.drawLine({
                                start: { x: pts[k].x * width, y: (1 - pts[k].y) * height },
                                end: { x: pts[k + 1].x * width, y: (1 - pts[k + 1].y) * height },
                                thickness: sw, color: c
                            });
                        }
                    } else if ((ann.shapeType === 'line' || ann.shapeType === 'arrow') && pts.length >= 2) {
                        page.drawLine({
                            start: { x: pts[0].x * width, y: (1 - pts[0].y) * height },
                            end: { x: pts[1].x * width, y: (1 - pts[1].y) * height },
                            thickness: sw, color: c
                        });
                    } else if (ann.shapeType === 'rect' && pts.length >= 2) {
                        page.drawRectangle({
                            x: Math.min(pts[0].x, pts[1].x) * width,
                            y: (1 - Math.max(pts[0].y, pts[1].y)) * height,
                            width: Math.abs(pts[1].x - pts[0].x) * width,
                            height: Math.abs(pts[1].y - pts[0].y) * height,
                            borderColor: c, borderWidth: sw
                        });
                    } else if (ann.shapeType === 'circle' && pts.length >= 2) {
                        page.drawEllipse({
                            x: ((pts[0].x + pts[1].x) / 2) * width,
                            y: (1 - ((pts[0].y + pts[1].y) / 2)) * height,
                            xScale: (Math.abs(pts[1].x - pts[0].x) / 2) * width,
                            yScale: (Math.abs(pts[1].y - pts[0].y) / 2) * height,
                            borderColor: c, borderWidth: sw
                        });
                    }
                });
            }

            const pdfBytes = await pdfDoc.save();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }));
            a.download = `PomoNote_Revision_Notebook_${getLocalTodayString()}.pdf`;
            a.click();
            showToast("📦 Exported PomoNote Revision PDF!");
        } catch (err) {
            showToast("PDF Export encountered an error.", true);
        }
    };

    function renderPomoNoteInterior() {
        const pane = document.getElementById('reader-split-scratchpad');
        if (!pane) return;

        const st = window.pomoNoteState;
        if (!st.layoutMode) st.layoutMode = st.isFloating ? 'float' : 'split';
        const pageIdx = Math.max(0, Math.min(st.pages.length - 1, st.activePageIndex || 0));
        st.activePageIndex = pageIdx;
        const curSheet = st.pages[pageIdx];
        const pageNum = pageIdx + 1;
        const totalPages = st.pages.length;

        const paperOptions = [
            { id: 'ruled',       sym: '📝', label: 'Ruled Dark Slate (OneNote Dark)' },
            { id: 'white',       sym: '☀️', label: 'Crisp White Page (OneNote Classic)' },
            { id: 'ruled-white', sym: '📄', label: 'Ruled White College Notebook' },
            { id: 'geo-white',   sym: '📏', label: 'Geometrical White Graph Paper' },
            { id: 'geometrical', sym: '📐', label: 'Geometrical Engineering Blueprint' },
            { id: 'black',       sym: '🖤', label: 'Pitch Black AMOLED Canvas' },
            { id: 'grid',        sym: '⊞', label: 'Square Math Grid (Dark Slate)' },
            { id: 'dot',         sym: '⋅', label: 'Bullet Dot-Grid Canvas' },
            { id: 'muddy',       sym: '🌿', label: 'Eye-Care Botanical Sage Page' },
            { id: 'sepia',       sym: '📜', label: 'Warm Sepia Parchment Page' }
        ];
        const activePaperObj = paperOptions.find(p => p.id === (curSheet.paperStyle || 'ruled')) || paperOptions[0];

        const lineSpacingPx = curSheet.lineSpacingPx || 28;
        const showMarginLine = curSheet.showMarginLine !== false;
        const canvasHeightPx = Math.max(1050, curSheet.canvasHeightPx || 1150);

        const customStyleAttr = [
            `--onenote-line-h:${lineSpacingPx}px`,
            `min-height:${canvasHeightPx}px`,
            curSheet.customBgColor ? `background-color:${escapeHtml(curSheet.customBgColor)} !important` : ''
        ].filter(Boolean).join(';');

        let symbolPillsHtml = '';
        if (st.activeSymbolTab === 'rings') {
            symbolPillsHtml = VECTOR_RING_STAMPS.map(r => `
                <button type="button" onclick="window.stampVectorStructureOnPomoNote('${r.id}')" class="bg-slate-900 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 px-2.5 py-1 rounded-lg text-[11px] font-mono font-extrabold shrink-0 transition-all">
                    ${escapeHtml(r.label)}
                </button>
            `).join('');
        } else {
            const list = SYMBOL_BANKS[st.activeSymbolTab] || SYMBOL_BANKS.chem;
            symbolPillsHtml = list.map(sym => `
                <button type="button" onclick="window.insertSymbolIntoPomoNote('${escapeJsStr(sym)}')" class="bg-slate-900 hover:bg-blue-600 text-amber-300 hover:text-white border border-slate-700 px-2 py-1 rounded-md text-[11px] font-mono font-bold shrink-0 transition-all">
                    ${escapeHtml(sym)}
                </button>
            `).join('');
        }

        const readerStudioState = window.PomoReaderCore?.getStudioState?.() || {};
        const isDrawLayerActive = st.inputMode === 'draw' || (st.inputMode === 'hybrid' && (readerStudioState.studioActive || readerStudioState.occlusionModeActive));

        const activeBook = getActiveBook();
        const isQueuedOffline = !navigator.onLine || JSON.parse(safeGet('pages_pomodoro_pomonote_sync_q_v17', '[]')).includes(activeBook?.id);
        const splitPct = Math.round(getSavedSplitWidthPct());

        pane.innerHTML = `
            <!-- LEFT INTERACTIVE SPLIT-SCREEN RESIZER HANDLE (Visible in 50/50 Split Mode) -->
            <div id="pomonote-split-resizer" class="${st.layoutMode === 'split' ? 'flex' : 'hidden'}" title="↔ Drag to resize Book / PomoNote Split Ratio (${100 - splitPct}% Book / ${splitPct}% Note) • Double-click for 50/50">
                <div class="pomonote-resizer-grip"></div>
            </div>

            <!-- 1. ULTRA-COMPACT SINGLE-ROW DESKTOP ONENOTE RIBBON HEADER (38px height — Maximum Canvas Area!) -->
            <div id="pomonote-drag-header" class="onenote-top-ribbon flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-slate-950 border-b border-slate-800/90 select-none shrink-0 ${st.layoutMode === 'float' ? 'cursor-move' : ''}">
                <!-- Left: Pages Slide-Out Drawer Toggle + Quick Page Step + Inline Page Title -->
                <div class="flex items-center gap-1 min-w-0 flex-1">
                    <button type="button" id="pomonote-pages-drawer-btn" onclick="window.togglePomoNotePagesDrawer()" class="px-2 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 shrink-0 transition-all ${isPagesDrawerOpen ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40'}" title="Toggle OneNote Pages Slide-Out Panel (${totalPages} Pages)">
                        <span>📑</span><span class="font-mono">${pageNum}/${totalPages}</span><span>▾</span>
                    </button>
                    <button type="button" onclick="window.stepPomoNoteSheet(-1)" class="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-1.5 py-1 rounded-md text-[10px] font-bold shrink-0" title="Previous Note Page [">◀</button>
                    <button type="button" onclick="window.stepPomoNoteSheet(1)" class="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-1.5 py-1 rounded-md text-[10px] font-bold shrink-0" title="Next Note Page ]">▶</button>
                    <button type="button" onclick="window.addNewPomoNoteSheet()" class="bg-emerald-600/25 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 px-1.5 py-1 rounded-md text-[10px] font-extrabold shrink-0" title="➕ Add New Page (Hotkey: N)">➕</button>
                    <input type="text" id="pomonote-sheet-title-inp" value="${escapeHtml(curSheet.title || `Note Page ${pageNum}`)}" onchange="window.savePomoNoteState(true)" placeholder="Page Title..." class="min-w-[90px] max-w-[200px] flex-1 bg-slate-900/70 hover:bg-slate-900 focus:bg-slate-900 border border-transparent focus:border-cyan-500/50 rounded-md px-2 py-0.5 text-xs font-extrabold text-cyan-200 focus:outline-none truncate" title="Click to rename current OneNote page">
                </div>

                <!-- Center: Segmented Input Mode Switcher (Symbol-Only: ⚡ / ✍️ / ⌨️) -->
                <div class="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 shrink-0">
                    <button type="button" onclick="window.setPomoNoteInputMode('hybrid')" class="w-7 h-6 flex items-center justify-center rounded-md text-xs font-extrabold transition-all ${st.inputMode === 'hybrid' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}" title="⚡ Hybrid Mode: Type with keyboard AND draw with Pencil Studio or Stylus/Writing Pad">⚡</button>
                    <button type="button" onclick="window.setPomoNoteInputMode('draw')" class="w-7 h-6 flex items-center justify-center rounded-md text-xs font-extrabold transition-all ${st.inputMode === 'draw' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}" title="✍️ Draw / Writing Pad Mode: Full-canvas freehand ink & vector shapes">✍️</button>
                    <button type="button" onclick="window.setPomoNoteInputMode('type')" class="w-7 h-6 flex items-center justify-center rounded-md text-xs font-extrabold transition-all ${st.inputMode === 'type' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}" title="⌨️ Type Only Mode">⌨️</button>
                </div>

                <!-- Right: Symbol-Only Popover Dropdowns (Paper, Symbols, Snip, Tools) + Layout Mode Switcher -->
                <div class="flex items-center gap-1 shrink-0">
                    <!-- Paper & Grid Dropdown Button (Symbol-Only) -->
                    <button type="button" onclick="window.togglePomoNoteDropdown('paper', event)" class="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-extrabold border transition-all ${activeOneNoteDropdown === 'paper' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-700'}" title="Choose OneNote Paper Template, Grid/Rule Spacing & Page Color">
                        ${activePaperObj.sym}
                    </button>

                    <!-- Scientific Symbols & Vector Ring Stamps Dropdown Button (Symbol-Only) -->
                    <button type="button" onclick="window.togglePomoNoteDropdown('symbols', event)" class="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-extrabold border transition-all ${activeOneNoteDropdown === 'symbols' ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow' : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-slate-700'}" title="Open Chemistry, Benzene Rings, Coordinate Axes, Math & Medical Symbol Bank">
                        ∑
                    </button>

                    <!-- Quick Paste Diagram Snip (Symbol-Only) -->
                    <button type="button" onclick="window.pasteLatestSnipIntoPomoNote()" class="w-7 h-7 flex items-center justify-center bg-rose-950/80 hover:bg-rose-600 text-rose-200 border border-rose-500/40 rounded-lg text-xs font-extrabold" title="📸 Paste latest snipped diagram from book page">📸</button>

                    <!-- Actions / Vault / PDF Export Dropdown Button (Symbol-Only) -->
                    <button type="button" onclick="window.togglePomoNoteDropdown('actions', event)" class="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-extrabold border transition-all ${activeOneNoteDropdown === 'actions' ? 'bg-purple-500 text-white border-purple-400 shadow' : 'bg-slate-900 hover:bg-slate-800 text-purple-300 border-slate-700'}" title="Vault, FSRS Flashcard, PDF Export & Page Tools">
                        🛠️
                    </button>

                    <!-- Layout Mode Switcher: 50/50 Split | Float | Max (Symbol-Only) -->
                    <div class="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                        <button type="button" onclick="window.setPomoNoteLayoutMode('split')" class="w-6 h-6 flex items-center justify-center rounded text-[11px] font-extrabold ${st.layoutMode === 'split' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}" title="◫ 50/50 Split-Screen (Half Book Page + Half PomoNote)">◫</button>
                        <button type="button" onclick="window.setPomoNoteLayoutMode('float')" class="w-6 h-6 flex items-center justify-center rounded text-[11px] font-extrabold ${st.layoutMode === 'float' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}" title="❐ Floating Draggable Window">❐</button>
                        <button type="button" onclick="window.setPomoNoteLayoutMode('max')" class="w-6 h-6 flex items-center justify-center rounded text-[11px] font-extrabold ${st.layoutMode === 'max' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}" title="⛶ Maximize OneNote Full Desktop Workspace">⛶</button>
                    </div>

                    <span id="pomonote-sync-status-pill" class="text-[9px] font-mono font-extrabold ${!navigator.onLine ? 'bg-amber-950/90 text-amber-300 border-amber-500/40' : 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'} border px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0" title="Real-Time Local & Cloud Sync Status">${!navigator.onLine ? '💾' : (isQueuedOffline ? '↻' : '✓')}</span>

                    <button type="button" onclick="window.closePomoNoteWorkspace()" class="w-7 h-7 flex items-center justify-center bg-red-950/70 hover:bg-red-600 text-red-300 hover:text-white rounded-lg text-xs font-bold" title="Close PomoNote">✕</button>
                </div>
            </div>

            <!-- 2. FLOATING POPOVER DROPDOWNS (Zero vertical space when closed!) -->
            ${activeOneNoteDropdown === 'paper' ? `
                <div class="onenote-popover-panel bg-slate-950/98 border border-amber-500/50 rounded-xl p-3 shadow-2xl flex flex-col gap-2.5 z-[320]" onclick="event.stopPropagation()">
                    <div class="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <span class="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider">📄 OneNote Paper Templates & Grid Settings</span>
                        <button type="button" onclick="window.togglePomoNoteDropdown(null, event)" class="text-slate-400 hover:text-white text-xs font-bold px-1">✕</button>
                    </div>
                    <div class="grid grid-cols-2 gap-1.5">
                        ${paperOptions.map(p => `
                            <button type="button" onclick="window.changePomoNotePaperStyle('${p.id}', '')" class="text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 transition-all ${curSheet.paperStyle === p.id && !curSheet.customBgColor ? 'bg-amber-500/25 text-amber-200 border-amber-400 shadow' : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'}">
                                <span>${p.sym}</span><span class="truncate">${escapeHtml(p.label)}</span>
                            </button>
                        `).join('')}
                    </div>
                    <div class="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-800 text-[11px]">
                        <div class="flex items-center gap-1.5">
                            <span class="text-slate-400 font-bold">Custom Tint:</span>
                            <input type="color" value="${escapeHtml(curSheet.customBgColor || '#0b1324')}" oninput="window.changePomoNotePaperStyle(null, this.value)" class="w-6 h-6 rounded cursor-pointer bg-transparent border border-slate-700">
                            ${curSheet.customBgColor ? `<button type="button" onclick="window.changePomoNotePaperStyle('${curSheet.paperStyle || 'ruled'}', '')" class="text-[10px] text-amber-300 underline">Reset</button>` : ''}
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="text-slate-400 font-bold">Rule Spacing:</span>
                            ${[22, 28, 36].map(sp => `
                                <button type="button" onclick="window.setPomoNoteLineSpacing(${sp})" class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${lineSpacingPx === sp ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}">${sp}px</button>
                            `).join('')}
                        </div>
                        <button type="button" onclick="window.togglePomoNoteMarginLine()" class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold border ${showMarginLine ? 'bg-rose-950/70 text-rose-300 border-rose-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'}">
                            ${showMarginLine ? '📏 Margin Line: ON' : '📏 Margin Line: OFF'}
                        </button>
                    </div>
                </div>
            ` : ''}

            ${activeOneNoteDropdown === 'symbols' ? `
                <div class="onenote-popover-panel bg-slate-950/98 border border-cyan-500/50 rounded-xl p-2.5 shadow-2xl flex flex-col gap-2 z-[320]" onclick="event.stopPropagation()">
                    <div class="flex items-center justify-between gap-1 border-b border-slate-800 pb-1.5">
                        <div class="flex items-center gap-1 flex-wrap">
                            <button type="button" onclick="window.switchPomoNoteSymbolTab('chem', event)" class="px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${st.activeSymbolTab === 'chem' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-900 text-amber-300 border border-slate-800'}">🧪 Chemistry</button>
                            <button type="button" onclick="window.switchPomoNoteSymbolTab('rings', event)" class="px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${st.activeSymbolTab === 'rings' ? 'bg-emerald-500 text-slate-950 shadow' : 'bg-slate-900 text-emerald-300 border border-slate-800'}">⬡ Vector Rings & Axes</button>
                            <button type="button" onclick="window.switchPomoNoteSymbolTab('math', event)" class="px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${st.activeSymbolTab === 'math' ? 'bg-cyan-500 text-slate-950 shadow' : 'bg-slate-900 text-cyan-300 border border-slate-800'}">📐 Math & Physics</button>
                            <button type="button" onclick="window.switchPomoNoteSymbolTab('med', event)" class="px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${st.activeSymbolTab === 'med' ? 'bg-purple-500 text-white shadow' : 'bg-slate-900 text-purple-300 border border-slate-800'}">🩺 Medical & Bio</button>
                        </div>
                        <button type="button" onclick="window.togglePomoNoteDropdown(null, event)" class="text-slate-400 hover:text-white text-xs font-bold px-1.5">✕</button>
                    </div>
                    <div class="flex flex-wrap gap-1 max-h-32 native-scroll pr-1">
                        ${symbolPillsHtml}
                    </div>
                </div>
            ` : ''}

            ${activeOneNoteDropdown === 'actions' ? `
                <div class="onenote-popover-panel bg-slate-950/98 border border-purple-500/50 rounded-xl p-2.5 shadow-2xl flex flex-col gap-1.5 z-[320] max-w-xs right-3 left-auto" onclick="event.stopPropagation()">
                    <div class="flex items-center justify-between border-b border-slate-800 pb-1">
                        <span class="text-[11px] font-extrabold text-purple-300 uppercase">⚡ OneNote Actions & Export</span>
                        <button type="button" onclick="window.togglePomoNoteDropdown(null, event)" class="text-slate-400 hover:text-white text-xs font-bold px-1">✕</button>
                    </div>
                    <button type="button" onclick="window.pasteLatestSnipIntoPomoNote(); window.togglePomoNoteDropdown(null, event);" class="w-full text-left bg-slate-900 hover:bg-rose-950/80 text-rose-200 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between"><span>📸 Paste Book Diagram Snip</span><span class="text-[10px] font-mono text-slate-400">Snip</span></button>
                    <button type="button" onclick="window.sendCurrentPomoNoteToVault(); window.togglePomoNoteDropdown(null, event);" class="w-full text-left bg-slate-900 hover:bg-purple-950/80 text-purple-200 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between"><span>📌 Send Sheet to Memory Vault</span><span class="text-[10px] font-mono text-slate-400">Vault</span></button>
                    <button type="button" onclick="window.createFlashcardFromPomoNote(); window.togglePomoNoteDropdown(null, event);" class="w-full text-left bg-slate-900 hover:bg-cyan-950/80 text-cyan-200 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between"><span>🃏 Create FSRS Flashcard</span><span class="text-[10px] font-mono text-slate-400">FSRS</span></button>
                    <button type="button" onclick="window.exportPomoNoteRevisionPdf(); window.togglePomoNoteDropdown(null, event);" class="w-full text-left bg-slate-900 hover:bg-blue-950/80 text-blue-200 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between"><span>📦 Export Notebook as A4 PDF</span><span class="text-[10px] font-mono text-slate-400">PDF</span></button>
                    <button type="button" onclick="window.duplicatePomoNoteSheet(); window.togglePomoNoteDropdown(null, event);" class="w-full text-left bg-slate-900 hover:bg-slate-800 text-amber-200 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between"><span>📋 Duplicate Current Page</span><span class="text-[10px] font-mono text-slate-400">Copy</span></button>
                    <button type="button" onclick="window.extendPomoNoteCanvasHeight(600); window.togglePomoNoteDropdown(null, event);" class="w-full text-left bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between"><span>📏 Extend Page Space (+600px)</span><span class="text-[10px] font-mono text-slate-400">Infinite</span></button>
                    <div class="border-t border-slate-800 my-0.5"></div>
                    <button type="button" onclick="window.savePomoNoteState(false); window.togglePomoNoteDropdown(null, event);" class="w-full text-left bg-emerald-950/60 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/40 px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center justify-between"><span>💾 Save Notebook Now</span><span>✓</span></button>
                    <button type="button" onclick="window.purgeCurrentPomoNoteSheet(); window.togglePomoNoteDropdown(null, event);" class="w-full text-left bg-red-950/60 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center justify-between"><span>🗑️ Clear Current Page</span><span>Clear</span></button>
                </div>
            ` : ''}

            <!-- 3. MAIN ONENOTE BODY: SLIDE-OVER PAGES DRAWER + FULL-BLEED WRITING & DRAWING STAGE -->
            <div class="flex-1 flex min-h-0 relative overflow-hidden">
                <!-- Collapsible OneNote Pages Slide-Out Panel -->
                ${isPagesDrawerOpen ? `
                    <div id="pomonote-pages-drawer" class="w-56 bg-slate-950/98 border-r border-slate-800 flex flex-col shrink-0 z-[290] select-none">
                        <div class="p-2 border-b border-slate-800 flex items-center justify-between gap-1">
                            <span class="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider">🗂️ Notebook Pages (${totalPages})</span>
                            <button type="button" onclick="window.togglePomoNotePagesDrawer(false)" class="text-slate-400 hover:text-white text-xs font-bold px-1.5">✕</button>
                        </div>
                        <div class="p-2 border-b border-slate-800 flex gap-1.5">
                            <button type="button" onclick="window.addNewPomoNoteSheet()" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-1.5 rounded-lg text-[11px] shadow">➕ New Page</button>
                            <button type="button" onclick="window.duplicatePomoNoteSheet()" class="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-extrabold px-2.5 py-1.5 rounded-lg text-[11px]" title="Duplicate Current Page">📋</button>
                        </div>
                        <div class="flex-1 native-scroll p-1.5 flex flex-col gap-1">
                            ${st.pages.map((pg, idx) => {
                                const isCur = idx === pageIdx;
                                const pNum = idx + 1;
                                const strokeCount = (st.annotations || []).filter(a => (a.page || 1) === pNum).length;
                                const wordCount = (pg.textContent || '').trim() ? (pg.textContent || '').trim().split(/\s+/).length : 0;
                                return `
                                    <div onclick="window.jumpToPomoNoteSheetIndex(${idx})" class="group p-2 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-1.5 ${isCur ? 'bg-cyan-950/80 border-cyan-400 text-white shadow' : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800/80 text-slate-300'}">
                                        <div class="min-w-0 flex-1">
                                            <div class="flex items-center gap-1">
                                                <span class="text-[10px] font-mono font-extrabold px-1.5 py-0.2 rounded ${isCur ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}">#${pNum}</span>
                                                <span class="text-xs font-extrabold truncate">${escapeHtml(pg.title || `Note Page ${pNum}`)}</span>
                                            </div>
                                            <div class="text-[10px] text-slate-400 font-mono mt-0.5">${wordCount}w • ${strokeCount} ink • ${escapeHtml(pg.paperStyle || 'ruled')}</div>
                                        </div>
                                        <button type="button" onclick="window.deletePomoNoteSheetAt(${idx}, event)" class="opacity-60 group-hover:opacity-100 hover:bg-red-600 hover:text-white text-red-400 px-1.5 py-0.5 rounded text-[10px] font-bold" title="Delete or Clear Page">✕</button>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Full-Bleed Edge-to-Edge OneNote Canvas Stage (Maximum Space for Writing & Stylus Pad!) -->
                <div id="pomonote-canvas-scroll-stage" class="flex-1 native-scroll relative min-w-0 h-full">
                    <div id="pomonote-a4-card"
                        class="v4-page-card pomonote-a4-sheet paper-${escapeHtml(curSheet.paperStyle || 'ruled')} ${showMarginLine ? 'with-margin-line' : 'no-margin-line'} !m-0 !w-full !max-w-full !rounded-none !shadow-none"
                        data-page="${pageNum}"
                        data-book-id="pomonote_virtual_book"
                        style="${customStyleAttr}">

                        ${(curSheet.snippedImages || []).length ? `
                            <div class="flex flex-wrap gap-2 mb-3 relative z-20">
                                ${(curSheet.snippedImages || []).map(sn => `
                                    <div class="relative inline-block border border-cyan-500/50 rounded-xl overflow-hidden bg-slate-950/60 p-1 shadow-lg">
                                        <img src="${sn.dataUrl}" class="max-h-56 object-contain rounded-lg block">
                                        <button type="button" onclick="window.removePomoNoteSnipImage('${sn.id}')" class="absolute top-1.5 right-1.5 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">✕</button>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}

                        <div id="pomonote-live-editor"
                            contenteditable="true"
                            dir="auto"
                            spellcheck="false"
                            class="pomonote-text-editor pbook-paragraph relative z-20 focus:outline-none whitespace-pre-wrap"
                            style="pointer-events:${isDrawLayerActive ? 'none' : 'auto'}; min-height:${canvasHeightPx - 80}px; line-height:${lineSpacingPx}px;"
                            data-placeholder="Start typing class notes, rough work, equations, or book summaries here — or write directly with your Stylus / Writing Pad & Pencil Studio anywhere on this OneNote canvas!">${escapeHtml(curSheet.textContent || '')}</div>

                        <svg class="v4-interactive-svg ${isDrawLayerActive ? 'active-draw-layer' : ''}" data-page="${pageNum}" data-book-id="pomonote_virtual_book" viewBox="0 0 1000 1400" preserveAspectRatio="none"></svg>
                        <div class="v4-chips-layer absolute inset-0 pointer-events-none z-30"></div>

                        <!-- Bottom OneNote Infinite-Page Extension Strip -->
                        <div class="relative z-30 flex items-center justify-between pt-4 pb-2 opacity-60 hover:opacity-100 transition-opacity select-none">
                            <span class="text-[10px] font-mono">📄 Page ${pageNum} of ${totalPages} • ${escapeHtml(activePaperObj.label)}</span>
                            <button type="button" onclick="window.extendPomoNoteCanvasHeight(600)" class="bg-slate-900/80 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/40 px-3 py-1 rounded-full text-[10px] font-extrabold shadow">
                                ➕ Extend Page Space (+600px)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const editorEl = document.getElementById('pomonote-live-editor');
        editorEl?.addEventListener('input', () => {
            window.savePomoNoteState(true);
        });

        // Close any open dropdown popover when clicking on the canvas stage
        const cardEl = document.getElementById('pomonote-a4-card');
        cardEl?.addEventListener('pointerdown', (e) => {
            if (activeOneNoteDropdown) {
                activeOneNoteDropdown = null;
                document.querySelectorAll('.onenote-popover-panel').forEach(el => el.remove());
            }
            // Hardware Stylus / Writing Pad Auto-Ink: If user touches a stylus (pointerType === 'pen') in Hybrid mode,
            // automatically enable the SVG draw layer so the writing pad writes immediately without mode switching!
            if (e.pointerType === 'pen' && st.inputMode === 'hybrid') {
                const svgEl = cardEl.querySelector('svg.v4-interactive-svg');
                if (svgEl && !svgEl.classList.contains('active-draw-layer')) {
                    if (window.PomoReaderCore?.setStudioState) {
                        window.PomoReaderCore.setStudioState({ studioActive: true, studioTool: 'pencil' });
                    }
                    svgEl.classList.add('active-draw-layer');
                    if (editorEl) editorEl.style.pointerEvents = 'none';
                }
            }
        }, { capture: true });

        // Interactive 50/50 Split-Screen Resizer Handle (Drag left/right to resize Book vs PomoNote)
        const resizerEl = document.getElementById('pomonote-split-resizer');
        if (resizerEl) {
            let resizingSplit = false;
            resizerEl.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                resizingSplit = true;
                try { resizerEl.setPointerCapture(e.pointerId); } catch (err) {}
            });
            resizerEl.addEventListener('pointermove', (e) => {
                if (!resizingSplit) return;
                const vw = Math.max(1, window.innerWidth);
                const newPct = Math.max(28, Math.min(72, +(((vw - e.clientX) / vw) * 100).toFixed(1)));
                safeSet('pomo_onenote_split_pct_v18', String(newPct));
                const overlay = document.getElementById('reader-fullscreen-overlay');
                overlay?.style.setProperty('--pomonote-split-w', `${newPct}%`);
                pane.style.width = `${newPct}%`;
                window.syncPencilToolbarVerticalDock?.(true);
            });
            const endSplitResize = (e) => {
                if (!resizingSplit) return;
                resizingSplit = false;
                try { resizerEl.releasePointerCapture(e.pointerId); } catch (err) {}
                window.PomoReaderCore?.fitBookToViewportWidth?.();
                window.syncPencilToolbarVerticalDock?.(true);
            };
            resizerEl.addEventListener('pointerup', endSplitResize);
            resizerEl.addEventListener('pointercancel', endSplitResize);
            resizerEl.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                safeSet('pomo_onenote_split_pct_v18', '50');
                applyPomoNoteLayoutGeometry(true);
                showToast("◫ Reset Split-Screen to Exact 50% Book / 50% PomoNote");
            });
        }

        // Make PomoNote window draggable by header when in Float mode
        const dragHeader = document.getElementById('pomonote-drag-header');
        let dragging = false, offX = 0, offY = 0;
        dragHeader?.addEventListener('pointerdown', (e) => {
            if (st.layoutMode !== 'float') return;
            if (e.target.closest('button, input, select')) return;
            dragging = true;
            const r = pane.getBoundingClientRect();
            offX = e.clientX - r.left;
            offY = e.clientY - r.top;
            try { dragHeader.setPointerCapture(e.pointerId); } catch (err) {}
        });
        dragHeader?.addEventListener('pointermove', (e) => {
            if (!dragging || st.layoutMode !== 'float') return;
            const newL = `${Math.max(4, Math.min(window.innerWidth - 320, e.clientX - offX))}px`;
            const newT = `${Math.max(44, Math.min(window.innerHeight - 160, e.clientY - offY))}px`;
            pane.style.right = 'auto';
            pane.style.bottom = 'auto';
            pane.style.left = newL;
            pane.style.top = newT;
            st.floatLeft = newL;
            st.floatTop = newT;
            window.syncPencilToolbarVerticalDock?.(true);
        });
        dragHeader?.addEventListener('pointerup', () => {
            if (dragging) {
                dragging = false;
                window.savePomoNoteState(true);
            }
        });

        refreshPomoNoteSheetSvg();
    }

    window.closePomoNoteWorkspace = function(silent = false) {
        window.savePomoNoteState(true);
        if (window.readerSettings) {
            window.readerSettings.split5050PomoNote = false;
            window.saveReaderMeta?.(true);
        }
        const pane = document.getElementById('reader-split-scratchpad');
        const overlay = document.getElementById('reader-fullscreen-overlay');
        pane?.remove();
        overlay?.classList.remove('pomonote-split-active');
        overlay?.style.removeProperty('--pomonote-split-w');
        document.getElementById('reader-bottom-pomonote-btn')?.classList.remove('active-tool');
        window.syncPencilToolbarVerticalDock?.(false);
        window.syncPencilSplit5050BtnUI?.();
        window.PomoReaderCore?.fitBookToViewportWidth?.();
        setTimeout(() => window.PomoReaderCore?.fitBookToViewportWidth?.(), 40);
        if (!silent) showToast("📝 Closed PomoNote Workspace — Full Book Reading Page Restored");
    };

    window.toggleSplitScreenScratchpad = function() {
        let pane = document.getElementById('reader-split-scratchpad');
        const botBtn = document.getElementById('reader-bottom-pomonote-btn');
        if (pane) {
            window.closePomoNoteWorkspace(false);
            return;
        }
        window.syncPomoNoteWithActiveBook();
        safeSet('pomo_onenote_split_pct_v18', '50');
        window.pomoNoteState.layoutMode = 'split';
        window.pomoNoteState.isFloating = false;
        if (window.readerSettings) {
            window.readerSettings.split5050PomoNote = true;
            window.saveReaderMeta?.(true);
        }
        pane = document.createElement('div');
        pane.id = 'reader-split-scratchpad';
        pane.className = "fixed z-[275] bg-slate-950 flex flex-col overflow-hidden shadow-2xl pomonote-onenote-workspace";
        document.getElementById('reader-fullscreen-overlay')?.appendChild(pane);
        botBtn?.classList.add('active-tool');
        applyPomoNoteLayoutGeometry(true);
        renderPomoNoteInterior();
        window.syncPencilToolbarVerticalDock?.(true);
        window.syncPencilSplit5050BtnUI?.();
    };

    /* =========================================================================
       4. CLICKED ANNOTATION INSPECTOR BAR (RECOLOR, DICTIONARY, EDIT, DELETE)
       ========================================================================= */
    window.showClickedItemInspectorBar = function(ann, clientX, clientY) {
        let bar = document.getElementById('v5-clicked-ann-inspector');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'v5-clicked-ann-inspector';
            bar.className = "fixed z-[295] rounded-2xl shadow-2xl p-1.5 flex items-center gap-1.5";
            document.getElementById('reader-fullscreen-overlay')?.appendChild(bar);
        }
        const activeBook = getActiveBook();
        const colors = ['#facc15', '#34d399', '#60a5fa', '#f472b6', '#fb923c', '#ef4444'];
        const safeAnnId = escapeJsStr(ann.id);
        const isNoteAnn = (window.pomoNoteState.annotations || []).some(a => a.id === ann.id);
        const safeBookId = isNoteAnn ? 'pomonote_virtual_book' : escapeJsStr(activeBook?.id || '');
        const safeText = escapeJsStr((ann.text || '').slice(0, 50));

        bar.innerHTML = `
            <div class="flex items-center gap-1 border-r border-slate-700/60 pr-1.5">
                ${colors.map(c => `<button type="button" onclick="window.recolorSelectedAnnotation('${safeAnnId}', '${c}')" class="w-4 h-4 rounded-full border ${ann.color === c ? 'border-white scale-110' : 'border-transparent'}" style="background:${c}"></button>`).join('')}
            </div>
            <button type="button" onclick="window.openReaderDictionaryModal && window.openReaderDictionaryModal('${safeText}')" class="sym-dock-btn text-emerald-300" title="📖 4-Language Dictionary">📖</button>
            <button type="button" onclick="window.openSelectedAnnNoteModal('${safeAnnId}')" class="sym-dock-btn text-blue-300" title="📝 Edit Note">📝</button>
            <button type="button" onclick="window.deleteAnnotationTwoWay('${safeBookId}', '${safeAnnId}')" class="sym-dock-btn text-red-400" title="🗑️ Delete">🗑️</button>
            <button type="button" onclick="window.hideClickedItemInspectorBar()" class="text-slate-300 hover:text-white text-xs font-bold px-1">✕</button>
        `;
        bar.classList.remove('hidden');
        bar.style.left = `${Math.max(12, Math.min(window.innerWidth - 300, clientX - 130))}px`;
        bar.style.top = `${Math.max(58, Math.min(window.innerHeight - 100, clientY - 58))}px`;
    };

    window.hideClickedItemInspectorBar = function() {
        document.getElementById('v5-clicked-ann-inspector')?.classList.add('hidden');
    };

    window.recolorSelectedAnnotation = function(annId, newColor) {
        const noteAnn = (window.pomoNoteState.annotations || []).find(a => a.id === annId);
        if (noteAnn) {
            noteAnn.color = newColor;
            noteAnn.updatedAt = Date.now();
            window.savePomoNoteState(true);
            refreshPomoNoteSheetSvg();
            return;
        }
        const activeBook = getActiveBook();
        if (!activeBook) return;
        const ann = (activeBook.annotations || []).find(a => a.id === annId);
        if (ann) {
            ann.color = newColor;
            ann.updatedAt = Date.now();
            activeBook.lastModified = Date.now();
            saveReaderMeta();
            window.PomoReaderCore?.updateSinglePageSvg(ann.page);
        }
    };

    window.openSelectedAnnNoteModal = function(annId) {
        window.hideClickedItemInspectorBar();
        window.openLineItemViewerModal(annId);
    };

    /* =========================================================================
       5. LINE NOTE & FILE ATTACHMENT VIEWER MODAL + TWO-WAY DELETE & SHARE
       ========================================================================= */
    let activeViewingAnnId = null;

    window.openLineItemViewerModal = async function(annId) {
        const activeBook = getActiveBook();
        const ann = (activeBook?.annotations || []).find(a => a.id === annId) ||
                    (window.pomoNoteState.annotations || []).find(a => a.id === annId);
        if (!ann) return;
        activeViewingAnnId = annId;

        document.getElementById('line-viewer-title').textContent = `📝 Page ${ann.page} Annotation`;
        document.getElementById('line-viewer-quote').textContent = `"${ann.text || ''}"`;
        document.getElementById('line-viewer-note-input').value = ann.note || '';

        const attBox = document.getElementById('line-viewer-attachment-box');
        attBox.innerHTML = '';
        if (ann.attachmentId) {
            const att = await idbGet('lineAttachments', ann.attachmentId);
            if (att) {
                attBox.classList.remove('hidden');
                attBox.classList.add('flex');
                let html = `<p class="text-xs font-bold text-emerald-400">📎 ${escapeHtml(att.name)}</p>`;
                if ((att.mime || '').startsWith('image/')) html += `<img src="${att.dataUrl}" class="max-h-56 rounded-xl border border-slate-700 object-contain mx-auto">`;
                else if ((att.mime || '').startsWith('audio/')) html += `<audio controls src="${att.dataUrl}" class="w-full mt-1"></audio>`;
                html += `<a href="${att.dataUrl}" download="${escapeHtml(att.name)}" class="bg-slate-800 text-blue-300 text-center py-1.5 rounded-lg text-xs font-bold">⬇️ Download File</a>`;
                attBox.innerHTML = html;
            }
        } else {
            attBox.classList.add('hidden');
        }
        document.getElementById('line-item-viewer-modal').classList.remove('hidden');
    };

    document.getElementById('close-line-viewer-btn')?.addEventListener('click', () => {
        document.getElementById('line-item-viewer-modal').classList.add('hidden');
    });

    document.getElementById('line-viewer-save-btn')?.addEventListener('click', () => {
        const activeBook = getActiveBook();
        if (!activeViewingAnnId) return;
        const ann = (activeBook?.annotations || []).find(a => a.id === activeViewingAnnId) ||
                    (window.pomoNoteState.annotations || []).find(a => a.id === activeViewingAnnId);
        if (ann) {
            ann.note = document.getElementById('line-viewer-note-input').value.trim();
            if (ann.note && ann.type === 'highlight') ann.type = 'note';
            ann.updatedAt = Date.now();
            saveReaderMeta();
            window.savePomoNoteState(true);
            window.PomoReaderCore?.updateSinglePageSvg(ann.page);
            refreshPomoNoteSheetSvg();
            showToast("💾 Note saved!");
        }
        document.getElementById('line-item-viewer-modal').classList.add('hidden');
    });

    document.getElementById('line-viewer-delete-btn')?.addEventListener('click', () => {
        const activeBook = getActiveBook();
        if (activeViewingAnnId) {
            const isNoteAnn = (window.pomoNoteState.annotations || []).some(a => a.id === activeViewingAnnId);
            window.deleteAnnotationTwoWay(isNoteAnn ? 'pomonote_virtual_book' : (activeBook?.id || ''), activeViewingAnnId);
            document.getElementById('line-item-viewer-modal').classList.add('hidden');
        }
    });

    document.getElementById('line-viewer-attach-btn')?.addEventListener('click', () => {
        const inp = document.getElementById('line-attach-file-input');
        inp.onchange = (ev) => {
            const file = ev.target.files[0];
            const activeBook = getActiveBook();
            if (!file || !activeViewingAnnId) return;
            const r = new FileReader();
            r.onload = async () => {
                const attId = 'att_' + Date.now();
                await idbPut('lineAttachments', { id: attId, name: file.name, mime: file.type, dataUrl: r.result });
                const ann = (activeBook?.annotations || []).find(a => a.id === activeViewingAnnId) ||
                            (window.pomoNoteState.annotations || []).find(a => a.id === activeViewingAnnId);
                if (ann) {
                    ann.attachmentId = attId;
                    ann.attachmentName = file.name;
                    ann.attachmentMime = file.type;
                    ann.type = 'attachment';
                    ann.updatedAt = Date.now();
                    saveReaderMeta();
                    window.savePomoNoteState(true);
                    window.openLineItemViewerModal(ann.id);
                    window.PomoReaderCore?.updateSinglePageSvg(ann.page);
                }
            };
            r.readAsDataURL(file);
            inp.value = '';
        };
        inp.click();
    });

    window.deleteAnnotationTwoWay = async function(bookId, annId) {
        if (bookId === 'pomonote_virtual_book') {
            if (!Array.isArray(window.pomoNoteState.deletedIds)) window.pomoNoteState.deletedIds = [];
            if (!window.pomoNoteState.deletedIds.includes(annId)) window.pomoNoteState.deletedIds.push(annId);
            window.pomoNoteState.annotations = (window.pomoNoteState.annotations || []).filter(a => a.id !== annId);
            window.hideClickedItemInspectorBar();
            window.savePomoNoteState(true);
            refreshPomoNoteSheetSvg();
            showToast("🗑️ Deleted from PomoNote & Cloud!");
            return;
        }
        const b = (window.readerBooks || []).find(x => x.id === bookId);
        if (!b) return;
        const idx = (b.annotations || []).findIndex(a => a.id === annId);
        if (idx === -1) return;
        const removed = b.annotations[idx];
        if (removed.attachmentId) await idbDelete('lineAttachments', removed.attachmentId);
        b.annotations.splice(idx, 1);
        if (!Array.isArray(b.deletedAnnotationIds)) b.deletedAnnotationIds = [];
        if (!b.deletedAnnotationIds.includes(annId)) b.deletedAnnotationIds.push(annId);
        if (window.PomoReaderCore?.getSelectedShapeId() === annId) {
            window.PomoReaderCore.setSelectedShapeId(null);
        }
        window.hideClickedItemInspectorBar();
        b.rev = (b.rev || 1) + 1;
        b.lastModified = Date.now();
        b.pendingCloudSync = true;
        saveReaderMeta();
        window.renderA1GlobalAnnotations();
        const activeBook = getActiveBook();
        if (activeBook && activeBook.id === bookId) {
            window.PomoReaderCore?.updateSinglePageSvg(removed.page || 1);
            window.PomoReaderCore?.renderBookTocAndBookmarksDrawer();
        }
        showToast("🗑️ Deleted!");
    };

    window.shareAnnotationItem = function(bookId, annId) {
        const b = (window.readerBooks || []).find(x => x.id === bookId);
        const ann = b?.annotations?.find(a => a.id === annId);
        if (!b || !ann) return;
        const shareText = `📘 ${b.title} (Page ${ann.page})\n"${ann.text || ''}"\n${ann.note ? 'Note: ' + ann.note : ''}`;
        if (navigator.share) navigator.share({ title: b.title, text: shareText }).catch(() => {});
        else {
            try { navigator.clipboard.writeText(shareText); } catch (e) {}
            showToast("📋 Full quote copied to clipboard!");
        }
    };

    /* =========================================================================
       6. GLOBAL NOTES, HIGHLIGHTS & BOOKMARKS HUB (SETTINGS PANEL A1)
       ========================================================================= */
    window.renderA1GlobalAnnotations = function() {
        const listEl = document.getElementById('a1-global-annotations-list');
        if (!listEl) return;
        const q = (document.getElementById('a1-global-search-input')?.value || '').trim().toLowerCase();
        const typeFilter = document.getElementById('a1-global-type-filter')?.value || 'all';
        const allItems = [];
        (window.readerBooks || []).forEach(b => {
            (b.annotations || []).forEach(ann => {
                if (typeFilter !== 'all' && ann.type !== typeFilter) return;
                if (q && !`${b.title} ${ann.text || ''} ${ann.note || ''} ${ann.attachmentName || ''}`.toLowerCase().includes(q)) return;
                allItems.push({ book: b, ann });
            });
        });
        listEl.innerHTML = allItems.length ? '' : `<p class="text-xs text-slate-500 italic text-center p-6 bg-slate-950 rounded-2xl border border-slate-800">No matching annotations found.</p>`;
        allItems.forEach(({ book, ann }) => {
            const safeBookId = escapeJsStr(book.id);
            const safeAnnId = escapeJsStr(ann.id);
            const row = document.createElement('div');
            row.className = "bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-start justify-between gap-3";
            row.style.borderLeft = `5px solid ${ann.color || '#facc15'}`;
            row.innerHTML = `
                <div class="min-w-0 flex-1 cursor-pointer" onclick="document.getElementById('reader-master-settings-modal').classList.add('hidden'); openBookAtPage('${safeBookId}', ${ann.page || 1});">
                    <span class="text-xs font-extrabold text-white">📘 ${escapeHtml(book.title)} <span class="text-emerald-400 font-mono">(Page ${ann.page || 1})</span></span>
                    <p class="text-xs text-slate-300 mt-1 whitespace-pre-wrap break-words">"${escapeHtml(ann.text || ann.note || ann.shapeType || 'Annotation')}"</p>
                </div>
                <div class="flex gap-1.5 shrink-0">
                    <button onclick="window.shareAnnotationItem('${safeBookId}', '${safeAnnId}')" class="bg-slate-900 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">📋</button>
                    <button onclick="window.deleteAnnotationTwoWay('${safeBookId}', '${safeAnnId}')" class="bg-slate-900 text-red-400 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">🗑️</button>
                </div>
            `;
            listEl.appendChild(row);
        });
    };

    document.getElementById('a1-global-search-input')?.addEventListener('input', window.renderA1GlobalAnnotations);
    document.getElementById('a1-global-type-filter')?.addEventListener('change', window.renderA1GlobalAnnotations);

    // Public Module Handle & Plug-and-Play Self-Registration
    window.PomoNote = {
        toggleScratchpad: window.toggleSplitScreenScratchpad,
        openFromShelf: window.openStandalonePomoNoteFromShelf,
        openNoteViewer: window.openLineItemViewerModal,
        deleteAnnotation: window.deleteAnnotationTwoWay,
        shareAnnotation: window.shareAnnotationItem,
        renderGlobalNotesHub: window.renderA1GlobalAnnotations,
        exportPdf: window.exportPomoNoteRevisionPdf,
        refreshSvg: refreshPomoNoteSheetSvg,
        getVirtualBookObj: () => pomoNoteVirtualBook,
        undoScratchpadStrokeIfActive() {
            const pane = document.getElementById('reader-split-scratchpad');
            if (!pane || !window.pomoNoteState.annotations?.length) return false;
            const curPage = (window.pomoNoteState.activePageIndex || 0) + 1;
            for (let i = window.pomoNoteState.annotations.length - 1; i >= 0; i--) {
                if ((window.pomoNoteState.annotations[i].page || 1) === curPage) {
                    const removed = window.pomoNoteState.annotations.splice(i, 1)[0];
                    if (removed?.id) {
                        if (!Array.isArray(window.pomoNoteState.deletedIds)) window.pomoNoteState.deletedIds = [];
                        if (!window.pomoNoteState.deletedIds.includes(removed.id)) window.pomoNoteState.deletedIds.push(removed.id);
                    }
                    window.savePomoNoteState(true);
                    refreshPomoNoteSheetSvg();
                    showToast("↩️ Undid last stroke on PomoNote Sheet!");
                    return true;
                }
            }
            return false;
        }
    };

    document.body.classList.add('has-module-pomonote');
    if (window.PomoReaderCore && typeof window.PomoReaderCore.registerModule === 'function') {
        window.PomoReaderCore.registerModule('pomonote', window.PomoNote);
    }
})();
// ✅ END OF FILE (06-pomo-note.js v17.2 Pure Desktop Edition) — 100% COMPLETE & UNCUT
