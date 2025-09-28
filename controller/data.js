let yearChart = null, authorChart = null;

window.onload = () => searchBooks('programming');

async function searchBooks(defaultQuery = null) {
    const query = defaultQuery || document.getElementById('searchInput').value || 'javascript';
    showLoading(true);

    try {
        const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=50`);
        if (!res.ok) throw new Error('Error HTTP');
        const data = await res.json();
        const books = data.docs || [];

        if (!books.length) return alert('No se encontraron libros');

        updateStats(books);
        renderYearChart(books);
        renderAuthorChart(books);
        document.getElementById('statsGrid').style.display = 'grid';
    } catch (err) {
        alert('Error al conectar con la API');
        console.error(err);
    } finally {
        showLoading(false);
    }
}

function renderYearChart(books) {
    const counts = {};
    books.forEach(b => {
        const y = b.first_publish_year;
        if (y && y > 1980) {
            const d = Math.floor(y / 10) * 10;
            counts[d] = (counts[d] || 0) + 1;
        }
    });

    const labels = Object.keys(counts).sort().map(y => y + 's');
    const data = labels.map(l => counts[l.replace('s','')]);

    if (yearChart) yearChart.destroy();
    yearChart = new Chart(document.getElementById('yearChart'), {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Libros publicados', data, backgroundColor: 'rgba(9,155,87,0.8)' }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'Libros por Década', font: { size: 16, weight: 'bold' } },
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true },
                x: { title: { display: true, text: 'Década' } }
            }
        }
    });
}

function renderAuthorChart(books) {
    const counts = {};
    books.forEach(b => b.author_name?.forEach(a => counts[a] = (counts[a] || 0) + 1));

    const top = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,6);
    const labels = top.map(([a]) => a.length>15 ? a.slice(0,15)+'...' : a);
    const data = top.map(([,c]) => c);

    if (authorChart) authorChart.destroy();
    authorChart = new Chart(document.getElementById('authorChart'), {
        type: 'pie',
        data: { labels, datasets: [{ data, backgroundColor: ['#099b57','#024425','#666','#1a1a1a','#d1d5db','#e0e0e0'] }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'Top 6 Autores', font: { size: 16, weight: 'bold' } },
                legend: { position: 'right', labels: { font: { size: 10 } } }
            }
        }
    });
}

function updateStats(books) {
    const authors = new Set(), years = [];
    books.forEach(b => {
        b.author_name?.forEach(a => authors.add(a));
        if(b.first_publish_year && b.first_publish_year > 1800) years.push(b.first_publish_year);
    });

    document.getElementById('totalBooks').textContent = books.length;
    document.getElementById('totalAuthors').textContent = authors.size;
    document.getElementById('avgYear').textContent = years.length ? Math.round(years.reduce((a,b)=>a+b)/years.length) : 0;
    document.getElementById('oldestBook').textContent = years.length ? Math.min(...years) : 0;
}

function showLoading(show) {
    ['yearChart','authorChart'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = show?'none':'block';
    });
}

// Enter para buscar
document.getElementById('searchInput').addEventListener('keypress', e => { if(e.key==='Enter') searchBooks(); });
