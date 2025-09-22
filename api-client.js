// API клиент для работы с NunaCake API (с CORS proxy)
const API_BASE_URL = 'http://185.184.122.156:8081/api';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

class NunaCakeAPI {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 минут
    }

    async request(endpoint, options = {}) {
        const targetUrl = this.baseURL + endpoint;
        const proxyUrl = CORS_PROXY + encodeURIComponent(targetUrl);
        const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
        
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const response = await fetch(proxyUrl, {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                body: options.body ? JSON.stringify(options.body) : undefined
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);
            
            if (this.cache.has(cacheKey)) {
                console.log('Using cached data due to API error');
                return this.cache.get(cacheKey).data;
            }
            
            throw error;
        }
    }

    async getCakes() { return await this.request('/cakes'); }
    async getCake(id) { return await this.request(`/cakes/${id}`); }
    async getLayers() { return await this.request('/layers'); }
    async getCreams() { return await this.request('/creams'); }
    async getFillings() { return await this.request('/fillings'); }
    async healthCheck() { return await this.request('/health'); }
    clearCache() { this.cache.clear(); }
}

const apiClient = new NunaCakeAPI();
let cakeData = {};
let layers = [];
let creams = [];
let fillings = [];
let popularCakes = [];

async function loadDataFromAPI() {
    try {
        console.log('🔄 Загрузка данных с API через CORS proxy...');
        
        const [cakesResponse, layersResponse, creamsResponse, fillingsResponse] = await Promise.all([
            apiClient.getCakes(),
            apiClient.getLayers(),
            apiClient.getCreams(),
            apiClient.getFillings()
        ]);

        cakeData = {};
        cakesResponse.data.forEach(cake => {
            cakeData[cake.id] = {
                name: cake.name,
                difficulty: cake.difficulty,
                time: cake.time,
                servings: cake.servings,
                image: cake.image_url,
                thumbnail: cake.thumbnail_url,
                description: cake.description,
                tips: cake.tips,
                components: { layers: [], creams: [], fillings: [] }
            };
        });

        layers = layersResponse.data.map(layer => ({
            id: layer.id,
            name: layer.name,
            image: layer.image_url,
            description: layer.description,
            ingredients: layer.ingredients || [],
            bakingTime: layer.baking_time,
            temperature: layer.temperature
        }));

        creams = creamsResponse.data.map(cream => ({
            id: cream.id,
            name: cream.name,
            image: cream.image_url,
            description: cream.description,
            ingredients: cream.ingredients || [],
            preparationTime: cream.preparation_time,
            difficulty: cream.difficulty
        }));

        fillings = fillingsResponse.data.map(filling => ({
            id: filling.id,
            name: filling.name,
            image: filling.image_url,
            description: filling.description,
            ingredients: filling.ingredients || [],
            preparationTime: filling.preparation_time,
            difficulty: filling.difficulty
        }));

        popularCakes = Object.keys(cakeData).map(id => ({
            id: id,
            name: cakeData[id].name,
            difficulty: cakeData[id].difficulty,
            time: cakeData[id].time,
            image: cakeData[id].image,
            thumbnail: cakeData[id].thumbnail,
            description: cakeData[id].description
        }));

        console.log('✅ Данные загружены с API через CORS proxy');
        console.log('📊 Загружено:', {
            cakes: cakesResponse.data.length,
            layers: layersResponse.data.length,
            creams: creamsResponse.data.length,
            fillings: fillingsResponse.data.length
        });
        return true;
    } catch (error) {
        console.error('❌ Ошибка загрузки данных с API:', error);
        return false;
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    const success = await loadDataFromAPI();
    if (success) {
        console.log('🎉 Приложение готово к работе!');
        // Вызываем функции инициализации, если они существуют
        if (typeof initializeApp === 'function') {
            initializeApp();
        }
    } else {
        console.error('❌ Не удалось загрузить данные с API');
    }
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { apiClient, loadDataFromAPI, cakeData, layers, creams, fillings, popularCakes };
} else {
    window.apiClient = apiClient;
    window.loadDataFromAPI = loadDataFromAPI;
    window.cakeData = cakeData;
    window.layers = layers;
    window.creams = creams;
    window.fillings = fillings;
    window.popularCakes = popularCakes;
}



