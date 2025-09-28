const createBook = (d) => ({
    key: d.key || '',
    title: d.title || 'Unknown Title',
    authors: d.authors || d.author_name || [],
    firstPublishYear: d.first_publish_year || null,
    coverId: d.cover_i || null,
    subjects: d.subject || [],
    editionCount: d.edition_count || 0,
    hasFulltext: d.has_fulltext || false,
    publicScan: d.public_scan_b || false,
    availability: d.availability || {}
});

const getAuthorsString = (b) => b.authors.join(', ') || 'Unknown Author';
const getPublishYear = (b) => b.firstPublishYear || 'Unknown Year';
const getBookCoverURL = (b, s = 'M') => b.coverId ? getCoverURL(b.coverId, s) : null;
const calculateRating = (b) => Math.min(5, 3 + (b.hasFulltext ? 0.5 : 0) + (b.publicScan ? 0.5 : 0) + (b.editionCount > 5 ? 0.5 : 0) + (b.editionCount > 10 ? 0.5 : 0));
const isBookAvailable = (b) => b.hasFulltext || b.publicScan || b.availability?.status === 'available';

// Detalles 
const createBookDetails = (basic, detail, editions = []) => ({ basic, detail, editions });
const getBookDescription = (d) => typeof d.detail.description === 'string' ? d.detail.description : d.detail.description?.value || 'No description available';
const getBookLinks = (d) => d.basic.key ? [{ text: 'View on OpenLibrary', url: `https://openlibrary.org${d.basic.key}` }] : [];

const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);
const elements = {
    loading: () => $('loading'),
    error: () => $('error'),
    booksGrid: () => $('booksGrid'),
    modal: () => $('bookModal'),
    modalBody: () => $('modalBody'),
    closeModal: () => document.querySelector('.close'),
    filterBtns: () => $$('.filter-btn'),
    searchInput: () => $('searchInput'),
    searchBtn: () => $('searchBtn')
};

const toggleDisplay = (el, show, displayType = 'block') => { if (el) el.style.display = show ? displayType : 'none'; };
const setText = (el, text) => { if (el) el.textContent = text; };

const modalToggle = (show) => {
    const modal = elements.modal();
    if (!modal) return;
    modal.classList.toggle('show', show);
    modal.style.display = show ? 'flex' : 'none';
    document.body.style.overflow = show ? 'hidden' : 'auto';
};

const renderBookMeta = (book) => `
    <div class="meta-item"><strong>Year:</strong> ${getPublishYear(book)}</div>
    ${book.editionCount ? `<div class="meta-item"><strong>Editions:</strong> ${book.editionCount}</div>` : ''}
    <div class="meta-item"><strong>Status:</strong> <span style="color:${isBookAvailable(book) ? '#27ae60' : '#e74c3c'};">${isBookAvailable(book) ? 'Available' : 'Not available'}</span></div>
`;

const renderEditions = (editions, fallbackTitle) =>
    editions.length ? `<div class="editions"><h4>Editions</h4>${editions.map(e =>
        `<div class="edition-item"><strong>${e.title || fallbackTitle}</strong>${e.publish_date ? `<br>Published: ${e.publish_date}` : ''}${e.isbn_13 ? `<br>ISBN: ${e.isbn_13[0]}` : ''}${e.publishers ? `<br>Publisher: ${e.publishers.join(', ')}` : ''}</div>`
    ).join('')}</div>` : '';

const renderLinks = (links) =>
    links.length ? `<div class="links">${links.map(l => `<a href="${l.url}" target="_blank">${l.text}</a>`).join('')}</div>` : '';

// UI State
let currentBooks = [];
let currentCategory = 'trending';

// Funciones 
const handleSearch = () => {
    const query = elements.searchInput().value.trim();
    if (query) loadBooks(() => searchBooks(query), 'search');
};

const setActiveFilter = (category) => {
    elements.filterBtns().forEach(btn => btn.classList.toggle('active', btn.dataset.category === category));
    currentCategory = category;
};

