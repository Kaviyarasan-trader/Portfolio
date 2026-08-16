/* ============================================================
   KAVIYARASAN R — CINEMATIC PORTFOLIO INTERACTIONS
   Loader · hero reveal · cursor · magnetic · parallax
   split-text reveals · nav overlay · scroll spy/progress
   ============================================================ */

(function () {
    'use strict';

    const doc = document;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;

    let heroStreamInstance = null;
    let heroStreamWired = false;
    let bgParallaxInstance = null;
    let devNetworkInstance = null;

    const onReady = (fn) => {
        if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', fn);
        else fn();
    };

    onReady(() => {

        /* ---------- Loader + hero reveal ---------- */
        const loader = doc.getElementById('loader');
        const hero = doc.querySelector('.hero');

        let resolvePage;
        const pageReady = new Promise((res) => { resolvePage = res; });

        const revealPage = () => {
            resolvePage();
            if (loader) loader.classList.add('done');
            if (hero) hero.classList.add('in');
        };

        if (reduced) {
            revealPage();
        } else {
            const pageLoad = new Promise((res) => {
                if (doc.readyState === 'complete') res();
                else window.addEventListener('load', res, { once: true });
            });
            const minVisible = new Promise((res) => setTimeout(res, 1100));
            Promise.all([pageLoad, minVisible]).then(() => {
                if (loader) {
                    loader.classList.add('done');
                    loader.addEventListener('transitionend', function onTransitionEnd(event) {
                        if (event.propertyName === 'opacity') {
                            loader.style.visibility = 'hidden';
                            loader.removeEventListener('transitionend', onTransitionEnd);
                        }
                    });
                }
                if (hero) hero.classList.add('in');
                revealPage();
            });
        }

        /* ---------- Scroll progress + nav scrolled ---------- */
        const nav = doc.getElementById('nav');
        const progress = doc.getElementById('progress');
        const toTop = doc.getElementById('toTop');

        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                const y = window.scrollY || doc.documentElement.scrollTop;
                if (nav) nav.classList.toggle('scrolled', y > 30);
                if (progress) {
                    const max = doc.documentElement.scrollHeight - window.innerHeight;
                    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
                }
                ticking = false;
            });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        if (toTop) {
            toTop.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
            });
        }

        /* ---------- Mobile menu ---------- */
        const burger = doc.getElementById('burger');

        let scrollYLock = 0;
        const lockScroll = () => {
            scrollYLock = window.scrollY || doc.documentElement.scrollTop;
            doc.body.classList.add('nav-lock');
            doc.body.style.top = (-scrollYLock) + 'px';
        };
        const unlockScroll = () => {
            doc.body.classList.remove('nav-lock');
            doc.body.style.top = '';
            window.scrollTo(0, scrollYLock);
        };

        const setMenu = (open) => {
            if (!nav) return;
            const wasOpen = nav.classList.contains('open');
            if (!!open === wasOpen) return;
            nav.classList.toggle('open', open);
            doc.body.classList.toggle('nav-open', open);
            if (open) lockScroll();
            else unlockScroll();
            if (burger) {
                burger.setAttribute('aria-expanded', open ? 'true' : 'false');
                burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            }
        };

        doc.querySelectorAll('.nav-overlay-link').forEach((link, i) => {
            link.style.setProperty('--i', i);
        });

        if (burger) {
            burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
        }
        doc.querySelectorAll('.nav-overlay').forEach((overlay) => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) setMenu(false);
            });
        });
        doc.querySelectorAll('.nav-overlay-link').forEach((link) => {
            link.addEventListener('click', () => setMenu(false));
        });
        doc.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') setMenu(false);
        });
        window.addEventListener('resize', () => {
            if (window.innerWidth > 1279) setMenu(false);
        });

        /* ---------- Profile photo preview ---------- */
        const photoTriggers = Array.from(doc.querySelectorAll('[data-photo-open]'));
        const imgModal = doc.getElementById('imgModal');
        const imgModalImg = doc.getElementById('imgModalImg');
        const imgModalClose = doc.getElementById('imgModalClose');

        const closePhoto = () => {
            if (!imgModal) return;
            imgModal.classList.remove('open');
            imgModal.setAttribute('aria-hidden', 'true');
            const qp = doc.getElementById('qrPopup');
            if (qp) {
                qp.classList.remove('open');
                qp.setAttribute('aria-hidden', 'true');
            }
            doc.body.classList.remove('nav-open');
            setTimeout(() => {
                if (!imgModal.classList.contains('open') && imgModalImg) imgModalImg.removeAttribute('src');
            }, 350);
        };

        const openPhoto = (e, trigger) => {
            const t = trigger || photoTriggers[0];
            const img = t && t.querySelector('img');
            if (!img || !imgModal || !imgModalImg) return;
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            imgModalImg.setAttribute('src', img.currentSrc || img.src);
            imgModal.classList.add('open');
            imgModal.setAttribute('aria-hidden', 'false');
            doc.body.classList.add('nav-open');
        };

        photoTriggers.forEach((t) => t.addEventListener('click', (e) => openPhoto(e, t)));
        if (imgModalClose) imgModalClose.addEventListener('click', closePhoto);
        if (imgModal) {
            imgModal.addEventListener('click', (e) => {
                if (e.target === imgModal) closePhoto();
            });
        }
        doc.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            const qp = doc.getElementById('qrPopup');
            if (qp && qp.classList.contains('open')) { closeQr(); return; }
            if (imgModal && imgModal.classList.contains('open')) closePhoto();
        });

        /* ---------- Code stream behind photo preview ---------- */
        const CODE_TOKENS = ['Python', 'Django', 'JavaScript', 'HTML', 'CSS', 'API', 'Git', 'SQL', 'React', 'def', 'class', 'import', 'const', 'return', 'async', 'await', 'export', 'from', 'if', 'for'];
        const imgModalCode = doc.getElementById('imgModalCode');
        const buildCodeStream = () => {
            if (!imgModalCode || reduced) return;
            const mobile = window.innerWidth < 640;
            const count = mobile ? 12 : 26;
            const frag = doc.createDocumentFragment();
            for (let i = 0; i < count; i++) {
                const s = doc.createElement('span');
                s.textContent = CODE_TOKENS[Math.floor(Math.random() * CODE_TOKENS.length)];
                const roll = Math.random();
                let fs, a, b, dur;
                if (roll > 0.66) { fs = mobile ? 11 : 14; a = 0.3; b = 0; dur = 26; s.style.setProperty('--tc', '#8fb0ff'); }
                else if (roll > 0.33) { fs = mobile ? 9 : 11; a = 0.19; b = 1; dur = 36; s.style.setProperty('--tc', '#7f8fa8'); }
                else { fs = mobile ? 8 : 9; a = 0.12; b = 2; dur = 50; s.style.setProperty('--tc', '#5f6b7d'); }
                s.style.left = (2 + Math.random() * 90) + '%';
                s.style.setProperty('--fs', fs + 'px');
                s.style.setProperty('--a', a);
                s.style.setProperty('--b', b + 'px');
                s.style.setProperty('--x0', Math.round(Math.random() * 30 - 15) + 'px');
                s.style.setProperty('--x1', Math.round(Math.random() * 30 - 15) + 'px');
                s.style.setProperty('--dur', (dur + Math.random() * 14).toFixed(1) + 's');
                s.style.setProperty('--delay', (-Math.random() * dur).toFixed(1) + 's');
                s.style.setProperty('--bdur', (9 + Math.random() * 7).toFixed(1) + 's');
                s.style.setProperty('--bdelay', (-Math.random() * 8).toFixed(1) + 's');
                frag.appendChild(s);
            }
            imgModalCode.textContent = '';
            imgModalCode.appendChild(frag);
        };
        buildCodeStream();
        let lastMobile = window.innerWidth < 640;
        let streamResizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(streamResizeTimer);
            streamResizeTimer = setTimeout(() => {
                const nowMobile = window.innerWidth < 640;
                if (nowMobile !== lastMobile) { lastMobile = nowMobile; buildCodeStream(); }
            }, 300);
        });

        /* ---------- Profile share interaction: menu / copy link / QR code ---------- */
        const actionShare = doc.getElementById('actionShare');
        const actionCopy = doc.getElementById('actionCopy');
        const actionQr = doc.getElementById('actionQr');
        const qrPopup = doc.getElementById('qrPopup');
        const qrClose = doc.getElementById('qrClose');
        const qrBox = doc.getElementById('qrBox');
        const qrUrl = doc.getElementById('qrUrl');
        const toast = doc.getElementById('imgModalToast');
        const shareTrigger = doc.getElementById('shareTrigger');
        const shareMenu = doc.getElementById('shareMenu');

        const profileUrl = () => window.location.href;

        let toastTimer;
        const showToast = (msg) => {
            if (!toast) return;
            if (msg) toast.textContent = msg;
            toast.classList.add('show');
            clearTimeout(toastTimer);
            toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
        };

        const copyText = (text, done, fail) => {
            const legacy = () => {
                const ta = doc.createElement('textarea');
                ta.value = text;
                ta.setAttribute('readonly', '');
                ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
                doc.body.appendChild(ta);
                ta.select();
                let ok = false;
                try { ok = doc.execCommand('copy'); } catch (err) { ok = false; }
                doc.body.removeChild(ta);
                if (ok) done(); else if (fail) fail();
            };
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text).then(done, legacy);
            } else legacy();
        };

        /* --- Share menu (popover on profile picture) --- */
        const setShareMenu = (open) => {
            if (!shareMenu) return;
            shareMenu.classList.toggle('is-open', open);
            shareMenu.setAttribute('aria-hidden', String(!open));
            if (shareTrigger) shareTrigger.setAttribute('aria-expanded', String(open));
            if (open) positionShareMenu();
        };

        const positionShareMenu = () => {
            if (!shareTrigger || !shareMenu) return;
            const t = shareTrigger.getBoundingClientRect();
            const mw = shareMenu.offsetWidth || 224;
            const mh = shareMenu.offsetHeight || 150;
            const gap = 10;
            let left = t.left + t.width - mw;
            let top = t.bottom + gap;
            if (left < 12) left = 12;
            if (left + mw > window.innerWidth - 12) left = window.innerWidth - mw - 12;
            if (top + mh > window.innerHeight - 12) {
                top = t.top - mh - gap;
                if (top < 12) top = 12;
            }
            shareMenu.style.left = left + 'px';
            shareMenu.style.top = top + 'px';
        };

        const shareItems = Array.from(shareMenu ? shareMenu.querySelectorAll('.share-item') : []);

        if (shareTrigger && shareMenu) {
            shareTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const open = !shareMenu.classList.contains('is-open');
                setShareMenu(open);
                if (open && shareItems[0]) shareItems[0].focus({ preventScroll: true });
            });
        }
        doc.addEventListener('click', (e) => {
            if (!shareMenu || !shareMenu.classList.contains('is-open')) return;
            if (e.target !== shareTrigger && !shareMenu.contains(e.target)) setShareMenu(false);
        });
        doc.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && shareMenu && shareMenu.classList.contains('is-open')) {
                setShareMenu(false);
                if (shareTrigger) shareTrigger.focus({ preventScroll: true });
            }
        });
        window.addEventListener('resize', () => setShareMenu(false));

        let copiedTimer = null;
        const flashItem = (item, state) => {
            if (!item) return;
            const label = item.querySelector('.share-item-label');
            if (label) {
                label.textContent = state === 'ok' ? 'Link Copied ✓' : 'Copy Failed';
            }
            item.classList.remove('is-copied', 'is-failed');
            item.classList.add(state === 'ok' ? 'is-copied' : 'is-failed');
            clearTimeout(copiedTimer);
            copiedTimer = setTimeout(() => {
                if (label) {
                    label.textContent = item.getAttribute('data-share') === 'copy' ? 'Copy Link' : 'Share Profile';
                }
                item.classList.remove('is-copied', 'is-failed');
            }, state === 'ok' ? 1800 : 2400);
        };

        shareItems.forEach((item) => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const kind = item.getAttribute('data-share');
                const url = profileUrl();
                setShareMenu(false);
                if (kind === 'qr') { openQr(); return; }
                if (kind === 'native') {
                    if (navigator.share) {
                        navigator.share({ title: 'Kaviyarasan R', text: 'Check out my portfolio', url }).catch(() => {});
                    } else {
                        copyText(url, () => flashItem(item, 'ok'), () => { flashItem(item, 'fail'); showToast('Copy failed — try your browser\u2019s address bar.'); });
                    }
                    return;
                }
                copyText(url, () => flashItem(item, 'ok'), () => { flashItem(item, 'fail'); showToast('Copy failed — try your browser\u2019s address bar.'); });
            });
        });

        if (actionShare) actionShare.addEventListener('click', () => {
            const url = profileUrl();
            if (navigator.share) {
                navigator.share({ title: 'Kaviyarasan R', text: 'Check out my portfolio', url }).catch(() => {});
            } else {
                copyText(url, showToast, () => showToast('Copy failed — try your browser\u2019s address bar.'));
            }
        });

        if (actionCopy) actionCopy.addEventListener('click', () => copyText(profileUrl(), showToast, () => showToast('Copy failed — try your browser\u2019s address bar.')));

        let qrInstance = null;
        let qrReturnTarget = shareTrigger;
        const openQr = () => {
            if (!qrPopup) return;
            const url = profileUrl();
            qrReturnTarget = (imgModal && imgModal.classList.contains('open')) ? actionQr : shareTrigger;
            if (qrUrl) qrUrl.textContent = url.replace(/^https?:\/\//, '');
            if (window.QRCode && qrBox) {
                if (!qrInstance) {
                    qrInstance = new QRCode(qrBox, {
                        text: url, width: 256, height: 256,
                        colorDark: '#0b0e14', colorLight: '#ffffff',
                        correctLevel: QRCode.CorrectLevel.M
                    });
                } else {
                    qrInstance.makeCode(url);
                }
                qrBox.classList.remove('qr-fallback');
            } else if (qrBox) {
                qrBox.classList.add('qr-fallback');
                qrBox.textContent = 'QR unavailable — copy the link instead.';
            }
            qrPopup.classList.add('open');
            qrPopup.setAttribute('aria-hidden', 'false');
            doc.body.classList.add('qr-open');
            if (qrClose) qrClose.focus({ preventScroll: true });
        };
        const closeQr = () => {
            if (!qrPopup || !qrPopup.classList.contains('open')) return;
            qrPopup.classList.remove('open');
            qrPopup.setAttribute('aria-hidden', 'true');
            doc.body.classList.remove('qr-open');
            if (qrReturnTarget) qrReturnTarget.focus({ preventScroll: true });
        };

        if (actionQr) actionQr.addEventListener('click', (e) => { e.stopPropagation(); openQr(); });
        if (qrClose) qrClose.addEventListener('click', (e) => { e.stopPropagation(); closeQr(); });
        if (qrPopup) qrPopup.addEventListener('click', (e) => { if (e.target === qrPopup) closeQr(); });

        /* ---------- Client-side routing + smooth anchor scrolling (delegated) ---------- */
        const ASSET_EXTS = ['jpg','jpeg','png','gif','webp','avif','svg','ico','pdf','zip','rar','7z','doc','docx','xls','xlsx','csv','mp4','mp3','woff','woff2','ttf'];
        const isAssetHref = (path) => {
            const name = path.split('/').pop().split('?')[0];
            const dot = name.lastIndexOf('.');
            if (dot <= 0) return false;
            return ASSET_EXTS.indexOf(name.slice(dot + 1).toLowerCase()) !== -1;
        };

        const smoothScrollToHash = (href) => {
            const id = href.charAt(0) === '#' ? href : '#' + href.split('#')[1];
            if (id.length <= 1) return false;
            const target = doc.querySelector(id);
            if (!target) return false;
            setMenu(false);
            target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
            if (history.replaceState) history.replaceState(null, '', id);
            return true;
        };

        doc.addEventListener('click', (e) => {
            if (e.defaultPrevented || e.button !== 0) return;
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            const anchor = e.target && e.target.closest ? e.target.closest('a[href]') : null;
            if (!anchor) return;
            if (anchor.hasAttribute('download')) return;
            if (anchor.target && anchor.target.toLowerCase() !== '_self') return;

            const href = anchor.getAttribute('href');
            if (!href) return;

            if (href.charAt(0) === '#') {
                e.preventDefault();
                if (!smoothScrollToHash(href)) {
                    if (location.pathname !== '/') navigateTo(new URL('/' + href, doc.baseURI), false);
                }
                return;
            }

            let url;
            try { url = new URL(href, doc.baseURI); } catch (err) { return; }
            if (url.origin !== location.origin) return;
            if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
            if (isAssetHref(url.pathname)) return;

            const path = url.pathname + url.search;
            const current = location.pathname + location.search;
            if (path === current) {
                if (url.hash && smoothScrollToHash(url.hash)) e.preventDefault();
                return;
            }

            e.preventDefault();
            navigateTo(url, false);
        });

        window.addEventListener('popstate', () => {
            navigateTo(new URL(location.href), true);
        });

        /* ---------- Lightweight History API router ---------- */
        let currentPath = location.pathname + location.search;
        let navToken = 0;

        const closeOverlays = () => {
            const g = doc.getElementById('gallery');
            const m = doc.getElementById('projectModal');
            if (g) {
                if (g._galleryCtrl) g._galleryCtrl.close();
                g.classList.remove('is-open');
                g.setAttribute('aria-hidden', 'true');
            }
            if (m) {
                if (m._modalCtrl) m._modalCtrl.close();
                m.classList.remove('is-open');
                m.setAttribute('aria-hidden', 'true');
            }
            doc.body.classList.remove('gallery-open', 'project-open', 'nav-open', 'nav-lock', 'qr-open');
            doc.body.style.top = '';
            const nav = doc.getElementById('nav');
            if (nav) nav.classList.remove('open');
            const burger = doc.getElementById('burger');
            if (burger) {
                burger.setAttribute('aria-expanded', 'false');
                burger.setAttribute('aria-label', 'Open menu');
            }
        };

        const applyDocument = (html, url) => {
            const parsed = new DOMParser().parseFromString(html, 'text/html');
            const main = doc.querySelector('main.page-main');
            const newMain = parsed.querySelector('main.page-main');
            if (!main || !newMain) { location.assign(url.href); return; }

            closeOverlays();

            const stage = doc.querySelector('#gallery [data-gallery-stage]');
            const newStage = parsed.querySelector('#gallery [data-gallery-stage]');
            main.innerHTML = newMain.innerHTML;
            if (stage && newStage) stage.innerHTML = newStage.innerHTML;

            if (parsed.title) doc.title = parsed.title;
            currentPath = url.pathname + url.search;

            if (!reduced) {
                main.classList.remove('swap');
                void main.offsetWidth;
                main.classList.add('swap');
            }

            refreshPageContent();

            if (url.hash && url.hash.length > 1) {
                const target = doc.getElementById(url.hash.slice(1));
                if (target) target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
                else window.scrollTo(0, 0);
            } else {
                window.scrollTo(0, 0);
            }
        };

        const navigateTo = (url, fromPopstate) => {
            if (!fromPopstate) history.pushState(null, '', url.pathname + url.search + url.hash);
            const token = ++navToken;
            fetch(url.pathname + url.search)
                .then((res) => {
                    if (!res.ok) throw new Error('nav ' + res.status);
                    return res.text();
                })
                .then((html) => {
                    if (token !== navToken) return;
                    applyDocument(html, url);
                })
                .catch(() => {
                    if (token === navToken) location.assign(url.href);
                });
        };

        const refreshPageContent = () => {
            const hero = doc.querySelector('.hero');
            if (hero) {
                hero.classList.add('in');
                if (doc.querySelector('.hero-stream')) initHeroStream();
                initBgParallax();
                if (doc.querySelector('.dev-network')) initDevNetwork();
            }
            initSplitReveal();
            if (!reduced) initCaseShowcase();
            initCaseReadMore();
            initGallery();
            initProjectModal();
            if (finePointer && !reduced) {
                initMagnetic();
                initParallax();
            }
            initScrollSpy();
        };

        const initSplitReveal = () => {
            doc.querySelectorAll('.reveal-split:not([data-split])').forEach((el) => {
                el.setAttribute('data-split', '1');
                splitText(el);
            });
            const targets = Array.from(doc.querySelectorAll('.reveal:not(.in), .reveal-split:not(.in)'))
                .filter((el) => reduced || !el.closest('#projects .case'));
            if ('IntersectionObserver' in window && !reduced && targets.length) {
                const revealObserver = new IntersectionObserver((entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            revealIn(entry.target);
                            revealObserver.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
                targets.forEach((el) => revealObserver.observe(el));
            } else {
                targets.forEach(revealIn);
            }
        };

        const initScrollSpy = () => {
            const links = Array.from(doc.querySelectorAll('.nav-link[data-nav], .nav-overlay-link[data-nav]'));
            const sections = links.map((link) => doc.querySelector(link.getAttribute('href'))).filter(Boolean);
            if (!('IntersectionObserver' in window) || !links.length || !sections.length) return;
            const spyObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    const id = '#' + entry.target.id;
                    links.forEach((link) => {
                        link.classList.toggle('active', link.getAttribute('href') === id);
                    });
                });
            }, { rootMargin: '-45% 0px -50% 0px' });
            sections.forEach((sec) => spyObserver.observe(sec));
        };

        /* ---------- Split headline text into word spans ---------- */
        const splitText = (el) => {
            let index = 0;
            const wrap = (node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.textContent;
                    const words = text.trim() ? text.split(/\s+/).filter(Boolean) : [];
                    if (!words.length) return;
                    const frag = doc.createDocumentFragment();
                    words.forEach((w) => {
                        const rw = doc.createElement('span');
                        rw.className = 'rw';
                        const rwi = doc.createElement('span');
                        rwi.className = 'rwi';
                        rwi.style.setProperty('--i', index++);
                        rwi.textContent = w;
                        rw.appendChild(rwi);
                        frag.appendChild(rw);
                        frag.appendChild(doc.createTextNode(' '));
                    });
                    node.parentNode.replaceChild(frag, node);
                } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'BR') {
                    Array.from(node.childNodes).forEach(wrap);
                }
            };
            Array.from(el.childNodes).forEach(wrap);
        };

        /* ---------- Scroll reveal (re-runnable) ---------- */
        pageReady.then(initSplitReveal);

        const revealIn = (el) => {
            let delay = 0;
            if (el.hasAttribute('data-delay')) {
                delay = parseInt(el.getAttribute('data-delay'), 10) || 0;
            } else if (el.parentElement) {
                const sibs = Array.from(el.parentElement.children)
                    .filter((c) => c.classList.contains('reveal') || c.classList.contains('reveal-split'));
                delay = sibs.indexOf(el);
            }
            if (delay) el.style.transitionDelay = (delay * 80) + 'ms';
            el.classList.add('in');
        };

        /* ---------- Scroll spy (re-runnable) ---------- */
        initScrollSpy();

        /* ---------- Custom cursor / magnetic / parallax ---------- */
        if (finePointer && !reduced) initCursor();
        if (finePointer && !reduced) initMagnetic();
        if (finePointer && !reduced) initParallax();

        /* ---------- Ambient code + technical tag layer ---------- */
        if (!reduced) initHeroStream();
        if (!reduced) initDevNetwork();
        if (finePointer && !reduced) initBgParallax();
        pageReady.then(() => {
            initGallery();
            if (!reduced) initCaseShowcase();
            initProjectModal();
            initCaseReadMore();
        });

        function initHeroStream() {

            // Realistic code snippets — one pool per technology actually used.
            const SNIPPETS = [
                { lang: 'py', lines: [
                    'def get_products():',
                    '    products = Product.objects.all()',
                    '    return products',
                    'for item in cart:',
                    '    print(item["name"])',
                    'def serialize(data):',
                    '    return json.dumps(data, indent=2)',
                    'class Product(models.Model):',
                    '    name = models.CharField(max_length=100)',
                    'total = sum(p.price for p in products)',
                    'if product.stock > 0:',
                    '    return "in stock"',
                ]},
                { lang: 'django', lines: [
                    'from django.shortcuts import render',
                    'from django.http import JsonResponse',
                    'def index(request):',
                    '    return render(request, "index.html")',
                    'def get_data(request):',
                    '    return JsonResponse({"items": items})',
                    '@login_required',
                    'def dashboard(request):',
                    '    return render(request, "dash.html")',
                    'form = ContactForm(request.POST)',
                    'if form.is_valid():',
                    '    form.save()',
                ]},
                { lang: 'html', lines: [
                    '<div class="hero-grid">',
                    '<nav class="navbar">',
                    '<a href="#projects">Projects</a>',
                    '<link rel="stylesheet" href="style.css">',
                    '<script src="app.js" defer></script>',
                    '<img src="profile.jpg" alt="Kaviyarasan">',
                    '<h1 class="title">Welcome</h1>',
                    '<ul class="nav-links">',
                ]},
                { lang: 'css', lines: [
                    'body { font-family: "Sora", sans-serif; }',
                    '.container { max-width: 1180px; }',
                    '.btn { border-radius: 999px; }',
                    '.hero { display: grid; }',
                    '.nav { position: fixed; top: 0; }',
                    '@media (max-width: 640px) {',
                    '.card { margin: 0 auto; }',
                ]},
                { lang: 'js', lines: [
                    'const stack = ["Python", "Django", "JS"];',
                    'function greet(name) {',
                    '    return `Hello, ${name}`;',
                    '}',
                    'document.querySelector(".btn").click();',
                    'fetch("/api/products").then((res) => res.json());',
                    'let count = 0;',
                    'for (const item of items) { }',
                    'const title = "Django Developer";',
                ]},
                { lang: 'sql', lines: [
                    'SELECT name, email FROM users;',
                    'SELECT * FROM products WHERE price < 500;',
                    'INSERT INTO projects (title) VALUES ("Portfolio");',
                    'UPDATE users SET city = "Salem" WHERE id = 1;',
                    'CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(100));',
                    'SELECT title, role FROM experience ORDER BY start DESC;',
                    'SELECT * FROM orders JOIN users ON users.id = orders.user_id;',
                ]},
                { lang: 'git', lines: [
                    '$ git add .',
                    '$ git commit -m "build a portfolio"',
                    '$ git push origin main',
                    '$ git checkout -b feature/auth',
                    '$ git log --oneline -5',
                    '$ git status',
                ]},
            ];

            const KW = {
                py: new Set(['def','return','class','from','import','if','elif','else','for','in','while','not','and','or','None','True','False','lambda','with','as','raise','try','except','finally','pass','break','continue','async','await','yield','global','del','is','assert','self']),
                js: new Set(['const','let','var','function','return','if','else','for','of','in','while','new','async','await','export','import','from','class','extends','typeof','this','null','undefined','true','false','throw','try','catch','finally','switch','case','default','break','continue','yield','delete','instanceof','do','void']),
                sql: new Set(['SELECT','FROM','WHERE','INSERT','INTO','VALUES','UPDATE','SET','DELETE','ORDER','BY','LIMIT','OFFSET','JOIN','ON','GROUP','HAVING','AS','DISTINCT','COUNT','SUM','AVG','MAX','MIN','PRIMARY','KEY','FOREIGN','REFERENCES','CREATE','TABLE','ALTER','DROP','INDEX','UNIQUE','NOT','NULL','AND','OR','INNER','LEFT','RIGHT','OUTER','CROSS','DATABASE','DESCRIBE','SHOW','USE','AUTO_INCREMENT','VARCHAR','INT','INTEGER','TEXT','BOOLEAN','DATE','TIMESTAMP','DEFAULT','ADD','COLUMN','LIKE','BETWEEN','IN','EXISTS','UNION','COMMIT','TRUNCATE']),
            };
            const GIT_CMD = new Set(['add','commit','push','pull','branch','clone','status','log','diff','merge','checkout','remote','fetch','stash','rebase','init','tag','switch','restore','reset','show','config']);

            const addTok = (parent, cls, text) => {
                if (!text) return;
                if (cls) {
                    const s = doc.createElement('span');
                    s.className = cls;
                    s.textContent = text;
                    parent.appendChild(s);
                } else {
                    parent.appendChild(doc.createTextNode(text));
                }
            };

            const tokenize = (lang, code) => {
                const wrap = doc.createElement('span');
                wrap.className = 'code-frag-text';
                if (lang === 'html') return tokenizeHtml(wrap, code);
                if (lang === 'css') return tokenizeCss(wrap, code);
                return tokenizeGeneric(wrap, code, lang);
            };

            const tokenizeHtml = (wrap, code) => {
                const n = code.length;
                let i = 0, mode = 0;
                while (i < n) {
                    const ch = code[i];
                    if (ch === '<' && code.slice(i, i + 4) === '<!--') {
                        const e = code.indexOf('-->', i + 4);
                        const j = e === -1 ? n : e + 3;
                        addTok(wrap, 'frag-com', code.slice(i, j));
                        i = j; mode = 0; continue;
                    }
                    if (ch === '<') { addTok(wrap, 'frag-tag', '<'); i++; mode = 1; continue; }
                    if (ch === '>') { addTok(wrap, 'frag-tag', '>'); i++; mode = 0; continue; }
                    if (ch === '/') { addTok(wrap, 'frag-tag', '/'); i++; if (mode !== 0) mode = 1; continue; }
                    if (ch === '=') { addTok(wrap, null, '='); i++; continue; }
                    if (ch === '"' || ch === "'") {
                        const q = ch; let j = i + 1;
                        while (j < n && code[j] !== q) j++;
                        j = Math.min(j + 1, n);
                        addTok(wrap, 'frag-str', code.slice(i, j));
                        i = j; continue;
                    }
                    if (/\s/.test(ch)) { let j = i; while (j < n && /\s/.test(code[j])) j++; addTok(wrap, null, code.slice(i, j)); i = j; continue; }
                    if (/[A-Za-z]/.test(ch)) {
                        let j = i; while (j < n && /[A-Za-z0-9-]/.test(code[j])) j++;
                        const w = code.slice(i, j);
                        addTok(wrap, mode === 1 ? 'frag-tag' : 'frag-attr', w);
                        mode = 2;
                        i = j; continue;
                    }
                    addTok(wrap, null, ch); i++;
                }
                return wrap;
            };

            const tokenizeCss = (wrap, code) => {
                const n = code.length;
                let i = 0, valMode = false;
                while (i < n) {
                    const ch = code[i];
                    if (/\s/.test(ch)) { let j = i; while (j < n && /\s/.test(code[j])) j++; addTok(wrap, null, code.slice(i, j)); i = j; continue; }
                    if (ch === '/' && code[i + 1] === '*') {
                        const e = code.indexOf('*/', i + 2);
                        const j = e === -1 ? n : e + 2;
                        addTok(wrap, 'frag-com', code.slice(i, j));
                        i = j; continue;
                    }
                    if (ch === '"' || ch === "'") {
                        const q = ch; let j = i + 1;
                        while (j < n && code[j] !== q) j++;
                        j = Math.min(j + 1, n);
                        addTok(wrap, 'frag-val', code.slice(i, j));
                        i = j; continue;
                    }
                    if (ch === ':') { addTok(wrap, null, ':'); valMode = true; i++; continue; }
                    if (ch === ';' || ch === '{' || ch === '}') { addTok(wrap, null, ch); valMode = false; i++; continue; }
                    if (ch === '@') {
                        let j = i + 1; while (j < n && /[A-Za-z0-9-]/.test(code[j])) j++;
                        addTok(wrap, 'frag-kw', code.slice(i, j));
                        i = j; continue;
                    }
                    if (/[A-Za-z#.\-_0-9]/.test(ch)) {
                        let j = i; while (j < n && /[A-Za-z0-9#.\-_]/.test(code[j])) j++;
                        const w = code.slice(i, j);
                        let k = j; while (k < n && /\s/.test(code[k])) k++;
                        if (code[k] === ':') addTok(wrap, 'frag-prop', w);
                        else addTok(wrap, valMode ? 'frag-val' : null, w);
                        i = j; continue;
                    }
                    addTok(wrap, valMode ? 'frag-val' : null, ch); i++;
                }
                return wrap;
            };

            const tokenizeGeneric = (wrap, code, lang) => {
                const n = code.length;
                let i = 0;
                const kw = KW[lang] || new Set();
                while (i < n) {
                    const ch = code[i];
                    if (/\s/.test(ch)) { let j = i; while (j < n && /\s/.test(code[j])) j++; addTok(wrap, null, code.slice(i, j)); i = j; continue; }
                    if (ch === '#') { addTok(wrap, 'frag-com', code.slice(i)); return wrap; }
                    if (ch === '-' && code[i + 1] === '-' && lang === 'sql') { addTok(wrap, 'frag-com', code.slice(i)); return wrap; }
                    if (ch === '/' && code[i + 1] === '/' && lang === 'js') { addTok(wrap, 'frag-com', code.slice(i)); return wrap; }
                    if (ch === '"' || ch === "'" || (ch === '`' && lang === 'js')) {
                        const q = ch; let j = i + 1;
                        while (j < n && code[j] !== q) j++;
                        j = Math.min(j + 1, n);
                        addTok(wrap, 'frag-str', code.slice(i, j));
                        i = j; continue;
                    }
                    if (/\d/.test(ch)) {
                        let j = i; while (j < n && /[0-9.]/.test(code[j])) j++;
                        addTok(wrap, 'frag-num', code.slice(i, j));
                        i = j; continue;
                    }
                    if (ch === '$' && lang === 'git') { addTok(wrap, null, '$'); i++; continue; }
                    if (lang === 'git' && ch === '-') {
                        let j = i; while (j < n && /[A-Za-z0-9-]/.test(code[j])) j++;
                        addTok(wrap, 'frag-num', code.slice(i, j));
                        i = j; continue;
                    }
                    if (ch === '@') {
                        let j = i + 1; while (j < n && /[A-Za-z_]/.test(code[j])) j++;
                        addTok(wrap, 'frag-kw', code.slice(i, j));
                        i = j; continue;
                    }
                    if (/[A-Za-z_]/.test(ch)) {
                        let j = i; while (j < n && /[A-Za-z0-9_]/.test(code[j])) j++;
                        const w = code.slice(i, j);
                        if (lang === 'git' && w === 'git') addTok(wrap, 'frag-kw', w);
                        else if (lang === 'git' && GIT_CMD.has(w)) addTok(wrap, 'frag-fn', w);
                        else if (kw.has(w)) addTok(wrap, lang === 'sql' ? 'frag-sqlkw' : lang === 'js' ? 'frag-jskw' : 'frag-kw', w);
                        else {
                            let k = j; while (k < n && /\s/.test(code[k])) k++;
                            if (code[k] === '(' && (lang === 'py' || lang === 'js')) addTok(wrap, 'frag-fn', w);
                            else addTok(wrap, null, w);
                        }
                        i = j; continue;
                    }
                    addTok(wrap, null, ch); i++;
                }
                return wrap;
            };

            // Build snippet groups distributed around the viewport edges.
            // Six zones: top-left, top-right, middle-left, middle-right,
            // bottom-left, bottom-right. The center is left clean.
            const ZONES = [
                { x: [3, 20],  y: [6, 16] },
                { x: [78, 95], y: [6, 16] },
                { x: [3, 18],  y: [34, 44] },
                { x: [80, 95], y: [34, 44] },
                { x: [3, 22],  y: [82, 93] },
                { x: [76, 95], y: [82, 93] },
            ];
            const peakR = small ? [0.05, 0.07] : [0.06, 0.08];
            const durR = small ? [18, 30] : [15, 26];
            const groups = small ? 6 : 10;
            for (let g = 0; g < groups; g++) {
                const snippet = pick(SNIPPETS);
                const sliceLen = Math.min(snippet.lines.length, 1 + Math.floor(Math.random() * 3));
                const start = Math.floor(Math.random() * (snippet.lines.length - sliceLen + 1));
                const lines = snippet.lines.slice(start, start + sliceLen);
                const zone = ZONES[g % ZONES.length];
                const multi = lines.length > 1;
                const vertical = !multi && Math.random() < 0.5;
                const dir = vertical ? (Math.random() < 0.5 ? '--ud' : '--up') : (Math.random() < 0.5 ? '--lr' : '--rl');
                const dur = rnd(durR[0], durR[1]);
                const delay = rnd(0, 8);
                for (let j = 0; j < lines.length; j++) {
                    const el = doc.createElement('span');
                    el.className = 'code-frag code-frag' + dir;
                    el.appendChild(tokenize(snippet.lang, lines[j]));
                    el.style.setProperty('--s', rnd(0.68, 0.94).toFixed(2) + 'rem');
                    el.style.setProperty('--dur', dur.toFixed(1) + 's');
                    el.style.setProperty('--delay', delay.toFixed(1) + 's');
                    el.style.setProperty('--rot', rnd(-1.4, 1.4).toFixed(1) + 'deg');
                    if (vertical) {
                        el.style.setProperty('--x', rnd(zone.x[0], zone.x[1]).toFixed(1) + '%');
                    } else {
                        el.style.setProperty('--y', Math.min(rnd(zone.y[0], zone.y[1]) + j * 1.6, 94).toFixed(1) + '%');
                    }
                    el.style.setProperty('--peak', rnd(peakR[0], peakR[1]).toFixed(3));
                    bg.appendChild(el);
                }
            }
        }

        function initHeroStream() {
            const stream = doc.querySelector('.hero-stream');
            if (!stream) return;
            if (heroStreamInstance) heroStreamInstance.dispose();

            const small = window.innerWidth < 641;
            const scripts = small ? [
                'initializing developer environment…',
                '$ whoami',
                '→ django full stack developer',
                'system ready_'
            ] : [
                'initializing developer environment…',
                '$ whoami',
                '→ django full stack developer',
                '$ git status',
                '→ on branch main — clean working tree',
                'python manage.py runserver',
                '→ watching for file changes',
                '→ system check: no issues',
                'system ready_'
            ];
            const maxLines = small ? 4 : 8;
            const lines = [];
            let timer = null;
            let pos = 0;
            let current = null;
            let hidden = false;

            const stopTimer = () => {
                if (timer) { clearTimeout(timer); clearInterval(timer); timer = null; }
            };

            const spawn = () => {
                const el = doc.createElement('div');
                el.className = 'stream-line';
                stream.appendChild(el);
                lines.push(el);
                while (lines.length > maxLines) {
                    const gone = lines.shift();
                    gone.style.opacity = '0';
                    gone.addEventListener('transitionend', () => gone.remove(), { once: true });
                }
                lines.forEach((l) => l.classList.remove('cur', 'done'));
                el.classList.add('cur');
                return el;
            };

            const render = (state) => {
                state.el.innerHTML = '';
                state.el.appendChild(doc.createTextNode(state.text.slice(0, state.i)));
                const caret = doc.createElement('span');
                caret.className = 'stream-caret';
                caret.textContent = '▊';
                state.el.appendChild(caret);
            };

            const finish = (state) => {
                stopTimer();
                state.el.classList.remove('cur');
                state.el.classList.add('done');
                state.el.innerHTML = '';
                state.el.appendChild(doc.createTextNode(state.text));
                current = null;
                return state.text === scripts[scripts.length - 1];
            };

            const startTyping = (state) => {
                stopTimer();
                timer = setInterval(() => {
                    if (hidden) return;
                    state.i++;
                    if (state.i >= state.text.length) {
                        stopTimer();
                        if (state.text === scripts[scripts.length - 1]) {
                            render(state);
                            timer = setTimeout(() => {
                                stream.classList.add('out');
                                timer = setTimeout(() => {
                                    stream.classList.remove('out');
                                    lines.slice().forEach((l) => l.remove());
                                    lines.length = 0;
                                    advance();
                                }, 700);
                            }, 3600);
                        } else {
                            finish(state);
                            timer = setTimeout(advance, 520);
                        }
                        return;
                    }
                    render(state);
                }, 22);
            };

            const advance = () => {
                if (hidden) return;
                stopTimer();
                const el = spawn();
                current = { el, text: scripts[pos % scripts.length], i: 0 };
                pos++;
                startTyping(current);
            };

            const inst = {
                dispose: function () {
                    hidden = true;
                    stopTimer();
                    current = null;
                    lines.slice().forEach((l) => { l.style.opacity = '0'; l.remove(); });
                    lines.length = 0;
                },
                setHidden: function (value) {
                    hidden = value;
                    if (hidden) stopTimer();
                    else if (current) startTyping(current);
                    else advance();
                }
            };

            heroStreamInstance = inst;

            if (!heroStreamWired) {
                heroStreamWired = true;
                doc.addEventListener('visibilitychange', () => {
                    if (heroStreamInstance) heroStreamInstance.setHidden(doc.hidden);
                });
            }

            advance();
        }

        function initBgParallax() {            const bg = doc.querySelector('.code-bg');
            const aurora = doc.querySelector('.hero-aurora');
            if (!bg && !aurora) return;
            if (window.innerWidth < 1024) return;
            if (bgParallaxInstance) bgParallaxInstance.dispose();
            let mx = 0, my = 0, sy = 0, raf = null;
            const apply = () => {
                raf = null;
                if (bg) bg.style.transform = 'translate3d(' + (mx * 10).toFixed(1) + 'px,' + (my * 7 + sy * 0.35).toFixed(1) + 'px,0)';
                if (aurora) aurora.style.transform = 'translate3d(' + (mx * -6).toFixed(1) + 'px,' + (my * -4).toFixed(1) + 'px,0)';
            };
            const schedule = () => {
                if (raf) return;
                raf = window.requestAnimationFrame(apply);
            };
            const onMove = (e) => {
                mx = (e.clientX / window.innerWidth - 0.5) * 2;
                my = (e.clientY / window.innerHeight - 0.5) * 2;
                schedule();
            };
            const onScroll = () => {
                sy = Math.min(window.scrollY || doc.documentElement.scrollTop, 400);
                schedule();
            };
            doc.addEventListener('mousemove', onMove, { passive: true });
            window.addEventListener('scroll', onScroll, { passive: true });
            bgParallaxInstance = {
                dispose: function () {
                    if (raf) { cancelAnimationFrame(raf); raf = null; }
                    doc.removeEventListener('mousemove', onMove, { passive: true });
                    window.removeEventListener('scroll', onScroll, { passive: true });
                }
            };
        }

        function initDevNetwork() {
            const canvas = doc.querySelector('.dev-network');
            if (!canvas) return;
            if (devNetworkInstance) devNetworkInstance.dispose();
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const small = window.innerWidth < 641;
            const fine = window.matchMedia('(pointer: fine)').matches;
            const interactive = !small && fine;
            const LABELS = ['PYTHON', 'DJANGO', 'MYSQL', 'REST API', 'JAVASCRIPT', 'GIT', 'GITHUB'];
            const rnd = (a, b) => a + Math.random() * (b - a);

            const tierDefs = small ? [
                { count: 12, rMin: 1, rMax: 1.6, baseMin: 0.06, baseMax: 0.12, radius: 0.5, lift: 0.1 },
                { count: 9, rMin: 1.4, rMax: 2, baseMin: 0.1, baseMax: 0.18, radius: 0.42, lift: 0.16 },
                { count: 5, rMin: 1.8, rMax: 2.6, baseMin: 0.14, baseMax: 0.26, radius: 0.34, lift: 0.22 }
            ] : [
                { count: 26, rMin: 1, rMax: 1.6, baseMin: 0.07, baseMax: 0.14, radius: 0.5, lift: 0.1 },
                { count: 20, rMin: 1.4, rMax: 2.1, baseMin: 0.12, baseMax: 0.22, radius: 0.42, lift: 0.18 },
                { count: 14, rMin: 1.9, rMax: 2.8, baseMin: 0.16, baseMax: 0.3, radius: 0.34, lift: 0.26 }
            ];
            const labelCount = small ? 1 : 3;
            const maxEdges = small ? 10 : 26;

            let W = 0, H = 0, dpr = 1;
            let rot = 0, time = 0, hidden = false, rafId = null;
            let curX = -9999, curY = -9999, mx = 0, my = 0;
            let nodes = [], particles = [], candEdges = [], liveEdges = [], labeled = [];
            let nextSpawn = 40, nextLabel = 200;
            const stats = { n: 0, e: 0, l: 0 };

            const resize = () => {
                W = canvas.clientWidth || window.innerWidth;
                H = canvas.clientHeight || window.innerHeight;
                dpr = Math.min(window.devicePixelRatio || 1, 2);
                canvas.width = Math.round(W * dpr);
                canvas.height = Math.round(H * dpr);
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            };

            const spawnEdge = () => {
                if (!candEdges.length) return;
                const active = new Set(liveEdges.map((e) => e.a.id + ':' + e.b.id));
                let idx = Math.floor(Math.random() * candEdges.length);
                for (let tries = 0; tries < 14; tries++) {
                    const e = candEdges[idx];
                    if (!active.has(e[0].id + ':' + e[1].id)) {
                        liveEdges.push({ a: e[0], b: e[1], age: 0, dur: Math.floor(rnd(90, 260)) });
                        return;
                    }
                    idx = (idx + 1) % candEdges.length;
                }
            };

            const assignLabels = () => {
                labeled.forEach((n) => { n.label = null; });
                labeled = [];
                const pool = nodes.filter((n) => n.layer > 0);
                for (let k = 0; k < labelCount && pool.length; k++) {
                    const i = Math.floor(Math.random() * pool.length);
                    const n = pool.splice(i, 1)[0];
                    n.label = LABELS[Math.floor(Math.random() * LABELS.length)];
                    labeled.push(n);
                }
            };

            const build = () => {
                nodes = [];
                particles = [];
                candEdges = [];
                liveEdges = [];
                labeled = [];
                let id = 0;
                tierDefs.forEach((tier, layer) => {
                    for (let i = 0; i < tier.count; i++) {
                        const ang = Math.random() * Math.PI * 2;
                        const rad = Math.sqrt(Math.random()) * tier.radius;
                        nodes.push({
                            id: id++,
                            layer,
                            nx: 0.5 + Math.cos(ang) * rad,
                            ny: 0.5 + Math.sin(ang) * rad,
                            r: rnd(tier.rMin, tier.rMax),
                            base: rnd(tier.baseMin, tier.baseMax),
                            lift: tier.lift,
                            cur: rnd(tier.baseMin, tier.baseMax),
                            lalpha: 0,
                            fx: rnd(0.00028, 0.0007),
                            fy: rnd(0.00028, 0.0007),
                            phx: rnd(0, Math.PI * 2),
                            phy: rnd(0, Math.PI * 2),
                            amp: rnd(1.5, 5),
                            label: null,
                            sx: 0, sy: 0
                        });
                    }
                });

                const pc = small ? 5 : 12;
                for (let i = 0; i < pc; i++) {
                    particles.push({
                        nx: Math.random(), ny: Math.random(),
                        vx: rnd(-0.00006, 0.00006), vy: rnd(-0.00006, 0.00006),
                        r: rnd(0.7, 1.4), a: rnd(0.05, 0.12),
                        ph: rnd(0, Math.PI * 2)
                    });
                }

                const threshold = small ? 0.055 : 0.042;
                for (let i = 0; i < nodes.length; i++) {
                    for (let j = i + 1; j < nodes.length; j++) {
                        const a = nodes[i], b = nodes[j];
                        if (Math.abs(a.layer - b.layer) > 1) continue;
                        const dx = a.nx - b.nx, dy = a.ny - b.ny;
                        if (dx * dx + dy * dy < threshold) candEdges.push([a, b]);
                    }
                }

                assignLabels();
                const seed = Math.min(Math.floor(maxEdges * 0.5), candEdges.length);
                for (let k = 0; k < seed; k++) spawnEdge();
                nextSpawn = 40;
            };

            const draw = () => {
                time++;
                rot += 0.00012;
                const bob = Math.sin(time * 0.00015) * 0.012;
                const c = Math.cos(rot), s = Math.sin(rot);

                ctx.clearRect(0, 0, W, H);

                for (let i = 0; i < nodes.length; i++) {
                    const n = nodes[i];
                    const dx = n.nx - 0.5, dy = n.ny - 0.5;
                    const rx = dx * c - dy * s;
                    const ry = dx * s + dy * c;
                    n.sx = (0.5 + rx) * W + Math.sin(time * n.fx + n.phx) * n.amp + mx * (1 + n.layer) * 3;
                    n.sy = (0.5 + ry + bob) * H + Math.sin(time * n.fy + n.phy) * n.amp + my * (1 + n.layer) * 2.4;
                }

                for (let i = 0; i < nodes.length; i++) {
                    const n = nodes[i];
                    let t = n.base + Math.sin(time * 0.0005 + n.phx) * 0.02;
                    if (interactive) {
                        const d = Math.hypot(n.sx - curX, n.sy - curY);
                        if (d < 110) t = n.base + n.lift * (0.35 + 0.65 * (1 - d / 110));
                        else if (d < 210) t = n.base + n.lift * 0.4 * (1 - d / 210);
                    }
                    n.cur += (t - n.cur) * 0.06;
                }

                for (let i = liveEdges.length - 1; i >= 0; i--) {
                    const e = liveEdges[i];
                    e.age++;
                    if (e.age > e.dur) { liveEdges.splice(i, 1); continue; }
                    const t = e.age / e.dur;
                    const fade = t < 0.22 ? t / 0.22 : t > 0.82 ? (1 - t) / 0.18 : 1;
                    const boost = Math.max(e.a.cur - e.a.base, e.b.cur - e.b.base, 0);
                    ctx.globalAlpha = fade * (0.05 + Math.min(boost * 0.22, 0.12));
                    ctx.strokeStyle = '#6ea8ff';
                    ctx.lineWidth = e.a.layer === 0 && e.b.layer === 0 ? 0.75 : 1;
                    ctx.beginPath();
                    ctx.moveTo(e.a.sx, e.a.sy);
                    ctx.lineTo(e.b.sx, e.b.sy);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;

                if (interactive) {
                    ctx.globalCompositeOperation = 'lighter';
                    const g = ctx.createRadialGradient(curX, curY, 0, curX, curY, 200);
                    g.addColorStop(0, 'rgba(110,168,255,0.035)');
                    g.addColorStop(1, 'rgba(110,168,255,0)');
                    ctx.fillStyle = g;
                    ctx.fillRect(0, 0, W, H);
                    ctx.globalCompositeOperation = 'source-over';
                }

                for (let i = 0; i < particles.length; i++) {
                    const p = particles[i];
                    p.nx += p.vx; p.ny += p.vy;
                    if (p.nx < 0) p.nx = 1; else if (p.nx > 1) p.nx = 0;
                    if (p.ny < 0) p.ny = 1; else if (p.ny > 1) p.ny = 0;
                    ctx.globalAlpha = p.a;
                    ctx.fillStyle = '#6ea8ff';
                    ctx.beginPath();
                    ctx.arc(p.nx * W + Math.sin(time * 0.0004 + p.ph) * 3, p.ny * H + Math.cos(time * 0.0003 + p.ph) * 3, p.r, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;

                nextSpawn--;
                if (nextSpawn <= 0 && liveEdges.length < maxEdges) {
                    spawnEdge();
                    nextSpawn = Math.floor(rnd(40, 110));
                }

                nextLabel--;
                if (nextLabel <= 0) {
                    assignLabels();
                    nextLabel = Math.floor(rnd(240, 400));
                }
                for (let i = 0; i < nodes.length; i++) {
                    const n = nodes[i];
                    const want = n.label ? 1 : 0;
                    n.lalpha += (want - n.lalpha) * 0.04;
                }

                for (let i = 0; i < nodes.length; i++) {
                    const n = nodes[i];
                    const bright = n.cur - n.base;
                    ctx.globalAlpha = Math.min(n.cur, 0.7);
                    ctx.fillStyle = '#6ea8ff';
                    ctx.beginPath();
                    ctx.arc(n.sx, n.sy, n.r * (1 + Math.max(0, bright) * 1.2), 0, Math.PI * 2);
                    ctx.fill();
                    if (bright > 0.02) {
                        ctx.globalCompositeOperation = 'lighter';
                        const gg = ctx.createRadialGradient(n.sx, n.sy, 0, n.sx, n.sy, n.r * 6);
                        gg.addColorStop(0, 'rgba(110,168,255,' + (bright * 0.4).toFixed(3) + ')');
                        gg.addColorStop(1, 'rgba(110,168,255,0)');
                        ctx.fillStyle = gg;
                        ctx.beginPath();
                        ctx.arc(n.sx, n.sy, n.r * 6, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.globalCompositeOperation = 'source-over';
                    }
                }
                ctx.globalAlpha = 1;

                ctx.font = '500 9px "JetBrains Mono", monospace';
                ctx.textAlign = 'center';
                if ('letterSpacing' in ctx) ctx.letterSpacing = '1px';
                for (let i = 0; i < labeled.length; i++) {
                    const n = labeled[i];
                    if (n.lalpha < 0.02) continue;
                    ctx.globalAlpha = Math.min(n.cur * n.lalpha * 0.85, 0.6);
                    ctx.fillStyle = '#6ea8ff';
                    ctx.fillText(n.label, n.sx, n.sy - n.r - 9);
                }
                ctx.globalAlpha = 1;
                if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
            };

            const loop = () => {
                if (hidden) { rafId = null; return; }
                draw();
                stats.n = nodes.length;
                stats.e = liveEdges.length;
                stats.l = labeled.length;
                canvas._net = stats;
                rafId = window.requestAnimationFrame(loop);
            };

            const onMove = (e) => {
                curX = e.clientX;
                curY = e.clientY;
                mx = (curX / W - 0.5) * 2;
                my = (curY / H - 0.5) * 2;
            };

            let resizeRaf = null;
            const onResize = () => {
                if (resizeRaf) return;
                resizeRaf = window.requestAnimationFrame(() => {
                    resizeRaf = null;
                    resize();
                });
            };

            const onVis = () => {
                hidden = doc.hidden;
                if (!hidden && rafId === null) loop();
            };

            window.addEventListener('resize', onResize, { passive: true });
            if (interactive) doc.addEventListener('mousemove', onMove, { passive: true });
            doc.addEventListener('visibilitychange', onVis);

            devNetworkInstance = {
                dispose: function () {
                    hidden = true;
                    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
                    window.removeEventListener('resize', onResize, { passive: true });
                    doc.removeEventListener('mousemove', onMove, { passive: true });
                    doc.removeEventListener('visibilitychange', onVis);
                }
            };

            resize();
            build();
            loop();
        }

        /* ---------- Fullscreen project image gallery ---------- */
        function initGallery() {
            const gallery = doc.getElementById('gallery');
            if (!gallery) return;
            const stage = gallery.querySelector('[data-gallery-stage]');
            const groups = Array.from(gallery.querySelectorAll('[data-gallery-group]'));
            const triggers = Array.from(doc.querySelectorAll('[data-gallery-trigger]'));
            const closeBtn = gallery.querySelector('[data-gallery-close]');
            const prevBtn = gallery.querySelector('[data-gallery-prev]');
            const nextBtn = gallery.querySelector('[data-gallery-next]');
            const dotsWrap = gallery.querySelector('[data-gallery-dots]');
            const counter = gallery.querySelector('[data-gallery-counter]');
            if (!stage || !groups.length || !triggers.length) return;

            const AUTO_MS = 4500;
            let active = null;
            let slides = [];
            let index = 0;
            let timer = null;
            let sx = null, sy = null;
            let lastTrigger = null;

            const stop = () => {
                if (timer) { clearInterval(timer); timer = null; }
            };
            const start = () => {
                stop();
                if (reduced || slides.length < 2) return;
                timer = setInterval(() => go(index + 1), AUTO_MS);
            };
            const restart = () => { stop(); start(); };

            const go = (i) => {
                if (!slides.length) return;
                index = (i + slides.length) % slides.length;
                slides.forEach((s, n) => s.classList.toggle('is-active', n === index));
                Array.from(dotsWrap.children).forEach((d, n) => d.classList.toggle('is-active', n === index));
                if (counter) counter.textContent = (index + 1) + ' / ' + slides.length;
            };

            const buildDots = () => {
                dotsWrap.innerHTML = '';
                slides.forEach((_, n) => {
                    const dot = doc.createElement('button');
                    dot.type = 'button';
                    dot.className = 'gallery-dot' + (n === index ? ' is-active' : '');
                    dot.setAttribute('aria-label', 'Show image ' + (n + 1) + ' of ' + slides.length);
                    dot.addEventListener('click', () => { go(n); restart(); });
                    dotsWrap.appendChild(dot);
                });
            };

            const open = (trigger) => {
                const target = doc.getElementById(trigger.getAttribute('data-gallery-trigger'));
                if (!target) return;
                stop();
                if (active) active.classList.remove('is-active');
                active = target;
                active.classList.add('is-active');
                slides = Array.from(active.querySelectorAll('[data-slide]'));
                index = 0;
                slides.forEach((s, n) => s.classList.toggle('is-active', n === 0));
                if (counter) counter.textContent = '1 / ' + slides.length;
                buildDots();
                lastTrigger = trigger;
                gallery.classList.add('is-open');
                gallery.setAttribute('aria-hidden', 'false');
                doc.body.classList.add('gallery-open');
                if (closeBtn && window.innerWidth > 640) closeBtn.focus();
                start();
            };

            const close = () => {
                if (!gallery.classList.contains('is-open')) return;
                stop();
                gallery.classList.remove('is-open');
                gallery.setAttribute('aria-hidden', 'true');
                doc.body.classList.remove('gallery-open');
                if (lastTrigger) lastTrigger.focus();
            };

            const ctrl = {
                gallery: gallery,
                stop: stop,
                start: start,
                restart: restart,
                go: go,
                buildDots: buildDots,
                open: open,
                close: close,
                getIndex: function () { return index; }
            };
            gallery._galleryCtrl = ctrl;

            triggers.forEach((btn) => btn.addEventListener('click', () => ctrl.open(btn)));

            if (gallery.dataset.galleryWired) return;
            gallery.dataset.galleryWired = '1';

            const cur = () => (gallery._galleryCtrl || ctrl);

            if (closeBtn) closeBtn.addEventListener('click', () => cur().close());
            if (prevBtn) prevBtn.addEventListener('click', () => { cur().go(cur().getIndex() - 1); cur().restart(); });
            if (nextBtn) nextBtn.addEventListener('click', () => { cur().go(cur().getIndex() + 1); cur().restart(); });

            stage.addEventListener('click', (e) => {
                if (e.target.closest('img') || e.target.closest('button')) return;
                cur().close();
            });

            stage.addEventListener('touchstart', (e) => {
                const c = cur();
                c._sx = e.touches[0].clientX;
                c._sy = e.touches[0].clientY;
                c.stop();
            }, { passive: true });
            stage.addEventListener('touchmove', (e) => {
                const c = cur();
                if (c._sx === null) return;
                const dx = e.touches[0].clientX - c._sx;
                const dy = e.touches[0].clientY - c._sy;
                if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) e.preventDefault();
            }, { passive: false });
            stage.addEventListener('touchend', (e) => {
                const c = cur();
                if (c._sx === null) return;
                const dx = e.changedTouches[0].clientX - c._sx;
                const dy = e.changedTouches[0].clientY - c._sy;
                if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
                    if (dx < 0) c.go(c.getIndex() + 1); else c.go(c.getIndex() - 1);
                }
                c._sx = null; c._sy = null;
                c.restart();
            }, { passive: true });

            gallery.addEventListener('pointerenter', () => cur().stop());
            gallery.addEventListener('pointerleave', () => cur().restart());

            doc.addEventListener('keydown', (e) => {
                const c = cur();
                if (!c.gallery.classList.contains('is-open')) return;
                if (e.key === 'Escape') c.close();
                else if (e.key === 'ArrowRight') { c.go(c.getIndex() + 1); c.restart(); }
                else if (e.key === 'ArrowLeft') { c.go(c.getIndex() - 1); c.restart(); }
            });

            doc.addEventListener('visibilitychange', () => {
                const c = cur();
                if (doc.hidden) c.stop();
                else if (c.gallery.classList.contains('is-open')) c.start();
            });
        }

        function initCaseShowcase() {
            const cases = Array.from(doc.querySelectorAll('#projects .case'));
            if (!cases.length) return;

            cases.forEach((c) => {
                c.classList.add('case-scene');
                c.querySelectorAll('.reveal').forEach((el) => el.classList.remove('reveal'));

                const no = c.querySelector('.case-no');
                const title = c.querySelector('.case-title');
                const short = c.querySelector('.case-short');
                const tech = c.querySelector('.case-tech');
                const actions = c.querySelector('.case-actions');
                const chips = Array.from(c.querySelectorAll('.case-tech .chip'));
                const readMore = c.querySelector('.case-read-toggle');

                const show = (el, d) => {
                    if (!el) return;
                    el.setAttribute('data-show', '');
                    el.style.setProperty('--show-delay', d + 'ms');
                };

                let t = 0;
                show(no, t);
                show(title, t += 70);
                show(short, t += 80);
                show(tech, t += 80);
                chips.forEach((chip, i) => show(chip, t + 60 + i * 55));
                show(actions, t + 90);
                if (readMore) show(readMore, t + 90);
            });

            if ('IntersectionObserver' in window) {
                const revealObs = new IntersectionObserver((entries) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) return;
                        entry.target.classList.add('is-in');
                        revealObs.unobserve(entry.target);
                    });
                }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
                cases.forEach((c) => revealObs.observe(c));

                let active = null;
                const bandObs = new IntersectionObserver(() => {
                    const line = window.innerHeight * 0.4;
                    let best = null, bestDist = Infinity;
                    cases.forEach((c) => {
                        const r = c.getBoundingClientRect();
                        if (r.bottom < 0 || r.top > window.innerHeight) return;
                        const d = Math.abs(r.top + r.height / 2 - line);
                        if (d < bestDist) { bestDist = d; best = c; }
                    });
                    if (best) {
                        if (active && active !== best) {
                            active.classList.remove('is-active');
                            active.classList.add('is-past');
                        }
                        best.classList.remove('is-past');
                        best.classList.add('is-active');
                        active = best;
                    } else if (active) {
                        active.classList.remove('is-active');
                        active.classList.add('is-past');
                        active = null;
                    }
                }, { rootMargin: '-20% 0px -40% 0px' });
                cases.forEach((c) => bandObs.observe(c));
            } else {
                cases.forEach((c) => c.classList.add('is-in', 'is-active'));
            }
        }

        function initCaseReadMore() {
            const cards = Array.from(doc.querySelectorAll('#projects .case'));
            if (!cards.length) return;

            cards.forEach((card) => {
                const toggle = card.querySelector('[data-case-toggle]');
                const short = card.querySelector('.case-short');
                const details = card.querySelector('.case-details');
                if (!toggle || !short || !details) return;

                const labelEl = toggle.querySelector('.case-read-label') || toggle;
                let collapsedH = short.clientHeight;
                short.style.maxHeight = collapsedH + 'px';

                const refreshCollapsed = () => {
                    if (card.classList.contains('is-expanded')) return;
                    collapsedH = short.clientHeight;
                    short.style.maxHeight = collapsedH + 'px';
                };

                const getDetailsH = () => {
                    const wasHidden = details.hasAttribute('hidden');
                    details.removeAttribute('hidden');
                    const h = details.scrollHeight;
                    if (wasHidden) details.setAttribute('hidden', '');
                    return h;
                };

                let animating = false;

                const expand = () => {
                    if (animating) return;
                    animating = true;
                    card.classList.add('is-expanded');
                    short.style.transition = 'max-height 0.28s var(--ease)';
                    short.style.maxHeight = short.scrollHeight + 'px';
                    details.removeAttribute('hidden');
                    void details.offsetHeight;
                    details.style.maxHeight = getDetailsH() + 'px';
                    details.style.opacity = '1';
                    toggle.setAttribute('aria-expanded', 'true');
                    labelEl.textContent = 'Read less';
                    window.setTimeout(() => { animating = false; }, 300);
                };

                const collapse = () => {
                    if (animating) return;
                    animating = true;
                    short.style.transition = 'max-height 0.28s var(--ease)';
                    short.style.maxHeight = collapsedH + 'px';
                    details.style.maxHeight = '0px';
                    details.style.opacity = '0';
                    toggle.setAttribute('aria-expanded', 'false');
                    labelEl.textContent = 'Read more';
                    window.setTimeout(() => {
                        card.classList.remove('is-expanded');
                        details.setAttribute('hidden', '');
                        details.style.maxHeight = '';
                        details.style.opacity = '';
                        animating = false;
                    }, 300);
                };

                toggle.addEventListener('click', () => {
                    if (card.classList.contains('is-expanded')) collapse();
                    else expand();
                });

                if (doc.fonts && typeof doc.fonts.ready === 'object') {
                    doc.fonts.ready.then(refreshCollapsed).catch(() => {});
                }

                let resizeTimer = null;
                window.addEventListener('resize', () => {
                    window.clearTimeout(resizeTimer);
                    resizeTimer = window.setTimeout(() => {
                        if (card.classList.contains('is-expanded')) {
                            short.style.transition = 'max-height 0.28s var(--ease)';
                            short.style.maxHeight = short.scrollHeight + 'px';
                            details.style.maxHeight = getDetailsH() + 'px';
                        } else {
                            refreshCollapsed();
                        }
                    }, 200);
                });
            });
        }

        function initProjectModal() {
            const modal = doc.getElementById('projectModal');
            if (!modal) return;
            const titleEl = modal.querySelector('.pm-title');
            const bodyEl = modal.querySelector('.pm-body');
            const closeEls = Array.from(modal.querySelectorAll('[data-pm-close]'));

            const focusables = () => Array.from(modal.querySelectorAll('a[href], button:not([disabled])'))
                .filter((el) => el.offsetParent !== null);

            const open = (card) => {
                const title = card.querySelector('.case-title');
                const details = card.querySelector('.case-details');
                if (!details) return;
                if (titleEl && title) titleEl.textContent = title.textContent.trim();
                if (bodyEl) bodyEl.innerHTML = details.innerHTML;
                modal._lastTrigger = card.querySelector('[data-project-details]');
                modal.classList.add('is-open');
                modal.setAttribute('aria-hidden', 'false');
                doc.body.classList.add('project-open');
                const closeBtn = modal.querySelector('.pm-close');
                if (closeBtn && window.innerWidth > 640) {
                    setTimeout(() => closeBtn.focus(), 0);
                }
            };

            const close = () => {
                if (!modal.classList.contains('is-open')) return;
                modal.classList.remove('is-open');
                modal.setAttribute('aria-hidden', 'true');
                doc.body.classList.remove('project-open');
                if (modal._lastTrigger && typeof modal._lastTrigger.focus === 'function') modal._lastTrigger.focus();
            };

            modal._modalCtrl = { close: close, open: open };

            doc.querySelectorAll('[data-project-details]').forEach((btn) => {
                btn.addEventListener('click', () => open(btn.closest('.case')));
            });

            if (modal.dataset.pmWired) return;
            modal.dataset.pmWired = '1';

            closeEls.forEach((el) => el.addEventListener('click', close));

            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.classList.contains('pm-backdrop')) close();
            });

            doc.addEventListener('keydown', (e) => {
                if (!modal.classList.contains('is-open')) return;
                if (e.key === 'Escape') { close(); return; }
                if (e.key === 'Tab') {
                    const list = focusables();
                    if (!list.length) return;
                    const first = list[0];
                    const last = list[list.length - 1];
                    if (e.shiftKey && (doc.activeElement === first || doc.activeElement === modal)) {
                        e.preventDefault();
                        last.focus();
                    } else if (!e.shiftKey && doc.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            });
        }

        function initCursor() {
            const dot = doc.getElementById('cursorDot');
            const ring = doc.getElementById('cursorRing');
            const light = doc.getElementById('cursorLight');
            if (!dot || !ring) return;

            let mx = -100, my = -100;
            let rx = -100, ry = -100;
            let visible = false;

            const onMove = (e) => {
                mx = e.clientX;
                my = e.clientY;
                if (!visible) {
                    visible = true;
                    dot.style.opacity = '1';
                    ring.style.opacity = '1';
                }
            };

            const loop = () => {
                rx += (mx - rx) * 0.16;
                ry += (my - ry) * 0.16;
                dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
                ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
                if (light) light.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
                window.requestAnimationFrame(loop);
            };

            const hoverables = 'a, button, input, textarea, .stack-item, .case-link, .contact-link';
            doc.addEventListener('mouseover', (e) => {
                ring.classList.toggle('hover', !!(e.target.closest && e.target.closest(hoverables)));
            });
            doc.addEventListener('mouseout', (e) => {
                if (e.target.closest && !e.target.closest(hoverables)) ring.classList.remove('hover');
            });
            doc.addEventListener('mouseleave', () => {
                visible = false;
                dot.style.opacity = '0';
                ring.style.opacity = '0';
            });
            doc.addEventListener('mouseenter', () => {
                visible = true;
                dot.style.opacity = '1';
                ring.style.opacity = '1';
            });

            window.addEventListener('mousemove', onMove, { passive: true });
            window.requestAnimationFrame(loop);
        }

        function initMagnetic() {
            doc.querySelectorAll('.magnetic').forEach((el) => {
                const strength = 0.28;
                let raf = null;
                let pressed = false;
                el.addEventListener('mousemove', (e) => {
                    if (pressed) return;
                    const r = el.getBoundingClientRect();
                    const dx = e.clientX - (r.left + r.width / 2);
                    const dy = e.clientY - (r.top + r.height / 2);
                    cancelAnimationFrame(raf);
                    raf = window.requestAnimationFrame(() => {
                        el.style.transform = 'translate(' + (dx * strength) + 'px,' + (dy * strength) + 'px)';
                    });
                });
                el.addEventListener('mousedown', () => {
                    pressed = true;
                    cancelAnimationFrame(raf);
                    el.style.transform = 'scale(0.98)';
                });
                const release = () => {
                    pressed = false;
                    cancelAnimationFrame(raf);
                    el.style.transform = '';
                };
                el.addEventListener('mouseup', release);
                el.addEventListener('mouseleave', release);
            });
        }

        function initParallax() {
            doc.querySelectorAll('[data-parallax]').forEach((el) => {
                const strength = parseFloat(el.getAttribute('data-parallax')) || 0.06;
                const zone = el.closest('.hero') || el.parentElement;
                zone.addEventListener('mousemove', (e) => {
                    const r = el.getBoundingClientRect();
                    const dx = e.clientX - (r.left + r.width / 2);
                    const dy = e.clientY - (r.top + r.height / 2);
                    el.style.transform = 'translate3d(' + (dx * strength) + 'px,' + (dy * strength) + 'px,0)';
                });
                zone.addEventListener('mouseleave', () => {
                    el.style.transform = '';
                });
            });
        }

        /* ---------- GitHub activity stats (live) ---------- */
        function initGithubStats() {
            const cards = Array.from(doc.querySelectorAll('[data-gh-stat]'));
            if (!cards.length) return;
            const populate = (key, value) => {
                const card = cards.find((c) => c.getAttribute('data-gh-stat') === key);
                const el = card && card.querySelector('[data-gh-value]');
                if (el && value !== null && value !== undefined && value !== '') el.textContent = value;
            };
            fetch('/github-stats/', { headers: { 'Accept': 'application/json' } })
                .then((res) => (res.ok ? res.json() : Promise.reject(new Error('GitHub stats unavailable'))))
                .then((data) => {
                    populate('repos', data.public_repos);
                    populate('contributions', data.contributions_year);
                    populate('language', data.top_language);
                })
                .catch(() => {
                    // Keep the "—" placeholders: honest when GitHub cannot be reached.
                });
        }
        initGithubStats();
    });
})();
