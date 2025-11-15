import axios, { AxiosError } from "axios";
// import { retrieveLaunchParams } from "@telegram-apps/sdk";
import { ZodError } from "zod";
import { LaunchParamsRetrieveError } from "@telegram-apps/sdk-react";

/* ==========================================================
   ===============   MOCK DATA DEFINITIONS   =================
   ========================================================== */

// Mock data for persons - expanded dataset for pagination testing
const firstNames = {
    male: ["Александр", "Дмитрий", "Иван", "Михаил", "Максим", "Артём", "Даниил", "Кирилл", "Андрей", "Егор", "Никита", "Илья", "Алексей", "Роман", "Сергей", "Владимир", "Павел", "Тимофей", "Матвей", "Денис"],
    female: ["Анна", "Мария", "Елена", "Ольга", "София", "Виктория", "Дарья", "Полина", "Анастасия", "Екатерина", "Александра", "Татьяна", "Юлия", "Наталья", "Ирина", "Алина", "Карина", "Валерия", "Кристина", "Вероника"]
};

const surnames = ["Иванов", "Петров", "Сидоров", "Смирнов", "Козлов", "Новиков", "Морозов", "Волков", "Лебедев", "Соколов", "Попов", "Васильев", "Павлов", "Фёдоров", "Михайлов", "Николаев", "Алексеев", "Семёнов", "Григорьев", "Степанов", "Романов", "Егоров", "Макаров", "Андреев", "Орлов"];

const classes = ["11-1", "11-2", "11-3", "11-4", "11-5"];

// Generate mock persons
const generateMockPersons = () => {
    const persons = [];
    let id = 1;

    // Generate male persons
    for (let i = 0; i < 30; i++) {
        const name = firstNames.male[i % firstNames.male.length];
        const surname = surnames[i % surnames.length];
        const schoolClass = classes[i % classes.length];
        persons.push({
            id: id++,
            name,
            surname,
            schoolClass,
            rating: 1000,
            photo: `https://i.pravatar.cc/300?img=${12 + (i % 50)}`,
            male: true
        });
    }

    // Generate female persons
    for (let i = 0; i < 30; i++) {
        const name = firstNames.female[i % firstNames.female.length];
        const surname = surnames[i % surnames.length] + "а";
        const schoolClass = classes[i % classes.length];
        persons.push({
            id: id++,
            name,
            surname,
            schoolClass,
            rating: 1000,
            photo: `https://i.pravatar.cc/300?img=${1 + (i % 50)}`,
            male: false
        });
    }

    return persons;
};

export const mockPersons = generateMockPersons();

// API Mock functions
export const getPersons = () => {
    return mockPersons.sort((a, b) => b.rating - a.rating);
};

export const getPersonsByGender = (male) => {
    return mockPersons
        .filter(person => person.male === male)
        .sort((a, b) => b.rating - a.rating);
};

export const getPerson = (id) => {
    return mockPersons.find(person => person.id === parseInt(id));
};

export const getRandomDuo = (male) => {
    const filtered = mockPersons.filter(person => person.male === male);
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2);
};

export const updatePersonRating = (id, ratingChange) => {
    const person = mockPersons.find(p => p.id === id);
    if (person) {
        person.rating += ratingChange;
    }
};

/* ==========================================================
   ===============   CORE REQUEST WRAPPER   =================
   ========================================================== */

async function requestData(method, path, data = null, config = {}) {
    let useMock = false; // Use real backend now

    try {
        if (useMock) {
            const mock = getMockResponse(method, path, data);
            return mock;
        }

        // Normalize path: ensure it starts with /api/ if it doesn't already
        let normalizedPath = path.startsWith('/') ? path : `/${path}`;
        if (!normalizedPath.startsWith('/api/')) {
            normalizedPath = `/api${normalizedPath}`;
        }

        // Use relative URL so Caddy can proxy to backend
        const url = normalizedPath;

        console.log(`[${method.toUpperCase()}]`, url, data);

        // Add dummy Authorization header for local development
        // Backend filter requires "tma " prefix but validation is disabled in dev
        const headers = {
            "Content-Type": "application/json",
            "Authorization": "tma auth_date=1760817588&hash=dummy&user=%7B%22id%22%3A1%2C%22first_name%22%3A%22Dev%22%7D",
            ...config.headers,
        };

        const response = await axios({
            method,
            url,
            data: data,
            headers,
            ...config,
        });

        return {success: true, data: response.data};
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error(`[${method.toUpperCase()}] Axios error:`, error.message);
            return {success: false, message: error.message};
        } else if (error instanceof ZodError) {
            console.error(`[${method.toUpperCase()}] Zod validation failed:`, error.errors);
            return {success: false, message: error.message};
        } else if (error instanceof LaunchParamsRetrieveError) {
            console.error(`[${method.toUpperCase()}] Failed to retrieve initData:`, error);
            return {success: false, message: error.message};
        } else {
            console.error(`[${method.toUpperCase()}] Unexpected error:`, error);
            return {success: false, message: "Unexpected error occurred."};
        }
    }
}

/* ==========================================================
   ===============   MOCK RESPONSE HANDLER   =================
   ========================================================== */

function getMockResponse(method, path, data) {
    console.log("MockResponse", method, path, data);

    // --- PERSON ENDPOINTS ---
    if (path === "api/persons" && method === "get") {
        return {success: true, data: getPersons()};
    }

    if (path === "api/persons/male" && method === "get") {
        return {success: true, data: getPersonsByGender(true)};
    }

    if (path.match(/^api\/persons\/(\d+)$/) && method === "get") {
        const id = path.split("/").pop();
        return {success: true, data: getPerson(id)};
    }

    if (path.match(/^api\/persons\/(\d+)$/) && method === "put") {
        const id = path.split("/").pop();
        const person = mockPersons.find(p => p.id === parseInt(id));
        if (person) {
            // Update person logic here
            return {success: true, message: "Person updated", data: person};
        } else {
            return {success: false, message: "Person not found"};
        }
    }

    if (path.match(/^api\/persons\/(\d+)$/) && method === "delete") {
        const id = path.split("/").pop();
        // Delete person logic here
        return {success: true, message: "Person deleted"};
    }

    if (path === "api/persons" && method === "post") {
        // Create person logic here
        return {success: true, message: "Person created", data: {id: mockPersons.length + 1}};
    }

    if (path === "api/persons/getduo/male" && method === "get") {
        return { success: true, data: getRandomDuo(true) };
    }

    if (path === "api/persons/getduo/female" && method === "get") {
        const mockResponse = { success: true, data: getRandomDuo(false) };
        console.log("MockResponse for /api/persons/getduo/female:", mockResponse);
        return mockResponse;
    }

    console.log("Failed to mock")

}

/* ==========================================================
   ===============   PUBLIC HTTP HELPERS   ==================
   ========================================================== */

export async function getData(path, config = {}) {
    return requestData("get", path, null, config);
}

export async function postData(path, data, config = {}) {
    return requestData("post", path, data, config);
}

export async function putData(path, data, config = {}) {
    return requestData("put", path, data, config);
}

export async function patchData(path, data, config = {}) {
    return requestData("patch", path, data, config);
}

export async function deleteData(path, config = {}) {
    return requestData("delete", path, null, config);
}