const loadBooks = async (fetchFn, category) => {
    toggleDisplay(elements.loading(), true);
    toggleDisplay(elements.error(), false);
    try {
        const data = await fetchFn();
        currentBooks = data.docs?.map(createBook) || [];
        currentBooks.length ? displayBooks(currentBooks) : showError(`No books found for "${category}".`);
    } catch {
        showError(`Error loading ${category} books. Please try again.`);
    } finally {
        toggleDisplay(elements.loading(), false);
    }
};

const showError = (msg) => { setText(elements.error(), msg); toggleDisplay(elements.error(), true); toggleDisplay(elements.booksGrid(), false); };

const createBookCard = (book) => {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.addEventListener('click', () => showBookDetails(book));
    const rating = calculateRating(book);
    const coverURL = getBookCoverURL(book);
    card.innerHTML = `
        <div class="book-cover-container">
            ${coverURL ? `<img src="${coverURL}" alt="Cover of ${book.title}" class="book-cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"><div class="no-cover" style="display:none;">No cover</div>` : '<div class="no-cover">No cover</div>'}
        </div>
        <div class="book-info">
            <h3>${book.title}</h3>
            <p>${getAuthorsString(book)}</p>
            <div class="book-details">${renderBookMeta(book)}</div>
            <div class="rating"><div class="stars">${generateStarsHTML(rating)}</div><span>(${rating.toFixed(1)})</span></div>
        </div>`;
    return card;
};

const generateStarsHTML = (rating) =>
    Array.from({ length: 5 }, (_, i) => `<span class="star${i < Math.floor(rating) ? '' : ' empty'}">★</span>`).join('');

const displayBooks = (books) => {
    const grid = elements.booksGrid();
    grid.innerHTML = '';
    books.forEach(b => grid.appendChild(createBookCard(b)));
    toggleDisplay(grid, true, 'grid');
};

const showBookDetails = async (book) => {
    modalToggle(true);
    elements.modalBody().innerHTML = '<div style="text-align:center;padding:3rem;"><div class="spinner"></div><br>Loading...</div>';
    try {
        const [details, editions] = await Promise.all([
            getBookDetails(book.key).catch(() => ({})),
            getEditions(book.key).catch(() => ({ entries: [] }))
        ]);
        displayBookDetails(createBookDetails(book, details, editions.entries));
    } catch {
        elements.modalBody().innerHTML = `<div class="error">Error loading details.<br>${renderBookMeta(book)}</div>`;
    }
};

const displayBookDetails = (d) => {
    const book = d.basic;
    const coverURL = getBookCoverURL(book, 'L');
    elements.modalBody().innerHTML = `
        <div class="book-detail">
            ${coverURL ? `<img src="${coverURL}" alt="Cover of ${book.title}" class="book-detail-cover">` : '<div class="book-detail-cover no-cover">No cover available</div>'}
            <div class="book-detail-info">
                <h2>${book.title}</h2>
                <div>${getAuthorsString(book)}</div>
                <div class="book-meta">${renderBookMeta(book)}</div>
            </div>
        </div>
        <div class="description"><h4>Description</h4><p>${getBookDescription(d)}</p></div>
        ${renderEditions(d.editions, book.title)}
        ${renderLinks(getBookLinks(d))}
    `;
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    modalToggle(false);
    elements.closeModal()?.addEventListener('click', () => modalToggle(false));
    window.addEventListener('click', (e) => e.target === elements.modal() && modalToggle(false));
    document.addEventListener('keydown', (e) => e.key === 'Escape' && modalToggle(false));

    elements.filterBtns().forEach(btn => btn.addEventListener('click', () => {
        const category = btn.dataset.category;
        setActiveFilter(category);
        loadBooks(() => (category === 'trending' ? getTrendingBooks() : getBooksBySubject(category)), category);
    }));

    elements.searchBtn()?.addEventListener('click', handleSearch);
    elements.searchInput()?.addEventListener('keypress', (e) => e.key === 'Enter' && handleSearch());

    loadBooks(() => getBooksBySubject('science'), 'science');
});
