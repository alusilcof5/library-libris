//URLs de la API
const api_Url = {
    baseURL: "https://openlibrary.org",
    trendingURL: "https://openlibrary.org/trending/daily.json",
    subjectsURL: "https://openlibrary.org/subjects",
    searchURL: "https://openlibrary.org/search.json",
    coverURL: "https://covers.openlibrary.org/b"
};

// Función para hacer peticiones HTTP con manejo de errores
const fetchWithErrorHandling = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error en petición a ${url}:`, error);
        throw error;
    }
};

// Procesar datos de libros
const processWorksData = (works) => {
    return {
        docs: works.slice(0, 30).map(work => ({
            key: work.key || '',
            title: work.title || 'Título no disponible',
            authors: work.authors?.map(author => author.name) || [],
            first_publish_year: work.first_publish_year || null,
            cover_i: work.cover_id || null,
            subject: work.subject || [],
            availability: work.availability || {},
            edition_count: work.edition_count || 0,
            lending_edition_s: work.lending_edition_s || null,
            has_fulltext: work.has_fulltext || false,
            public_scan_b: work.public_scan_b || false
        }))
    };
};

// trending
const getTrendingBooks = async (limit = 50) => {
    try {
        const data = await fetchWithErrorHandling(`${api_Url.trendingURL}?limit=${limit}`);
        return processWorksData(data.works || []);
    } catch (error) {
        console.error('Error obteniendo trending books:', error);
        throw error;
    }
};

const getBooksBySubject = async (subject, limit = 50) => {
    try {
        const url = `${api_Url.subjectsURL}/${subject}.json?limit=${limit}&details=true`;
        const data = await fetchWithErrorHandling(url);
        return processWorksData(data.works || []);
    } catch (error) {
        console.error(`Error obteniendo libros de ${subject}:`, error);
        throw error;
    }
};

// Busqueda
const searchBooks = async (query, limit = 20) => {
    try {
        const url = `${api_Url.searchURL}?q=${encodeURIComponent(query)}&limit=${limit}&fields=key,title,author_name,first_publish_year,cover_i,subject,edition_count,has_fulltext,public_scan_b`;
        return await fetchWithErrorHandling(url);
    } catch (error) {
        console.error('Error buscando libros:', error);
        throw error;
    }
};

// Detalles de un libro
const getBookDetails = async (workKey) => {
    try {
        const cleanKey = workKey.replace('/works/', '');
        const url = `${api_Url.baseURL}/works/${cleanKey}.json`;
        return await fetchWithErrorHandling(url);
    } catch (error) {
        console.error('Error obteniendo detalles:', error);
        throw error;
    }
};

// Ediciones 
const getEditions = async (workKey) => {
    try {
        const cleanKey = workKey.replace('/works/', '');
        const url = `${api_Url.baseURL}/works/${cleanKey}/editions.json?limit=10`;
        return await fetchWithErrorHandling(url);
    } catch (error) {
        console.error('Error obteniendo ediciones:', error);
        return { entries: [] };
    }
};

// URL de portada
const getCoverURL = (coverId, size = 'M') => {
    if (!coverId) return null;
    return `${api_Url.coverURL}/id/${coverId}-${size}.jpg`;
};


